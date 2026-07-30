# LMS_SYSTEM + LMS_BACKEND — Tài liệu luồng chạy code chi tiết

> **Mục đích:** Tài liệu này mô tả CHI TIẾT luồng chạy code (request → response) cho từng action chính trong hệ thống LMS, bao gồm cả frontend (Next.js) và backend (Django + Cassandra). Mỗi flow có:
> - Code snippets với file paths + line numbers
> - Flow diagram dạng text
> - DB tables bị ảnh hưởng
> - Side effects (FCM, indexing, R2 upload, ...)

---

## MỤC LỤC

1. [Kiến trúc tổng thể](#1-kiến-trúc-tổng-thể)
2. [Generate Quiz (Background Task + Polling)](#2-generate-quiz-background-task--polling)
3. [Course AI / RAG](#3-course-ai--rag)
4. [Exam Proctoring](#4-exam-proctoring)
5. [Payment MoMo](#5-payment-momo)
6. [Document Upload](#6-document-upload)
7. [Auth: Login + Refresh Token](#7-auth-login--refresh-token)
8. [Chat Real-time](#8-chat-real-time)
9. [WebRTC Meeting](#9-webrtc-meeting)
10. [Ranking / XP / Level](#10-ranking--xp--level)
11. [Calendar + Attendance (WebSocket presence)](#11-calendar--attendance-websocket-presence)
12. [Social Feed](#12-social-feed)
13. [Face Enrollment + Face Monitor](#13-face-enrollment--face-monitor)
14. [Quiz Gameplay (Student)](#14-quiz-gameplay-student)
15. [Certificate](#15-certificate)
16. [Pattern chung FE ↔ BE](#16-pattern-chung-fe--be)

---

## 1. Kiến trúc tổng thể

### 1.1. Hai project

| Project | Path | Stack |
|---|---|---|
| **LMS_SYSTEM** (frontend) | `/Users/siminh/PycharmProjects/LMS_SYSTEM` | Monorepo yarn + turbo · Next.js 16 + React 19 · TypeScript 5 · Tailwind 4 + shadcn/ui (style `base-nova`) · Redux Toolkit 2.5 · RHF + Zod · Firebase RTDB · WebSocket |
| **LMS_BACKEND** (backend) | `/Users/siminh/PycharmProjects/LMS_BACKEND` | Django 6 + DRF · **Apache Cassandra** (không SQL) · `djangorestframework-simplejwt` · `django-rq` + Redis (background) · `channels` + `daphne` (WebSocket) · Ollama local (AI) · LanceDB (vector) · Typesense (search) · Cloudflare R2 (storage) · FastAPI microservice (face) |

### 1.2. Frontend apps

| App | Port | Đối tượng |
|---|---|---|
| `apps/consumer-web` | 3000 | Học sinh / sinh viên (Consumer) |
| `apps/space-web` | 3003 | Giáo viên / tổ chức (Space) |
| `packages/shared` | — | shadcn components, locales, layout components |

### 1.3. Backend apps (19 Django apps)

| App | Chức năng |
|---|---|
| `core` | Shared infrastructure: auth backend, Cassandra base, R2, Firebase, search indexer, AI clients |
| `core.search_engine` | Typesense full-text indexer |
| `features.account` | Space (teacher) + Consumer (student), OTP, address, user setting |
| `features.course` | Course + Classroom + Exam + Meeting Room |
| `features.resource` | File upload lên R2 |
| `features.chat` | Conversation + messages (real-time) |
| `features.ai` | AI conversation session + LangGraph |
| `features.quiz` | **Quiz game + AI generation từ PDF** |
| `features.quiz_collection` | Quiz collections + certificate |
| `features.notification` | FCM push + Firebase RTDB |
| `features.calendar` | Events + attendance + leave request |
| `features.payment` | MoMo payment |
| `features.history` | Lịch sử hoạt động |
| `features.face` | Face recognition (gọi microservice) |
| `features.portfolio` | Portfolio học sinh |
| `features.ranking` | XP, achievement, leaderboard |
| `features.social` | Post, like, comment, follow |
| `features.dashboard` | KPIs dashboard |
| `face_service` | FastAPI microservice (InsightFace) |

### 1.4. Database (Cassandra)

- **Không dùng SQL.** Tất cả data ở Apache Cassandra, keyspace `lms_system`.
- Không có FK — quan hệ qua UUID thuần.
- Soft delete mặc định: `is_deleted`, `deleted_at`.
- Partition key thường là natural column (`created_by`, `classroom_id`, `student_id`).
- Đồng bộ schema: `python manage.py lms_sync_cassandra` (KHÔNG `migrate`).
- Cluster thật nằm ở `127.0.0.1:9042`.

### 1.5. Pattern chung

```
UI Component (RHF + Zod form)
    ↓ onSubmit
Custom Hook (useUploadDoc, useCreateFolder, ...)
    ↓ API call
BaseRestApiClient.get/post  → fetch + JWT auto-attach + 401 auto-refresh
    ↓ HTTP
DRF ViewSet → mixin (SpaceScopeMixin | ConsumerScopeMixin)
    ↓
Service layer (QuizService, ClassroomService, ...)  ← business logic
    ↓
Repository layer  ← query/mutation
    ↓
Cassandra table  ← durable storage
    +
Side effects: RQ enqueue / Typesense index / R2 upload / FCM push
```

---

## 2. Generate Quiz (Background Task + Polling)

Đây là flow phức tạp nhất, dùng **RQ background task + frontend polling** — pattern chính cho mọi tác vụ AI chạy lâu.

### 2.1. 3 mode của Generate Quiz

| Mode | Endpoint | Pattern | Khi nào dùng |
|---|---|---|---|
| **Sync** | `POST /api/v1/space/quiz/generate/` | Request chờ AI xong (~1-3 phút) | Legacy, không dùng trong UI |
| **Streaming** | `POST /api/v1/space/quiz/generate-stream/` | SSE, tạo quiz `draft` rồi ghi từng câu | Alternative |
| **Background (RQ)** ⭐ | `POST /api/v1/space/quiz/generate-task/` | Enqueue job → trả `task_id` ngay → frontend poll | **Production** |

### 2.2. Luồng tổng thể (RQ mode)

```
USER click "Generate Quiz" (Wand2 icon) ở /space/quizzes
  ↓
apps/space-web/src/app/space/(main)/quizzes/page.tsx:117-123
  setShowGenerateModal(true)
  ↓
GenerateQuizModal.tsx (RHF + Zod) → user upload PDF + title + num_questions
  ↓ submit
quizTasksApi.createGenerateTask(formData)  [apps/space-web/src/lib/api/quiz-tasks.ts]
  → POST /api/v1/space/quiz/generate-task/  (multipart, PDF only)
  ↓
[BACKEND] features/quiz/viewsets/space_quiz_viewset.py:374-420
  generate_task() action
  ├─► QuizGenerateRequestSerializer.validate()
  ├─► _extract_pdf_text() ← pypdf.PdfReader
  ├─► django_rq.get_queue('default').enqueue(
  │     generate_quiz_task,
  │     args=(teacher_uid, content, quiz_type, num_questions),
  │     job_id=uuid4, job_timeout=300)
  │   job.meta = {kind:'generate', title, total_steps, progress:0}
  └─► Response 202 {task_id, status:"queued"}
  ↓
Redux: quizTasksSlice lưu task → useQuizTaskPolling hook active
  ↓
[ASYNC - RQ Worker] features/quiz/tasks/generate_quiz_task.py:39
  generate_quiz_task(teacher_uid, content, quiz_type, num_questions)
  ├─► _save_meta(progress=5, current_step=1)            [Redis: job.meta]
  │
  ├─► QuizGenerationService.generate(content, quiz_type, num_questions)
  │     [features/quiz/services/quiz_generation_service.py:306]
  │   ├─► _get_messages() — build system+user prompt
  │   ├─► AIClient.chat_sync_with_fallback()
  │   │     [core/ai/llm/services/ai_client.py:38]
  │   │   POST http://localhost:11434/api/chat
  │   │   models chain: qwen2.5:3b → 7b → 14b → llama3.1:8b → mistral:7b
  │   └─► _parse_quiz_payload() → {title, description, questions[]}
  │
  ├─► _save_meta(progress=70, current_step=N-1)
  │
  ├─► QuizService.create_quiz_with_questions()
  │     [features/quiz/services/quiz_service.py:158]
  │   ├─► QuizRepository.create()            → INSERT quiz_quizzes
  │   ├─► QuizQuestionRepository.bulk_create() → INSERT quiz_questions × N
  │   └─► LMSIndexer.index_quiz()            → POST Typesense
  │
  └─► _save_meta(progress=100, quiz_uid=..., title=...)
     return {quiz_uid, title, questions_count}      [Redis: job.result]
  ↓
[FRONTEND POLLING] useQuizTaskPolling
  Mỗi 2-3-5s (panel mở) hoặc 15s (idle) gọi:
  GET /api/v1/space/quiz/tasks/<task_id>/
  ↓
[BACKEND] features/quiz/viewsets/space_quiz_viewset.py:485-511
  task_status() action
  ├─► Job.fetch(task_id, connection=queue.connection)
  ├─► RQ_STATUS_MAP: QUEUED→queued, STARTED→running, FINISHED→successful, FAILED→failed
  └─► Response {task_id, status, result, error}
  ↓
Khi status === 'completed':
  → Redux notifiedTaskIds push → toast "Open" → navigate /space/quizzes/{quiz_uid}
```

### 2.3. Polling config

**File:** `apps/space-web/src/lib/hooks/useQuizTaskPolling.ts`

```typescript
const PANEL_INTERVALS_MS = [2000, 3000, 5000];  // ramp-up khi panel mở
const IDLE_INTERVAL_MS = 15000;                  // khi không có task active
const MAX_BACKOFF_MS = 60000;                    // exponential backoff khi lỗi
const ACTIVE_STATUSES = ['queued', 'running'];

// Mỗi tick:
//  1. quizTasksApi.list() — batch fetch tất cả tasks
//  2. Nếu list fail → exponential backoff (5s → 10s → 20s → 40s → 60s)
//  3. Nếu list OK → duyệt activeIds, retrieve(id) cho mỗi task
//  4. Kiểm tra task vừa chuyển sang completed/failed → toast
//  5. document.hidden → skip tick; visibilitychange → resume
```

Được mount ở `apps/space-web/src/components/AppShell.tsx:237` → chạy ngầm toàn app.

### 2.4. Streaming mode (alternative)

**File:** `apps/space-web/src/lib/api/quiz.ts:30-72` — `generateStream()`

Dùng `fetch().body.getReader()` để đọc SSE stream `data: {...}` line:

```typescript
const reader = res.body.getReader();
const decoder = new TextDecoder();
let buffer = '';
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  buffer += decoder.decode(value, { stream: true });
  const lines = buffer.split('\n');
  buffer = lines.pop() ?? '';
  for (const line of lines) {
    if (!line.startsWith('data: ')) continue;
    const event = JSON.parse(line.slice(6));
    onEvent(event);  // {type: 'meta'|'question'|'done'|'error', ...}
  }
}
```

**Backend SSE** (`features/quiz/viewsets/space_quiz_viewset.py:131-200`):
- Mở `StreamingHttpResponse(content_type='text/event-stream')`
- Generator `QuizGenerationService.generate_stream()`:
  - `AIClient.chat_stream()` gọi Ollama `stream=True`
  - Parse NDJSON bằng `_iter_ndjson()` (brace-depth tracking)
  - Yield events: `meta` → `question × N` → `done`
- View consumer:
  - `meta` → `service.create_quiz_shell()` (status='draft', questions_count=0)
  - `question` → `service.add_question(quiz, event, index)` ghi từng câu vào DB
  - `done` → `service.finalize_quiz(quiz, total)` set status='published'

### 2.5. DB ảnh hưởng

| Layer | Bị ảnh hưởng |
|---|---|
| **Cassandra** | `quiz_quizzes` (1 row mới, status='published') · `quiz_questions` (N rows, partition by quiz_id) |
| **Redis** | `rq:queue:default` (job) · `rq:job:<task_id>` (meta + result) |
| **Typesense** | Document quiz mới được index |
| **Frontend Redux** | `quizTasks.byId`, `quizTasks.ids`, `quizTasks.notifiedTaskIds` |

### 2.6. AI client + Ollama

**File:** `core/ai/llm/services/ai_client.py:19`

```python
class AIClient:
    @staticmethod
    def chat_sync_with_fallback(messages, ...): ...     # chain qwen → llama → mistral
    @staticmethod
    def chat_stream(messages, ...): ...                 # SSE từ Ollama
    @staticmethod
    def chat_with_image(messages, images, ...): ...     # vision model = llava
    @staticmethod
    def embed_texts(texts): ...                         # bge-m3
```

**File:** `core/ai/llm/services/ollama_client.py:40-84`

```python
class OllamaClient:
    _BASE_URL = "http://localhost:11434"
    _DEFAULT_MODEL = "qwen2.5:3b"
    _DEFAULT_FALLBACK_MODELS = ["qwen2.5:7b", "qwen2.5:14b", "llama3.1:8b", "mistral:7b"]
    _DEFAULT_EMBED_MODEL = "nomic-embed-text"
    _DEFAULT_VISION_MODEL = "llava"
```

### 2.7. Các file paths chính

**Frontend:**
- `apps/space-web/src/lib/api/quiz-tasks.ts` — `QuizTasksApiClient`
- `apps/space-web/src/lib/api/types.ts:798-824` — `QuizTask`, `QuizTaskStatus`
- `apps/space-web/src/lib/redux/quizTasksSlice.ts` — Redux slice
- `apps/space-web/src/lib/hooks/useQuizTaskPolling.ts` — polling hook
- `apps/space-web/src/components/quiz/GenerateQuizModal.tsx` — modal
- `apps/space-web/src/components/quiz/TaskCenterBell.tsx` — bell badge
- `apps/space-web/src/components/quiz/TaskCenterPanel.tsx` — panel
- `apps/space-web/src/app/space/(main)/quizzes/page.tsx` — library page

**Backend:**
- `features/quiz/viewsets/space_quiz_viewset.py:374-420` — `generate_task`
- `features/quiz/viewsets/space_quiz_viewset.py:485-511` — `task_status`
- `features/quiz/viewsets/space_quiz_viewset.py:514-574` — `list_tasks`
- `features/quiz/viewsets/space_quiz_viewset.py:131-200` — `generate_stream` (SSE)
- `features/quiz/viewsets/space_quiz_viewset.py:86-129` — `generate` (sync, legacy)
- `features/quiz/tasks/generate_quiz_task.py:39-115` — RQ job
- `features/quiz/services/quiz_generation_service.py:306` — `generate()`
- `features/quiz/services/quiz_generation_service.py:345` — `generate_stream()`
- `features/quiz/services/quiz_service.py:158` — `create_quiz_with_questions()`

---

## 3. Course AI / RAG

Cho phép teacher hỏi AI dựa trên tài liệu của lớp (PDF, txt, md, csv). Dùng **LanceDB** làm vector store và **Ollama** để generate.

### 3.1. URL endpoints

| Method | Path | View |
|---|---|---|
| POST | `/api/v1/space/course/ai/ask/` | `CourseAIViewSet.ask` |
| POST | `/api/v1/space/course/ai/ask-stream/` | `CourseAIViewSet.ask_stream` (SSE) |
| POST | `/api/v1/space/course/ai/ingest/` | `CourseAIViewSet.ingest` |
| DELETE | `/api/v1/space/course/ai/index/` | `CourseAIViewSet.delete_index` |

### 3.2. Flow `ask` (sync)

```
POST /api/v1/space/course/ai/ask/
  body: {question, top_k}
  query: ?classroom_id=X&document_id=Y
  ↓
[BACKEND] features/course/ai/viewsets/ai_viewset.py:37-51
  CourseAIViewSet.ask (SpaceScopeMixin → IsSpaceUser)
  ├─► AIQueryParamSerializer (classroom_id, document_id optional)
  ├─► AIAskSerializer (question, top_k required)
  └─► CourseAIService.ask(teacher_id, question, classroom_id?, document_id?, top_k)
        [features/course/ai/services/course_ai_service.py:99-124]
      ├─► _check_classroom_permission / _check_document_permission
      │     (Cassandra Classroom + Resource owner check)
      └─► RAGPipeline.ask(question, classroom_id, document_id, top_k)
            [core/ai/rag/services/rag_pipeline.py:424-453]
          ├─► embed_query(question) → Ollama POST /api/embed
          ├─► LanceDB query với prefilter (classroom_id required!)
          ├─► build_context(hits) → concat chunks
          └─► AIClient.chat_sync(question, context, system_prompt)
                → Ollama POST /api/chat
                → return {"answer": "...", "sources": [...]}
```

### 3.3. Flow `ingest` (upload document → LanceDB)

```
POST /api/v1/space/course/ai/ingest/?classroom_id=X&document_id=Y
  body: {resource_id}
  ↓
[BACKEND] features/course/ai/services/course_ai_service.py:186-245
  CourseAIService.ingest(resource_id, classroom_id, document_id)
  ├─► Permission check (teacher owns classroom + resource)
  ├─► Validate file_type in {pdf, txt, md, csv}
  ├─► Build metadata = {resource_uid, classroom_id, document_id}
  ├─► Download resource từ R2 (temp file)
  └─► RAGPipeline.ingest(file_path, metadata)
        [core/ai/rag/services/rag_pipeline.py:360-422]
      ├─► _load_and_chunk:
      │     PDF/Office → viparse.load(file, ocr=True) [Vietnamese-first parser]
      │     txt/md/csv → TextLoader
      │     RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
      ├─► Idempotent: delete old chunks cho cùng document_id
      ├─► Embed all chunks qua Ollama (bge-m3)
      └─► LanceVectorService.add_batch(rows) → write PyArrow schema
```

### 3.4. Flow `ask-stream` (SSE)

**Backend** `features/course/ai/viewsets/ai_viewset.py:55-74`:

```python
@action(detail=False, methods=["post"], url_path="ask-stream")
def ask_stream(self, request):
    ...
    resp = StreamingHttpResponse(
        to_async_iterator(CourseAIService.ask_stream(...)),
        content_type="text/event-stream; charset=utf-8",
    )
    resp["Cache-Control"] = "no-cache"
    resp["X-Accel-Buffering"] = "no"
    return resp
```

**SSE events** (yielded từ `CourseAIService._stream_answer` `course_ai_service.py:146-180`):
- `data: {"type":"chunk","text":"..."}\n\n` — incremental text
- `data: {"type":"sources","data":[{...}]}\n\n` — retrieved sources (cuối)
- `data: {"type":"error","message":"..."}\n\n` — lỗi
- `data: [DONE]\n\n` — kết thúc

**Quan trọng — async iterator bridge** (`core/ai/streaming/async_stream.py:35-42`):
```python
async def to_async_iterator(sync_gen):
    it = iter(sync_gen)
    step = sync_to_async(_safe_next, thread_sensitive=False)
    while True:
        item = await step(it)
        if item is _SENTINEL: return
        yield item
```
Không có bridge này, Django ASGIHandler sẽ `sync_to_async(list)(self.streaming_content)` — drain generator trước khi gửi.

**Frontend SSE** `apps/space-web/src/components/classroom/details/hooks/useAIAskStream.ts`:

```typescript
const reader = res.body.getReader();
const decoder = new TextDecoder();
let buffer = '';
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  buffer += decoder.decode(value, { stream: true });
  const lines = buffer.split('\n');
  buffer = lines.pop() ?? '';
  for (const line of lines) {
    if (!line.startsWith('data: ')) continue;
    const raw = line.slice(6).trim();
    if (raw === '[DONE]') break;
    const event = JSON.parse(raw);
    onEvent(event);
  }
}
```

### 3.5. LanceDB

**File:** `core/ai/vector_store/services/lance_vector_service.py`

- **Storage:** `{BASE_DIR}/lancedb/<collection_name>/` — default `lms_document_text_store` (L63 of rag_pipeline.py).
- **Schema:** `id, vector(list<float32>), document, classroom_id, document_id, chunk_index, section, metadata_json`
- **Scalar indices** (auto create on first open): `classroom_id`, `document_id`, `section`
- **Prefilter** (L142-158): `tbl.search().where("classroom_id = 'X' AND document_id = 'Y'", prefilter=True)`
- **Per-resource round-robin** (L181-208): giới hạn mỗi document không dominate top-K
- **Singleton cache** (L175-202 of rag_pipeline.py): `_store_cache[0]` là 1-slot cache, dim backfill lazy

### 3.6. RAG Pipeline steps

| Step | Lines | Description |
|---|---|---|
| ① Load & Chunk | L94-159 | PDF/Office → `viparse.load(file, ocr=True)` (Vietnamese-first + Tesseract OCR); txt/md/csv → `TextLoader`. `RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)` |
| ② Embed | L167-171 | `OllamaEmbeddings().embed_documents(texts)` POST `/api/embed` |
| ③ Store | L409-419 | `LanceVectorService.add_batch(rows)` |
| ④ Retrieve | L205-262 | Cosine similarity + SQL prefilter (`classroom_id` bắt buộc — line 244-245) |
| ⑤ Build context | L306-312 | Join chunks, return `(context_str, sources_list)` |
| ⑥ Generate | L318-353 | Sync `chat_sync` hoặc streaming `chat_stream` |

### 3.7. DB ảnh hưởng

| Layer | Bị ảnh hưởng |
|---|---|
| **Cassandra** | `classroom_classrooms` (read permission) · `resource_resources` (read permission) |
| **LanceDB** | collection `lms_document_text_store` (vectors + metadata) |
| **R2** | Download file PDF/text trong quá trình ingest |
| **Ollama** | HTTP POST embed + chat |

---

## 4. Exam Proctoring

Online exam với giám sát camera, ghi log visibility breaks, auto force-submit khi vi phạm.

### 4.1. Models

#### `Exam` (`features/course/exam/models/exam.py:6-58`)
- Table: `course_exams`
- `classroom_id`, `teacher_id`, `title`, `content_type` (markdown|quiz|file|pdf|image), `body`, `ref_id`, `status`, `is_online_active`, `exam_type` (assignment|quiz), `exam_period` (regular|midterm|final), `max_grade`, `camera_required`, `exam_mode` (online|offline), `duration_seconds`, `late_threshold_seconds`, `max_visibility_breaks` (default 3), `max_face_warnings` (default 0).

#### `ExamSession` (`features/course/exam/models/exam_session.py:6-28`)
- Table: `course_exam_sessions`
- `exam_id`, `student_id`, `token`, `token_status` (pending|active|expired|completed), `token_expires_at`, `started_at`, `ends_at`, `visibility_breaks_count`, `face_warnings_count`, `last_event_at`

#### `ExamEventLog` (`features/course/exam/models/exam_event_log.py:9-41`)
- Table: `exam_event_logs` (unified audit + face log)
- Partition: `exam_id`, Clustering: `uid DESC`
- `event_kind` ('audit'|'face'), `event_type`, `event_data` (JSON), `created_at`

#### `ExamSubmission` (`features/course/exam/models/exam_submission.py:7-55`)
- Table: `course_exam_submissions`
- `submission_type` (multiple_choice|online_quiz|file|essay)
- AI fields: `ai_model`, `ai_rubric`, `ai_reason`, `ai_breakdown`, `ai_sources`, `ai_confidence`
- `is_effective` (teacher toggle), `force_submitted`, `force_submit_reason`

### 4.2. Luồng mở exam (teacher)

```
TEACHER: POST /api/v1/space/exam/<uid>/open-online/
  body: { late_threshold_seconds, duration_seconds, camera_required, max_face_warnings }
  ↓
[BACKEND] features/course/exam/services/exam_session_service.py:19-73
  ExamSessionService.open_online(exam, teacher, params)
  ├─► Validate exam exists, teacher owns, exam_mode='online'
  ├─► Set exam.is_online_active=True, opened_at=now, status='ongoing'
  ├─► Fetch classroom members (role=student, status=approved)
  └─► For each student: create or refresh ExamSession
        token=uuid4(no dashes), token_status='pending', token_expires_at=now+5min
  ↓
Teacher gửi token URL cho từng student thủ công

close_online (L75-89): Set is_online_active=False, status='closed', tất cả pending → expired
```

### 4.3. Luồng join (student qua token)

```
STUDENT: GET /api/v1/consumer/exam-sessions/<token>/
  ↓
[BACKEND] features/course/exam/services/exam_session_service.py:91-146
  ExamSessionService.get_session_by_token(token, student_id)
  ├─► Look up session by token
  ├─► Verify session.student_id == request.user.uid
  ├─► Verify exam.is_online_active
  ├─► Reject nếu token_status != 'pending'
  ├─► Check due_date chưa qua
  ├─► Check late_threshold
  ├─► Nếu camera_required: verify FaceEmbedding.is_active
  ├─► ends_at = now + duration_seconds
  ├─► Update session: token_status='active', started_at, ends_at
  └─► Audit log: event_type='joined'
```

### 4.4. Proctoring events

**Backend event classification** (`features/course/exam/services/exam_audit_event_service.py:128-134`):

```python
VISIBILITY_BREAK_EVENTS  = ['tab_leave', 'window_out', 'window_blur', 'app_blur', 
                            'fullscreen_exit', 'visibility_lost']
VISIBILITY_RETURN_EVENTS = ['tab_return', 'window_back', 'app_focus', 'visibility_restored']
FACE_WARNING_EVENTS     = ['camera_lost', 'face_not_recognized', 'no_face', 'multiple_faces']
INFORMATIONAL           = ['joined', 'submitted', 'timeout_submit', 'force_submitted', *VISIBILITY_RETURN]
```

**Flow mỗi event** (L157-208):

```
POST /api/v1/consumer/exam-sessions/<session_uid>/events/
  body: {event_type, event_data}
  ↓
ExamAuditEventService.record_event(session_id, event_type, event_data)
  ├─► audit_repo.log() → INSERT exam_event_logs
  ├─► Update session.last_event_at = now
  ├─► Nếu visibility break → _increment_and_check(rule='visibility_breaks', 
  │     counter_field='visibility_breaks_count', exceeded_event='visibility_breaks_exceeded')
  ├─► Nếu face warning → _increment_and_check(rule='face_warnings', ...)
  └─► Return {logged, warning, severity, count, max, remaining, force_submitted, ...}
```

**`_increment_and_check` (L210-312)**:
- Tăng counter (L227-232)
- Nếu `new_count > max_allowed`:
  - Log `exceeded_event` audit (L257-267)
  - `sub_svc.force_submit(exam_id, student_id, reason=exceeded_event)` (L284-289)
  - Log `force_submitted` audit (L296-308)

### 4.5. WebSocket FaceMonitor

**File:** `features/face/consumers/face_monitor_consumer.py:27-109`

URL: `ws://host/ws/face/monitor/<exam_uid>/?token=<jwt>`

```
CONNECT:
1. JWTAuthMiddleware verify token → scope['user']
2. Reject nếu Anonymous (close 4001)
3. Load exam.camera_required
4. Accept + send {type: "session_info", camera_required}

RECEIVE {type: "frame", image: base64}:
1. FaceRecognitionService.verify(student_id, exam_id, image)
   ├─► Fetch active embedding
   ├─► POST {image, embedding, threshold: 0.45} → http://localhost:8001/verify
   └─► ExamEventLogRepository.log_face()
2. Send {type: "verification_result", camera_open, recognized, 
          multiple_faces, face_count, similarity}
```

**File:** `features/face/services/face_recognition_service.py`

- `enroll(student_id, image_b64)` (L24-50): deactivate old embeddings → create new `FaceEmbedding`
- `verify(student_id, exam_id, image_b64)` (L65-97): gọi microservice + log result
- `verify_for_classroom(student_id, classroom_id, image)` (L130-175): set `ClassroomMember.is_verified=True`

### 4.6. Submit + AI grading

**File:** `features/course/exam/services/exam_submission_service.py:198-306`

`submit_exam(exam_id, student_id, data)`:
```
1. get_exam_for_submission: status in {published, ongoing}
2. assert_student_membership
3. assert_camera_session: nếu camera_required, check ExamEventLog.recognized trong 2min gần nhất
4. assert_online_session: ExamSessionService.validate_for_submit
5. assert_within_due_date
6. Type-specific:
   - multiple_choice/online_quiz → QuizLogService.create() auto-grade
   - file → validate resource thuộc student
   - essay → lưu text
7. Complete online session: svc.complete()
8. Create or update submission
9. Audit log: 'submitted' hoặc 'timeout_submit'
10. XP award (L280-304):
    - if is_effective and not force_submitted:
      award 'exam_submitted' (20 XP)
      award 'exam_passed' (50 XP if passed)
```

**AI grading essay** (`features/course/exam/services/exam_ai_grading_service.py:62-103`):

```python
def grade(self, exam, submission, rubric="", max_grade=10, top_k=5):
    exam_content_text = self._extract_text_from_resource(exam)        # markdown body hoặc R2 file
    submission_text   = self._extract_text_from_resource(submission)
    
    # RAG search trong classroom documents
    hits = self.pipeline.search(
        self._build_search_query(exam, exam_content_text, submission_text),
        top_k=top_k,
        filter_meta={"classroom_id": str(exam.classroom_id)},
    )
    context = "\n\n---\n\n".join(h["document"] for h in hits) if hits else ""
    
    messages = [
        {"role": "system", "content": self.SYSTEM_PROMPT},  # harsh 5-criteria rubric
        {"role": "user",   "content": self._build_user_prompt(...)}
    ]
    raw = AIClient.chat_sync(messages, timeout=180)  # Ollama
    result = self._parse_json(raw)  # regex fallback
    result["grade"] = self._clamp_float(result.get("grade"), 0, max_grade)
    return result
```

Default rubric (L25-36): aggressive 5 criteria (accuracy 30%, completeness 20%, critical thinking 20%, terminology 15%, formatting 15%) + special rules (off-topic = 0, copy-paste = 0).

Resource extraction (L130-233) handle: markdown body, PDF/Office via PyPDFLoader, image via `AIClient.chat_with_image()` (model = llava).

### 4.7. DB ảnh hưởng

| Layer | Bị ảnh hưởng |
|---|---|
| **Cassandra** | `course_exams` (UPDATE) · `course_exam_sessions` (INSERT/UPDATE) · `exam_event_logs` (INSERT) · `course_exam_submissions` (INSERT) · `face_embeddings` (UPDATE nếu cần) · `ranking_student_xps` (UPDATE) · `ranking_xp_transactions` (INSERT) |
| **R2** | Download file PDF/image trong AI grading |
| **Microservice :8001** | HTTP verify (FastAPI/InsightFace) |

---

## 5. Payment MoMo

Tích hợp cổng MoMo (sandbox). Student mua khóa học → MoMo redirect → IPN callback → update payment + classroom member.

### 5.1. URL endpoints

| Method | Path | View |
|---|---|---|
| POST | `/api/v1/consumer/payment/ipn/` | `MoMoIPNView` (public, no auth) |
| POST/GET | `/api/v1/consumer/payment/` | `ConsumerPaymentViewSet` |
| GET | `/api/v1/space/payment/` | Teacher analytics |

### 5.2. Config (`settings.py:264-270`)

```python
MOMO_PARTNER_CODE = 'MOMO'
MOMO_ACCESS_KEY   = 'F8BBA842ECF85'  # sandbox
MOMO_SECRET_KEY   = 'K951B6PE1waDMi640xX08PD3vg6EkVlz'
MOMO_ENDPOINT     = 'https://test-payment.momo.vn/v2/gateway/api/create'
MOMO_REDIRECT_URL = 'http://localhost:3000/payment/result'
MOMO_IPN_URL      = 'http://localhost:8000/api/v1/consumer/payment/ipn/'
```

### 5.3. Flow tổng thể

```
CONSUMER: POST /api/v1/consumer/payment/create/
  body: {amount, order_info, resource_type, resource_id}
  ↓
[BACKEND] features/payment/services/payment_service.py:20-90
  PaymentService.initiate(consumer_id, amount, order_info, resource_type, resource_id)
  ├─► Check existing payment cho (consumer, resource_type, resource_id):
  │   - COMPLETED → return cached
  │   - PENDING + age < 15min → return cached
  ├─► Generate order_id = uuid7()
  ├─► If resource_type='classroom': fetch teacher_id từ Classroom.teacher_id
  │   If resource_type='course': fetch teacher_id từ Course
  ├─► Build extra_data = {consumer_id, resource_type, resource_id, teacher_id} (JSON)
  ├─► MoMoService.create_payment(order_id, amount, order_info, extra_data)
  │     [features/payment/services/momo_service.py:24-56]
  │   ├─► Build raw signature string (L26-37)
  │   ├─► HMAC-SHA256 sign với SECRET_KEY
  │   └─► POST JSON to MOMO_ENDPOINT
  ├─► repo.create() với status='pending', pay_url
  └─► Return {order_id, pay_url, deeplink, qr_code_url, status: 'pending'}

Browser redirect → MoMo pay_url
User thanh toán trên MoMo
MoMo redirect về MOMO_REDIRECT_URL (FE: /consumer/checkout/[uid])

[ASYNC - MoMo server] POST /api/v1/consumer/payment/ipn/
  ↓
[BACKEND] features/payment/views/ipn_views.py:11-27
  MoMoIPNView.post (AllowAny, no auth)
  ├─► PaymentService.handle_ipn(data)  [payment_service.py:101-122]
  │   ├─► MoMoService.verify_ipn (HMAC-SHA256 verify signature)
  │   ├─► Update Payment: status='completed' or 'failed'
  │   └─► If success: ClassroomMemberService.mark_paid_pending
  │         [features/course/classroom/services/classroom_member_service.py:52-110]
  │       ├─► Update ClassroomMember: has_paid=True, status='pending' (nếu đã tồn tại)
  │       │   hoặc INSERT mới với has_paid=True
  │       ├─► FCM/NotificationService: notify teacher ('student_join_request')
  │       ├─► FCM/NotificationService: notify student ('classroom_payment_received')
  │       └─► Firebase RTDB: pending_requests/<classroom_uid> = {at, student_name}
  └─► ALWAYS return 200 {message: "ok"} (MoMo retries non-200)

Teacher phải manually approve() → status='approved' mới grant access
```

### 5.4. Frontend polling sau khi MoMo redirect

**File:** `apps/consumer-web/src/app/consumer/checkout/[uid]/page.tsx`

```typescript
const POLL_INTERVAL_MS = 1500;
const POLL_TIMEOUT_MS = 30000;

// Auto-redirect đến MoMo
useEffect(() => {
  const res = await consumerCourseApi.checkout(uid);
  if (res.pay_url) window.location.href = res.pay_url;
}, [uid]);

// Polling sau khi user quay về từ MoMo (?resultCode=...)
useEffect(() => {
  const url = new URL(window.location.href);
  if (url.searchParams.get('resultCode') === null) return;  // chưa return từ MoMo
  setStatus('processing');
  let elapsed = 0;
  const interval = setInterval(async () => {
    elapsed += POLL_INTERVAL_MS;
    const access = await consumerCourseApi.access(uid);
    if (access.enrolled && access.redirect_to) {
      setStatus('success');
      setSuccessRedirect(access.redirect_to);
      return;
    }
    if (elapsed >= POLL_TIMEOUT_MS) { setStatus('timeout'); clearInterval(interval); }
  }, POLL_INTERVAL_MS);
  return () => clearInterval(interval);
}, [uid]);
```

### 5.5. Status semantics

| Status | Ý nghĩa |
|---|---|
| `has_paid=True, status='pending'` | MoMo success, **chờ teacher approve** |
| `has_paid=True, status='approved'` | Full access (checked ở `classroom_service.py:73, 132`) |
| `mark_paid_pending` (L52-110) | Called by `_on_payment_success` |
| `approve_paid_member` (L112-115) | Backward-compat alias → `mark_paid_pending` |

### 5.6. DB ảnh hưởng

| Layer | Bị ảnh hưởng |
|---|---|
| **Cassandra** | `payments` (INSERT/UPDATE) · `classroom_classroom_members` (INSERT/UPDATE) · `notification_notification_logs` (INSERT) |
| **Firebase RTDB** | `pending_requests/{classroom_uid}` · `membership_events/{consumer_uid}/{classroom_uid}` |
| **HTTP out** | `https://test-payment.momo.vn/v2/gateway/api/create` |

---

## 6. Document Upload

Upload file (PDF, image, video) lên Cloudflare R2 + lưu metadata vào Cassandra.

### 6.1. URL endpoints

| Method | Path | View |
|---|---|---|
| GET | `/api/v1/space/course/classrooms/<uid>/docs/tree/` | Folder tree |
| POST | `/api/v1/space/course/classrooms/<uid>/folders/` | Create folder |
| PATCH | `/api/v1/space/course/classrooms/<uid>/folders/<folderUid>/` | Update folder |
| DELETE | `/api/v1/space/course/classrooms/<uid>/folders/<folderUid>/` | Delete folder |
| POST | `/api/v1/space/course/classrooms/<uid>/docs/` | Upload doc (multipart) |
| DELETE | `/api/v1/space/course/classrooms/<uid>/docs/<docUid>/` | Delete doc |
| POST | `/api/v1/space/course/classrooms/<uid>/docs/reorder/` | Reorder |
| POST | `/api/v1/resource/upload/` | Generic upload (cover image, chat attachment, exam submission) |

### 6.2. Luồng upload

```
USER click Upload trong ClassroomDocsManager
  ↓
UploadToFolderDialog (RHF + Zod)  [apps/space-web/src/components/classroom/docs-manager/]
  ↓ submit
useUploadDoc hook
  → POST /api/v1/space/course/classrooms/<uid>/docs/  (FormData)
  ↓
[BACKEND] features/resource/services/resource_service.py
  ResourceService.upload(file, owner_id, owner_type, folder_id, ...)
  ├─► storage_service.upload_fileobj(file_obj, object_key, is_public=True)
  │     [core/storages/storage_service.py:58]
  │   boto3 S3-compatible API → Cloudflare R2
  │   2 buckets: 'lms-system' (private) + 'lms-system-public' (public)
  ├─► ResourceRepository.create()
  │     INSERT resource_resources (Cassandra)
  │     Fields: name, url, size, folder_id, order_index, owner_id, owner_type, metadata (Map)
  └─► Return ResourceResponse
  ↓
FE: optimistic update folder tree (local state, no Redux)
```

### 6.3. Resource model

**File:** `features/resource/models/resource.py:5-29`

Table: `resource_resources`
- PK: `uid`
- Indexed: `file_type`, `owner_id`, `owner_type`
- Fields: `name`, `url`, `size`, `folder_id`, `order_index`, `metadata` (Map)

### 6.4. DB ảnh hưởng

| Layer | Bị ảnh hưởng |
|---|---|
| **Cloudflare R2** | File PDF/image/video thật |
| **Cassandra** | `resource_resources` (1 row mới) |
| **FE local state** | Folder tree (useDocsTree) |

---

## 7. Auth: Login + Refresh Token

### 7.1. Login Flow

**Frontend** `apps/space-web/src/app/space/(main)/login/page.tsx:77-85`:

```typescript
const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

const onLogin = async (data) => {
  const response = await spaceApi.auth.login({ email, password });
  localStorage.setItem('accessToken', response.access);
  localStorage.setItem('refreshToken', response.refresh);
  localStorage.setItem('userType', 'space');
  await dispatch(fetchAccountProfile({ force: true }));
  router.push('/space');
};
```

**Backend** `features/account/space/viewsets/space_viewset.py` (hoặc tương tự):

```
POST /api/v1/space/account/login/  body: {email, password}
  ↓
1. CassandraJWTAuthentication authenticate
   [core/backend/auth/jwt_auth.py:4-27]
   - get_user(validated_token) loads Space bằng uid
   - check_password(password) verify với hash
2. Issue JWT:
   - access: 60 min
   - refresh: 1 day
   - Claims: user_id (uid), user_type ('space'|'consumer')
3. Return {access, refresh, user: {...}}
```

**Config** `settings.py:100-106`:
```python
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'uid',
    'USER_ID_CLAIM': 'user_id',
}
```

### 7.2. Auto-refresh khi 401

**Frontend** `apps/space-web/src/lib/api/client.ts:18-40`:

```typescript
protected async tryRefreshToken(): Promise<boolean> {
  const refresh = localStorage.getItem('refreshToken');
  const userType = localStorage.getItem('userType') || 'space';
  const path = userType === 'space' 
    ? '/api/v1/space/account/token/refresh/' 
    : '/api/v1/consumer/account/token/refresh/';
  // POST refresh → set new accessToken → return true
}
```

Khi 401: tự động retry với token mới (max 1 lần). Nếu refresh fail → clear localStorage + redirect `/login`.

### 7.3. Token storage

- `accessToken` + `refreshToken` + `userType` + `userProfile` (JSON) trong `localStorage`
- KHÔNG dùng cookie / httpOnly

### 7.4. OAuth Google

- FE: `apps/consumer-web/src/app/consumer/auth/callback/page.tsx` đọc `?access&refresh` từ URL → lưu localStorage → gọi `accountService.getProfile()` → redirect `/consumer/dashboard`
- Tương tự cho space-web

### 7.5. Face enrollment bắt buộc (consumer)

**File:** `apps/consumer-web/src/components/Providers.tsx:42-61`

```typescript
<FaceEnrollmentGuard>
  {children}
  {isAuthenticated && faceEnrolled === false && !isPublic && (
    <FaceEnrollModal onClose={() => {}} onEnrolled={...} />
  )}
</FaceEnrollmentGuard>

// PUBLIC_PATHS = ['/login', '/auth/', '/join/', '/preview/']
```

Modal không thể đóng cho đến khi enroll xong.

### 7.6. DB ảnh hưởng

| Layer | Bị ảnh hưởng |
|---|---|
| **Cassandra** | `account_spaces` / `account_consumers` (read only, verify password) |
| **FE localStorage** | accessToken, refreshToken, userType, userProfile |
| **FE Redux** | userSlice.isAuthenticated, userSlice.profile |

---

## 8. Chat Real-time

### 8.1. Models

#### `Conversation` (`features/chat/models/conversation.py:6-24`)
- Table: `chat_conversations`
- `type` ('channel'|'direct'), `classroom_uid`, `name`, `direct_a_id`/`direct_b_id`, `pair_key`, `member_count`, `last_msg_at`, `last_msg_text`, `last_msg_sender`

#### `ConversationMember` (`features/chat/models/conversation_member.py:6-19`)
- Table: `chat_conversation_members`
- Composite PK: `conversation_uid` + `member_id`
- `member_type`, `member_name`, `member_avatar`, `joined_at`, `last_seen_at`, `last_read_msg_uid`

#### `Message` (`features/chat/models/message.py:6-23`)
- Table: `chat_messages`
- Composite PK: `conversation_uid` + `uid DESC`
- `msg_type` (text|image|video|audio|pdf|file), `content`, `sender_id`, `sender_type`, `sender_name`, `resource_uid`, `reply_to_uid`

### 8.2. WebSocket Consumer

**File:** `core/ws/consumers/message_consumer.py:9-201`

URL: `ws://host/ws/chat/<conversation_uid>/?token=<JWT>`

**ASGI auth** (`core/ws/middleware/jwt_auth_middleware.py:11-44`):
- Parse `?token=<jwt>` từ query string
- `UntypedToken(token_str)` validate JWT
- `user_type` claim → Space hoặc Consumer
- Fallback scan cả 2 tables nếu không có claim

**Connect (L14-25):**
```python
self.room_name = kwargs.get('room_name', '')  # = conversation_uid
self.room_group_name = f'chat_{self.room_name}'
self.user = self.scope.get('user', AnonymousUser())
if not self.user or isinstance(self.user, AnonymousUser):
    await self.close(code=4001)
await self.channel_layer.group_add(self.room_group_name, self.channel_name)
await self.accept()
await self._update_last_seen()  # ConversationMember.last_seen_at
```

**`handle_message(data)` (L32-96):**
- `chat_message` (L35-72):
  1. Determine `msg_type` từ attachment (L39-42)
  2. `_save_message` (database_sync_to_async) → `MessageService.save_message`
  3. `_update_last_message` → `ConversationService().update_last_message(...)`
  4. `channel_layer.group_send(room_group_name, {type: 'broadcast_message', ...})`
- `typing_start` / `typing_stop` (L74-88) → `broadcast_typing`
- `mark_read` (L90-93) → `ConversationMemberService().mark_read`

**Channel layer:** `InMemoryChannelLayer` (`settings.py:123-127`) — single-process only, KHÔNG Redis. Horizontal scaling chat cần reconfigure.

### 8.3. Frontend (space-web)

**File:** `apps/space-web/src/components/chat/ClassroomChatPanel.tsx` (650 dòng)

```typescript
// WebSocket hook
const { status, sendMessage } = useChatWebSocket({
  conversationUid,
  enabled: active,
  onMessage: handleIncomingMessage,
  onTyping: handleTyping,
  onReconnect: handleReconnect,
});

// Typing indicator
const handleInputChange = (e) => {
  setNewMessage(e.target.value);
  sendMessage({ type: 'typing_start' });
  typingTimerRef.current = setTimeout(() => {
    sendMessage({ type: 'typing_stop' });
  }, 2000);
};

// Send
sendMessage({
  type: 'chat_message',
  content: newMessage,
  attachment: attachment ?? null,
});
```

**File:** `apps/space-web/src/lib/hooks/use-chat-websocket.ts` (111 dòng)

```typescript
const ws = new WebSocket(`${wsBase}/ws/chat/${conversationUid}/?token=${token}`);
ws.onopen = () => setStatus('connected');
ws.onmessage = (e) => {
  const data = JSON.parse(e.data);
  if (data.type === 'chat_message') onMessageRef.current(data);
  else if (data.type === 'typing') onTypingRef.current(data.sender_name, data.is_typing);
};
ws.onclose = (e) => {
  if (e.code === 4001 || e.code === 1000) return;  // unauthorized or normal
  const delay = Math.min(1000 * Math.pow(2, count), 30000);
  if (count < 5) setTimeout(connect, delay);  // exponential backoff, max 5 retries
};
```

### 8.4. Frontend (consumer-web)

**File:** `apps/consumer-web/src/lib/hooks/use-classroom-chat.ts` (149 dòng)

- Init: `classroomApi.getConversation(classroomUid)` → `getMessages(conv.uid, 30)`
- WebSocket: tương tự space-web
- Load more với scroll preservation (L53-74)
- IntersectionObserver auto-load khi scroll to top (L77-92)

### 8.5. AI bot messages

**KHÔNG có special handling** cho AI bot trong chat. Chat chỉ cho human conversation. AI là feature riêng (Section 3).

### 8.6. DB ảnh hưởng

| Layer | Bị ảnh hưởng |
|---|---|
| **Cassandra** | `chat_messages` (INSERT) · `chat_conversations` (UPDATE last_msg) · `chat_conversation_members` (UPDATE last_seen, last_read) |

---

## 9. WebRTC Meeting

### 9.1. Architecture

- **Signaling:** WebSocket `ws://host/ws/rtc/<room_uid>/?token=<JWT>`
- **ICE servers:** `stun:stun.l.google.com:19302`, `stun:stun1.l.google.com:19302`
- **Pattern:** Perfect Negotiation (offer/answer collision handling)

### 9.2. Hook signature

**File:** `apps/space-web/src/lib/hooks/use-rtc.ts` (329 dòng)

```typescript
const {
  localStream, remoteStream, isConnected, error,
  startMediaShare, startScreenShare, startCameraShare,
  stopMediaShare, stopScreenShare, renegotiate, createOffer, toggleCamera
} = useRTC(roomUid);
```

### 9.3. Peer connection setup

```typescript
const setupPeerConnection = (pc: RTCPeerConnection) => {
  pc.onicecandidate = (event) => {
    if (event.candidate) sendSignaling({ type: 'ice-candidate', candidate: event.candidate });
  };
  pc.ontrack = (event) => {
    const stream = event.streams?.[0] ?? new MediaStream([event.track]);
    setRemoteStream(stream);
  };
  pc.oniceconnectionstatechange = () => {
    setIsConnected(pc.iceConnectionState === 'connected' || 'completed');
    if (pc.iceConnectionState === 'failed') void pc.restartIce();
  };
};
```

### 9.4. Perfect negotiation (lines 122-159)

- `makingOfferRef`, `isSettingRemoteAnswerPendingRef`, `lastOfferSdpRef`
- Handle offer/answer collision bằng rollback nếu `have-local-offer`
- SDP deduplication qua `lastOfferSdpRef`

### 9.5. WebSocket signaling

```typescript
const ws = new WebSocket(`${wsBase}/ws/rtc/${roomUid}/?token=${token}`);
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data?.type === 'peer-joined') {
    window.dispatchEvent(new CustomEvent('rtc:peer-joined', { detail: data.peer }));
    return;
  }
  if (data?.type === 'peer-left') {
    window.dispatchEvent(new CustomEvent('rtc:peer-left', { detail: data.peer }));
    return;
  }
  void handleSignaling(data as RTCMessage);
};
```

### 9.6. Media share

```typescript
const startMediaShare = async (source: 'screen' | 'camera') => {
  const stream = source === 'screen'
    ? await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
    : await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  stream.getVideoTracks()[0]?.addEventListener('ended', stopLocalStream, { once: true });
  const pc = ensurePeerConnection();
  stream.getTracks().forEach((track) => pc.addTrack(track, stream));
  void createOffer();
};
```

### 9.7. Auto-start camera on peer-join

**File:** `apps/space-web/src/app/space/(main)/classrooms/[uid]/details/page.tsx:172-185`

```typescript
const onPeerJoined = (event) => {
  const peer = event.detail;
  if (peer.user_type !== 'consumer') return;  // Only auto-start cho consumers
  if (!localStream) void startMediaShare('camera');
};
window.addEventListener('rtc:peer-joined', onPeerJoined);
```

### 9.8. Consumer side

**File:** `apps/consumer-web/src/lib/hooks/use-rtc.ts` (359 dòng)

- Thêm `joinRoom(roomUid)` và `leave()` (lines 173-249)
- WebSocket chỉ connect khi `isJoined === true`

```typescript
const joinRoom = async (targetRoomUid) => {
  await meetingRoomApi.join(nextUid);
  setIsJoined(true);
};
const leave = useCallback(async () => {
  stopLocalStream();
  pcRef.current?.close(); pcRef.current = null;
  wsRef.current?.close(); wsRef.current = null;
  if (currentRoom) await meetingRoomApi.leave(currentRoom);
  setIsJoined(false);
}, [roomUid]);
```

**Meeting room API** (`apps/consumer-web/src/lib/api/meeting-room.ts`):
- `meetingRoomApi.join(roomUid)` → `POST /api/v1/consumer/course/meeting-rooms/{roomUid}/join/`
- `meetingRoomApi.leave(roomUid)` → `POST /api/v1/consumer/course/meeting-rooms/{roomUid}/leave/`

### 9.9. Peer lifecycle

1. User vào meeting → `meetingRoomApi.join(roomUid)`
2. WS connect `/ws/rtc/{roomUid}/`
3. Server gửi `peer-joined` → `window.dispatchEvent('rtc:peer-joined')` → consumer tạo offer
4. SDP/ICE exchange qua signaling
5. `pc.ontrack` fires → `setRemoteStream(stream)` hiển thị remote video
6. On leave → close PC + WS + call `meetingRoomApi.leave`

---

## 10. Ranking / XP / Level

### 10.1. Models

#### `StudentXP` (`features/ranking/models/student_xp.py:7-51`)
- Table: `ranking_student_xps`
- PK: `student_id` (UUID)
- Denormalized counter: `total_xp` (BigInt), `level`, `current_level_xp`, `next_level_xp`, `streak_days`, `last_active_date`, `last_active_at`
- Achievement counters: `classrooms_joined_count`, `quizzes_passed_count`, `exams_passed_count`, `perfect_scores_count`, `certificates_count`, `attendance_count`

#### `XPTransaction` (`features/ranking/models/xp_transaction.py:8-46`)
- Table: `ranking_xp_transactions`
- Composite PK: `student_id` + `uid DESC`
- `event_type`, `delta_xp`, `ref_type`, `ref_id`, `classroom_id`, `description`, `metadata` (JSON)

#### `StudentAchievement` (`features/ranking/models/achievement.py:6-45`)
- Table: `ranking_achievements`
- Composite PK: `student_id` + `achievement_code`
- `title`, `description`, `icon`, `is_unlocked`, `unlocked_at`, `target_value`, `current_value`, `progress_pct`

### 10.2. XP Service

**File:** `features/ranking/services/xp_service.py:35-157`

```python
def award(student_id, event_type, *, delta_xp=None, ref_type=None, ref_id=None,
          classroom_id=None, description='', metadata=None, count_field=None, increment=1):
    # 1. Idempotency: tx_repo.exists_for_ref(sid, event_type, ref_type, rid) → return None
    # 2. delta_xp = get_xp_amount(event_type) if not provided
    # 3. student_xp, _ = xp_repo.get_or_create(sid)
    # 4. new_total = max(0, total_xp + delta_xp)
    # 5. new_level = level_for_xp(new_total)
    # 6. Update streak_days based on last_active_date comparison
    # 7. Update StudentXP counter
    # 8. INSERT XPTransaction (ledger)
    # 9. If new_level > prev_level → NotificationService.send_notification('ranking_level_up')
    # 10. AchievementService().check_after_xp_event(student_id, event_type, fresh)
```

### 10.3. XP Event Catalog (`features/ranking/enums/xp_event.py:23-38`)

```python
XP_AMOUNTS = {
    'classroom_joined':      10,
    'attendance_present':     5,
    'exam_submitted':        20,
    'exam_passed':           50,
    'quiz_submitted':        10,
    'quiz_passed':           15,
    'quiz_perfect':          20,
    'doc_completed':         10,
    'collection_completed': 100,
    'certificate_issued':   200,
}
```

### 10.4. XP Award Trigger Points

| Trigger | File | Line |
|---|---|---|
| `classroom_joined` | `features/course/classroom/services/classroom_member_service.py` | 173 (after teacher `approve()`) |
| `attendance_present` | `features/calendar/services/attendance_service.py` | 36 (`mark_attendance` với status='present') |
| `exam_submitted` / `exam_passed` | `features/course/exam/services/exam_submission_service.py` | 283, 293 (after `submit_exam` if `is_effective and not force_submitted`) |
| `certificate_issued` | `features/quiz_collection/services/certificate_issuance_service.py` | 172 |

### 10.5. Leaderboard

**File:** `features/ranking/services/leaderboard_service.py:16-99`

`top(limit=10, period='all')`:
- `period='all'`: `xp_repo.get_top(limit=limit)` đọc `ranking_student_xps` ORDER BY `total_xp` DESC
- `period='week'`: sum `delta_xp` từ `ranking_xp_transactions` WHERE `created_at >= now - 7d`
- `period='month'`: same, `now - 30d`

`_hydrate(rows)` (L74-99): fetch `Consumer` by `uid`, return `{rank, student_id, student_name, student_avatar, total_xp, level, level_title}`.

`my_rank(student_id, period='all')` (L56-72): count students có `total_xp > my_xp` (limit 1000 scan).

### 10.6. Frontend

**Quiz leaderboard modal** `apps/space-web/src/components/quiz/QuizLeaderboardModal.tsx` (438 dòng):
- `quizApi.getLeaderboard(quizUid, classroomId, 50)` (L73-86)
- `quizApi.getStudentLeaderboard(quizUid, classroomId, entry.student_id)` (L88-98)
- Top 3 sorted by rank

**Classroom ranking** `apps/space-web/src/components/ranking/SpaceClassroomRankingView.tsx`:
- API: `spaceRankingApi.classroomLeaderboard(classroomUid, limit)` → `GET /api/v1/space/ranking/classrooms/{classroomUid}/leaderboard/`
- Top 3 podium + full ranking list

**KHÔNG có WebSocket** cho leaderboard. Fetch-once on mount.

### 10.7. DB ảnh hưởng

| Layer | Bị ảnh hưởng |
|---|---|
| **Cassandra** | `ranking_student_xps` (UPDATE) · `ranking_xp_transactions` (INSERT) · `ranking_achievements` (UPDATE/INSERT) · `notification_notification_logs` (INSERT nếu level up) |
| **Firebase RTDB** | `notifications/{target_uid}/{log.uid}` (nếu level up) |

---

## 11. Calendar + Attendance (WebSocket presence)

### 11.1. Models

#### `CalendarEvent` (`features/calendar/models/calendar_event.py:5-24`)
- Table: `calendar_events`
- `type` (class|exam|deadline|study_session), `title`, `description`, `start_time`, `end_time`, `classroom_id`, `space_id`, `owner_id`

#### `Attendance` (`features/calendar/models/attendance.py:5-25`)
- Table: `calendar_attendances`
- Composite PK: `event_id` + `user_id`
- `status` (present|absent), `joined_at`, `left_at`, `date`

#### `LeaveRequest` (`features/calendar/models/leave_request.py:5-31`)
- Table: `calendar_leave_requests`
- `student_id`, `classroom_id`, `event_id`, `start_date`, `end_date`, `reason`, `evidence_url`, `status` (pending|approved|rejected), `processed_by`, `rejection_reason`

### 11.2. Event Creation + Email

```
TEACHER: POST /api/v1/space/calendar/  {title, type, start_time, end_time, classroom_id}
  ↓
[BACKEND] features/calendar/viewsets/space_calendar_viewset.py:50-63
  SpaceCalendarViewSet.create
  ├─► CalendarEventCreateSerializer.validate
  ├─► CalendarService.create_event (validate ownership, no overlap)
  ├─► INSERT calendar_events
  └─► enqueue_event_email(event_uid) → RQ queue 'default'
        [features/calendar/tasks/calendar_email_tasks.py:9-20]
        queue.enqueue(_send_event_email_job, args=(str(event_uid),), 
                      job_id=f"calendar-event-email-{uuid4}", job_timeout=120)
        └─► _send_event_email_job(event_uid)  [L37-44]
              CalendarNotificationService.send_event_notification(event_uid)
                [features/calendar/services/calendar_notification_service.py:83-138]
              ├─► Lookup classroom members (consumer emails)
              └─► MailService.send_mail (Django SMTP, Gmail by default)
```

**RQ config** (`settings.py:134-149`): `default` và `high` queues trên Redis DB 10, `SimpleWorker` (line 154-156) avoid SIGSEGV.

### 11.3. AttendanceConsumer (WebSocket presence)

**File:** `core/ws/consumers/attendance_consumer.py:9-87`

URL: `ws://host/ws/presence/` (trong `core/ws/routing.py:10`)

**Connect (L14-22):**
```python
self.user = self.scope.get('user', AnonymousUser())
if not user or AnonymousUser: await self.close(code=4001)
await self.accept()
await self._mark_present()  # auto-attendance
```

**`_mark_present` (L28-58):**
1. Nếu user không phải Consumer, return
2. Get classroom_uids từ `ClassroomMemberService().get_joined_classroom_uids(self.user.uid)`
3. For each classroom, get events qua `CalendarService.get_events(...)`
4. For each event có `start_time <= now <= end_time`:
   `AttendanceService.mark_attendance(event_id, user_id, status='present', joined_at=now)`
   - Side effect: `XPService().award('attendance_present', ...)` nếu status='present'

**Disconnect (L24-25) → `_mark_left` (L60-86):** Update `left_at` trên cùng matching attendance rows.

### 11.4. DB ảnh hưởng

| Layer | Bị ảnh hưởng |
|---|---|
| **Cassandra** | `calendar_events` (INSERT) · `calendar_attendances` (INSERT/UPDATE) · `ranking_student_xps` (UPDATE) · `ranking_xp_transactions` (INSERT) |
| **Redis RQ** | Queue `default` |
| **SMTP** | Email qua Gmail (default) |

---

## 12. Social Feed

### 12.1. Models

#### `SocialPost` (`features/social/models/post.py:7-37`)
- Table: `social_posts`
- Composite PK: `owner_id` + `owner_type` + `created_at DESC` + `uid`
- `owner_name`, `owner_avatar`, `content`, `emotion`, `image_url`, `image_urls` (list), `visibility` (public|private|friends), `classroom_tags` (list UUID), `likes_count`, `comments_count`

#### `SocialPostLike` (`features/social/models/post_like.py:5-18`)
- Table: `social_post_likes`
- PK: `post_uid` + `owner_id`
- `owner_type`

#### `SocialPostComment` (`features/social/models/post_comment.py:7-26`)
- Table: `social_post_comments`
- PK: `post_uid` + `created_at ASC` + `uid ASC`
- `owner_id`, `owner_type`, `owner_name`, `owner_avatar`, `content`

#### `SocialFollow` (`features/social/models/social_follow.py:5-20`)
- Table: `social_follows`
- PK: `follower` (uid) + `followed_id`
- `follower_type`, `followed_type`

### 12.2. Post Service

**File:** `features/social/services/post_service.py`

- `get_feed(requester_uid, limit, before)` (L170-182): public posts
- `get_following_feed(requester_uid, limit)` (L184-199): posts từ followed users
- `create_post(...)` (L110-152): validate tags, upload images → R2, INSERT, increment `Profile.posts_count`
- `toggle_like(post_uid, owner_id)` (L244-262): idempotent, update `post.likes_count`
- `add_comment` (L282-296), `delete_comment` (L298-313)
- `upload_post_images(files, owner_id)` (L154-168): `storage_service.upload_fileobj(f, f"posts/{owner_id}/{uuid4}.ext", is_public=True)`

### 12.3. Follow Service

`features/social/services/follow_service.py:39-118`

`follow_user(follower_id, followed_id, ...)` (L59-85):
- Check self-follow (L63-64)
- Idempotent check (L66-68)
- INSERT `SocialFollow` (L70-76)
- `ProfileService.increment_followers(t_id, 1)`, `increment_following(f_id, 1)` (L78-83)

### 12.4. Frontend (space-web)

**File:** `apps/space-web/src/app/space/feed/page.tsx` (137 dòng)

Layout 3-column: `[280px_minmax(0,1fr)_300px]`
- `FeedLeftSidebar` (left)
- `CreatePost` + `PostCard[]` (center)
- `ConnectSuggestions` (right)

**Feed load** (L43-51):
```typescript
const feed = await socialApi.getFeed(PAGE);  // PAGE=15
setHasMore(feed.length === PAGE);
```

**CreatePost** `apps/space-web/src/app/space/feed/CreatePost.tsx` (477 dòng):
- Tiptap editor (`CEditor`)
- Visibility: public/friends/private
- 10 emoji emotions
- Image upload: max 9 images (`MAX_IMAGES = 9`)
- Classroom tags picker (portal-based)
- Submit:
```typescript
const imageUrls = await socialApi.uploadPostImages(imageFiles);
const post = await socialApi.createPost({
  content, emotion, visibility,
  image_url: imageUrls[0] || '',
  image_urls: imageUrls,
  classroom_tags: selectedClassroomUids,
});
```

**PostCard** (395 dòng):
- Comments lazy-load
- Like, comment, delete optimistic
- Image gallery + lightbox

**KHÔNG có WebSocket** cho like/comment realtime. Updates qua optimistic state mutation.

### 12.5. DB ảnh hưởng

| Layer | Bị ảnh hưởng |
|---|---|
| **Cassandra** | `social_posts` (INSERT) · `social_post_likes` (INSERT/DELETE) · `social_post_comments` (INSERT/DELETE) · `social_follows` (INSERT/DELETE) |
| **Cloudflare R2** | Post images |

---

## 13. Face Enrollment + Face Monitor

### 13.1. Face Enrollment Modal (consumer)

**File:** `apps/consumer-web/src/components/face/face-enroll-modal.tsx` (147 dòng)

**Triggered bởi** `FaceEnrollmentGuard` trong `Providers.tsx:42-61`:

```typescript
function FaceEnrollmentGuard({ children }) {
  const pathname = usePathname();
  const faceEnrolled = useSelector(s => s.user.faceEnrolled);
  const isAuthenticated = useSelector(s => s.user.isAuthenticated);
  const isPublic = PUBLIC_PATHS.some(p => pathname?.includes(p));
  // PUBLIC_PATHS = ['/login', '/auth/', '/join/', '/preview/']
  
  return (
    <>
      {children}
      {isAuthenticated && faceEnrolled === false && !isPublic && (
        <FaceEnrollModal onClose={() => {}} onEnrolled={...} />
      )}
    </>
  );
}
```

**State**: `'starting' | 'ready' | 'capturing' | 'success' | 'error'`

**Flow:**
```typescript
useEffect(() => { void startCamera(); return () => stopCamera(); }, []);

const startCamera = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'user', width: 640, height: 480 }
  });
  videoRef.current.srcObject = stream;
  await videoRef.current.play();
  setStatus('ready');
};

const handleCapture = async () => {
  const canvas = document.createElement('canvas');
  canvas.width = 640; canvas.height = 480;
  canvas.getContext('2d')!.drawImage(videoRef.current, 0, 0, 640, 480);
  const image = canvas.toDataURL('image/jpeg', 0.9);
  
  try {
    await faceApi.enroll(image);
    setStatus('success');
    setTimeout(() => { onEnrolled(); onClose(); }, 1400);
  } catch (err) { setStatus('ready'); }
};
```

**API** `apps/consumer-web/src/lib/api/face.ts`:
- `enroll(image)` → `POST /api/v1/consumer/face/enroll/`
- `enrollmentStatus()` → `GET /api/v1/consumer/face/enroll/`
- `verify(examUid, image)` → `POST /api/v1/consumer/face/exams/{examUid}/verify/`

### 13.2. Face Monitor Widget (exam/meeting)

**File:** `apps/consumer-web/src/components/face/face-monitor-widget.tsx` (237 dòng)

**Constants**:
- `MIN_INTERVAL_MS = 500` (giữa các frame send)
- `FACE_DEBOUNCE_MS = 3000` (mỗi warning emitted tối đa 1 lần / 3s)

**WS path**:
```typescript
const wsPath = roomUid 
  ? `/ws/face/meeting/${roomUid}/`  // meeting
  : `/ws/face/monitor/${examUid}/`; // exam
const ws = new WebSocket(`${getWebSocketBaseUrl()}${wsPath}?token=${token}`);
```

**Frame capture loop**:
```typescript
ws.onopen = () => captureAndSend(ws);

ws.onmessage = (e) => {
  const data = JSON.parse(e.data);
  if (data.type === 'verification_result') {
    setResult(data);
    onStatusChange?.(data);
    emitIfBad(data);  // check warnings
  }
  setTimeout(() => captureAndSend(ws), MIN_INTERVAL_MS);  // loop
};
```

**Warning debouncing** (`emitIfBad`, lines 64-113):
- `camera_lost`, `multiple_faces`, `no_face`, `face_not_recognized` — mỗi loại debounce 3s
- Callback `onFaceEvent(...)` map sang `ProctoringEventType` rồi `sendProctoringEvent`

**MonitorResult** (lines 5-11):
```typescript
type MonitorResult = {
  camera_open: boolean;
  recognized: boolean;
  multiple_faces: boolean;
  face_count: number;
  similarity: number;
};
```

### 13.3. Backend Face Service

**File:** `features/face/services/face_recognition_service.py`

- `enroll(student_id, image_b64)` (L24-50): POST `{FACE_SERVICE_URL}/enroll`, deactivate old embeddings, INSERT new
- `verify(student_id, exam_id, image_b64)` (L65-97): fetch active embedding, POST `{image, embedding, threshold: 0.45}` to `/verify`, log result
- `verify_for_classroom` (L130-175): set `ClassroomMember.is_verified=True, verified_at=now()`

**Microservice** chạy FastAPI ở `face_service/` (port 8001), dùng InsightFace.

**FaceEmbedding model** (`features/face/models/face_embedding.py:7-30`): partition by `student_id`, `embedding_json` (text, 512-dim).

### 13.4. DB ảnh hưởng

| Layer | Bị ảnh hưởng |
|---|---|
| **Cassandra** | `face_embeddings` (INSERT/UPDATE) · `classroom_classroom_members.is_verified` (UPDATE) · `exam_event_logs` (INSERT face events) |
| **Microservice :8001** | HTTP enroll + verify |

---

## 14. Quiz Gameplay (Student)

### 14.1. Game phases

**File:** `apps/consumer-web/src/app/consumer/classroom/[uid]/quiz/[quizUid]/page.tsx` (848 dòng)

```typescript
type GamePhase = 'loading' | 'intro' | 'playing' | 'result';
// loading → intro → playing → result
//                    ↑__________|
```

### 14.2. Load flow (L95-112)

```typescript
const [data, attempts] = await Promise.all([
  consumerQuizApi.retrieve(quizUid, classroomUid),
  consumerQuizApi.listAttempts(quizUid, classroomUid),
]);
setQuiz({...data, questions: sorted});  // sort by order
setPastAttempts(attempts);
setPhase('intro');
```

### 14.3. Dual timer (L118-151)

2 timers chạy song song trong `playing`:
- `time_limit_seconds` (per-attempt)
- `closes_at` (assignment deadline)

Cả 2 decrement mỗi giây; nếu 1 trong 2 hit 0 → force submit.

```typescript
timerRef.current = setInterval(() => {
  if (attemptLeft === 0 || closesLeft === 0) {
    autoSubmitFiredRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    if (closesLeft === 0) setForceSubmitted(true);
    void handleAutoSubmitRef.current();
    return;
  }
}, 1000);
```

### 14.4. Submit flow (L199-276)

```typescript
const doSubmit = async (finalAnswers) => {
  const timeTaken = startedAtRef.current 
    ? Math.floor((Date.now() - startedAtRef.current.getTime()) / 1000) : 0;
  
  if (examUid) {
    // Quiz là part of exam → submit tới exam endpoint
    await classroomApi.submitExam(examUid, {
      submission_type: 'online_quiz',
      answers: finalAnswers,
      time_taken_seconds: timeTaken,
    });
  } else {
    // Standalone quiz
    const res = await consumerQuizApi.submit(quizUid, {
      answers: finalAnswers,
      classroom_id: classroomUid,
      time_taken_seconds: timeTaken,
    });
    setResult(res);
    
    // Auto-celebrate certificates
    if (res.certificate_issued?.length > 0) {
      setCelebrateCerts(res.certificate_issued);
    } else {
      // Fallback: check fresh certificates từ myCertificates()
      const all = await consumerQuizCollectionApi.myCertificates();
      const fresh = all.filter(c => 
        c.classroom_id === classroomUid && 
        new Date(c.issued_at).getTime() > Date.now() - 5*60*1000
      );
    }
  }
  setPhase('result');
};
```

### 14.5. Backend Quiz attempt

`features/quiz/services/quiz_log_service.py`

`create(quiz_id, student_id, classroom_id, answers, time_taken, attempt_number)`:
1. Auto-grade: so sánh answers với `correct_answer` của từng `QuizQuestion`
2. Tính `score`, `total_questions`, `score_pct`
3. INSERT `quiz_logs` với `source='game'`
4. Trigger `XPService.award('quiz_submitted', ...)` + `quiz_passed` nếu đạt
5. Nếu pass collection: `CertificateIssuanceService.issue_if_eligible()`

### 14.6. DB ảnh hưởng

| Layer | Bị ảnh hưởng |
|---|---|
| **Cassandra** | `quiz_logs` (INSERT) · `ranking_student_xps` (UPDATE) · `ranking_xp_transactions` (INSERT) · `issued_certificates` (INSERT nếu pass collection) |

---

## 15. Certificate

### 15.1. Models

#### `QuizCollection` (`features/quiz_collection/models/quiz_collection.py:6`)
- Table: `quiz_collections`
- `item_quiz_ids` (List of UUID), `certificate_id`, ...

#### `Certificate` (`features/quiz_collection/models/certificate.py`)
- Template, criteria

#### `IssuedCertificate` (`features/quiz_collection/models/issued_certificate.py`)
- `student_id`, `classroom_id`, `collection_id`, `verification_code`, `issued_at`, `status`

### 15.2. Issuance flow

```
Student pass tất cả quiz trong collection
  ↓
CertificateIssuanceService.issue_if_eligible(student_id, collection_id)
  [features/quiz_collection/services/certificate_issuance_service.py:172]
  ├─► Check pass status của tất cả quizzes trong collection
  ├─► INSERT issued_certificates (với verification_code unique)
  └─► XPService.award('certificate_issued', delta_xp=200)
```

### 15.3. Frontend (consumer)

**File:** `apps/consumer-web/src/app/consumer/certificate/[issuedCertUid]/page.tsx` (191 dòng)

```typescript
const list = await consumerQuizCollectionApi.myCertificates();
const found = list.find(c => c.uid === issuedUid);
```

Display:
- Print button: `window.print()` (L39)
- Verification URL: `${origin}/verify/${cert.verification_code}` (L44)
- Cert template: gradient background

**Auto-celebration** sau quiz (Section 14.4):
- `setCelebrateCerts(res.certificate_issued)` hiển thị `CertificateCelebration` modal
- Hoặc fallback check `myCertificates()` cho certs issued trong 5 phút gần nhất

### 15.4. Frontend (space-web — teacher)

- `/space/quiz-collections` — Collections list
- `/space/quiz-collections/certificates` — Certificates list
- `/space/quiz-collections/certificates/[uid]` — Edit
- Components: `CreateCertificateDialog`, `AssignCertificateDialog`

**API** `apps/space-web/src/lib/api/quiz-collection.ts:78-117`:
```typescript
class CertificateApiClient extends BaseRestApiClient {
  list() → GET /api/v1/space/certificate/
  retrieve(uid) → GET /api/v1/space/certificate/{uid}/
  create(data) → POST /api/v1/space/certificate/  (FormData)
  update(uid, data) → PATCH /api/v1/space/certificate/{uid}/
  deleteCertificate(uid) → DELETE /api/v1/space/certificate/{uid}/
}
```

### 15.5. DB ảnh hưởng

| Layer | Bị ảnh hưởng |
|---|---|
| **Cassandra** | `issued_certificates` (INSERT) · `ranking_student_xps` (UPDATE) · `ranking_xp_transactions` (INSERT) |

---

## 16. Pattern chung FE ↔ BE

### 16.1. 4 loại async pattern

| Pattern | Khi nào dùng | Đặc trưng |
|---|---|---|
| **RQ background task + polling** | Generate Quiz (AI chậm), Email sending | `features/quiz/tasks/generate_quiz_task.py` + `useQuizTaskPolling` |
| **SSE streaming** | Quiz generation real-time, RAG ask-stream, AI ask-stream | `generate-stream/`, `ai/ask-stream/`, `ask-stream/` |
| **WebSocket** | Chat, WebRTC, Face monitor, Attendance presence | `core/ws/routing.py` |
| **Firebase RTDB** | Realtime pending members, notifications | `use-pending-realtime.ts` |

### 16.2. 3-tier layered architecture

```
ViewSet (HTTP entry)     ← DRF, permission mixins
    ↓
Service (business logic) ← validation, orchestration, side effects
    ↓
Repository (data access) ← Cassandra queries
    ↓
Cassandra table           ← durable storage
```

**Không được skip layer** (xem `AGENTS.md:62-66`).

### 16.3. Permission Mixins (`core/views/mixins.py`)

- `UserScopeMixin` (L10) — chỉ cần authenticated
- `SpaceScopeMixin` (L31) — chỉ teacher (`IsSpaceUser`)
- `ConsumerScopeMixin` (L36) — chỉ student (`IsConsumerUser`)
- `AdminScopeMixin` (L41)

### 16.4. URL convention

- `/api/v1/consumer/...` — Student endpoints
- `/api/v1/space/...` — Teacher endpoints
- `/api/v1/resource/...` — File management
- `/api/v1/sharing/...` — Sharing links (legacy)
- `/api/v1/chat/...` — Chat (dùng chung)
- WebSocket: `/ws/chat/<uid>/`, `/ws/rtc/<uid>/`, `/ws/presence/`, `/ws/face/monitor/<exam_uid>/`, `/ws/face/meeting/<room_uid>/`

### 16.5. Base Service / Repository

`core/services/base_service.py:5` — kế thừa từ `BaseRepository`
`core/repositories/base_repository.py:5` — base Cassandra operations

### 16.6. Frontend API client pattern

**File:** `apps/{space,consumer}-web/src/lib/api/client.ts`

```typescript
class BaseRestApiClient {
  public baseURL: string;
  public static onUnauthorized?: () => void;
  
  constructor(baseURL?: string) {
    this.baseURL = baseURL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  }
  
  protected getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }
  
  // get/post/put/patch/delete helpers
  // Tự động: Authorization Bearer + FormData detection + 401 handling
  // Space-web: auto-refresh token via /api/v1/space/account/token/refresh/
  // Consumer-web: clear + redirect /login
  
  public getWebSocketBaseUrl(): string  // http→ws, https→wss
}
```

Tất cả API resource extend class này:
- `apps/consumer-web/src/lib/api/`: 25 files (auth, classroom, course, quiz, dashboard, calendar, payment, ...)
- `apps/space-web/src/lib/api/`: 31 files (thêm: assignment, exam, quiz-tasks, search, social, ...)

Backward-compat pattern:
```typescript
export const spaceApi = {
  auth: { login: authApi.spaceLogin.bind(authApi), ... },
  classrooms: classroomApi,
  exams: examApi,
  quizzes: quizApi,
  ...
};
```

### 16.7. Form pattern (RHF + Zod)

```typescript
const schema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

const form = useForm<z.infer<typeof schema>>({
  resolver: zodResolver(schema),
  defaultValues: { email: '', password: '' },
});

const onSubmit = form.handleSubmit(async (data) => {
  const res = await spaceApi.auth.login(data);
  localStorage.setItem('accessToken', res.access);
  ...
});
```

**UI components:** shadcn `Form`, `FormField`, `FormItem`, `FormControl`, `FormMessage`, `FormDescription`.

### 16.8. Auth flow lifecycle

```
Login → localStorage {accessToken, refreshToken, userType, userProfile}
  ↓
useRequireAuth() check token → push /login nếu thiếu
  ↓
useEffect: fetchAccountProfile → Redux userSlice
  ↓
consumer-web: FaceEnrollmentGuard check faceEnrolled → bắt buộc enroll
  ↓
API call với auto Bearer header
  ↓
401 → tryRefreshToken → retry
  ↓
Refresh fail → clear localStorage + redirect /login
```

### 16.9. Một số điểm đặc biệt

1. **Next.js 16** (không phải 15) — `params` trong page là `Promise<{ uid: string }>`, phải `use(params)` để unwrap
2. **Không dùng TanStack Query** — toàn bộ qua Redux + custom hooks
3. **shadcn `style: "base-nova"`** — biến thể mới (không phải default/new-york)
4. **PDF only cho Quiz Generation** — `GenerateQuizModal.tsx:33-37` chỉ accept `.pdf`
5. **Auto theme color** — `AppInitializer.tsx:45-53` apply `--primary-brand` CSS variable theo `state.space.themeColor`
6. **Cassandra không dùng `migrate`** — dùng `python manage.py lms_sync_cassandra`
7. **Channel layer InMemory** — KHÔNG dùng Redis, horizontal scaling chat cần reconfigure
8. **RQ worker SimpleWorker** — avoid SIGSEGV từ native libs

---

## PHỤ LỤC: File paths tổng hợp

### Frontend (LMS_SYSTEM)

| Mục đích | Path tuyệt đối |
|---|---|
| API base client | `apps/space-web/src/lib/api/client.ts`, `apps/consumer-web/src/lib/api/client.ts` |
| Quiz polling hook | `apps/space-web/src/lib/hooks/useQuizTaskPolling.ts` |
| Quiz Redux slice | `apps/space-web/src/lib/redux/quizTasksSlice.ts` |
| Generate Quiz Modal | `apps/space-web/src/components/quiz/GenerateQuizModal.tsx` |
| Quiz library page | `apps/space-web/src/app/space/(main)/quizzes/page.tsx` |
| Task center bell | `apps/space-web/src/components/quiz/TaskCenterBell.tsx` |
| Task center panel | `apps/space-web/src/components/quiz/TaskCenterPanel.tsx` |
| Docs manager | `apps/space-web/src/components/classroom/docs-manager/ClassroomDocsManager.tsx` |
| Upload dialog | `apps/space-web/src/components/classroom/docs-manager/UploadToFolderDialog.tsx` |
| Courses list | `apps/space-web/src/app/space/(main)/courses/page.tsx` |
| Course detail | `apps/space-web/src/app/space/(main)/courses/[uid]/page.tsx` |
| Classrooms list | `apps/space-web/src/app/space/(main)/classrooms/page.tsx` |
| Classroom detail (14 tabs) | `apps/space-web/src/app/space/(main)/classrooms/[uid]/details/page.tsx` |
| AI Tab (RAG) | `apps/space-web/src/components/classroom/details/tabs/AITab.tsx` |
| AI ask-stream hook | `apps/space-web/src/components/classroom/details/hooks/useAIAskStream.ts` |
| Chat Panel | `apps/space-web/src/components/chat/ClassroomChatPanel.tsx` |
| Chat WebSocket hook | `apps/space-web/src/lib/hooks/use-chat-websocket.ts` |
| WebRTC hook (space) | `apps/space-web/src/lib/hooks/use-rtc.ts` |
| WebRTC hook (consumer) | `apps/consumer-web/src/lib/hooks/use-rtc.ts` |
| Exam session (consumer) | `apps/consumer-web/src/app/consumer/exam-session/[token]/page.tsx` |
| Exam session API | `apps/consumer-web/src/lib/api/exam-session.ts` |
| Quiz gameplay (consumer) | `apps/consumer-web/src/app/consumer/classroom/[uid]/quiz/[quizUid]/page.tsx` |
| Face enroll modal | `apps/consumer-web/src/components/face/face-enroll-modal.tsx` |
| Face monitor widget | `apps/consumer-web/src/components/face/face-monitor-widget.tsx` |
| Checkout (MoMo) | `apps/consumer-web/src/app/consumer/checkout/[uid]/page.tsx` |
| Invoice | `apps/consumer-web/src/app/consumer/invoices/[orderId]/page.tsx` |
| Quiz leaderboard modal | `apps/space-web/src/components/quiz/QuizLeaderboardModal.tsx` |
| Classroom ranking | `apps/space-web/src/components/ranking/SpaceClassroomRankingView.tsx` |
| Certificate page | `apps/consumer-web/src/app/consumer/certificate/[issuedCertUid]/page.tsx` |
| Social feed | `apps/space-web/src/app/space/feed/page.tsx` |
| Login (space) | `apps/space-web/src/app/space/(main)/login/page.tsx` |
| Login (consumer) | `apps/consumer-web/src/app/consumer/login/page.tsx` |
| Auth hook | `apps/space-web/src/lib/hooks/use-require-auth.ts`, `apps/consumer-web/src/lib/hooks/use-require-auth.ts` |
| OAuth callback | `apps/consumer-web/src/app/consumer/auth/callback/page.tsx` |
| Providers (face guard) | `apps/consumer-web/src/components/Providers.tsx` |
| AppShell (polling) | `apps/space-web/src/components/AppShell.tsx` |
| AppInitializer | `apps/space-web/src/components/AppInitializer.tsx` |
| Redux store (space) | `apps/space-web/src/lib/redux/store.ts` |
| Redux store (consumer) | `apps/consumer-web/src/lib/redux/store.ts` |
| Type definitions | `apps/space-web/src/lib/api/types.ts` |
| shadcn UI | `packages/shared/src/components/ui/` (38 files) |
| shadcn config | `apps/space-web/components.json` (style: base-nova) |

### Backend (LMS_BACKEND)

| Mục đích | Path tuyệt đối |
|---|---|
| Django settings | `LMS_SYSTEM/settings.py` |
| Root URLs | `LMS_SYSTEM/urls.py` |
| ASGI config | `LMS_SYSTEM/asgi.py` |
| WS routing | `core/ws/routing.py` |
| JWT auth | `core/backend/auth/jwt_auth.py` |
| WS JWT middleware | `core/ws/middleware/jwt_auth_middleware.py` |
| Base model (Cassandra) | `core/models/cassandra.py` |
| Base service | `core/services/base_service.py` |
| Base repository | `core/repositories/base_repository.py` |
| Permission mixins | `core/views/mixins.py` |
| Database config | `core/configs/database.py` |
| R2 storage | `core/storages/storage_service.py` |
| Firebase admin | `core/notification/` |
| Typesense indexer | `core/search_engine/typesense/indexer.py` |
| Search API | `core/views/search_api.py` |
| AI client | `core/ai/llm/services/ai_client.py` |
| Ollama client | `core/ai/llm/services/ollama_client.py` |
| Embedding service | `core/ai/embeddings/services/embedding_service.py` |
| LanceDB service | `core/ai/vector_store/services/lance_vector_service.py` |
| RAG pipeline | `core/ai/rag/services/rag_pipeline.py` |
| SSE async bridge | `core/ai/streaming/async_stream.py` |
| LangChain agent | `core/ai/langchain/agent.py` |
| Message consumer (WS) | `core/ws/consumers/message_consumer.py` |
| Attendance consumer (WS) | `core/ws/consumers/attendance_consumer.py` |
| Quiz ViewSet | `features/quiz/viewsets/space_quiz_viewset.py` |
| Quiz RQ task | `features/quiz/tasks/generate_quiz_task.py` |
| Quiz generation service | `features/quiz/services/quiz_generation_service.py` |
| Quiz service | `features/quiz/services/quiz_service.py` |
| Quiz leaderboard | `features/quiz/services/quiz_leaderboard_service.py` |
| Quiz log | `features/quiz/services/quiz_log_service.py` |
| Quiz models | `features/quiz/models/` |
| Course AI ViewSet | `features/course/ai/viewsets/ai_viewset.py` |
| Course AI service | `features/course/ai/services/course_ai_service.py` |
| Exam models | `features/course/exam/models/` |
| Exam session service | `features/course/exam/services/exam_session_service.py` |
| Exam audit event service | `features/course/exam/services/exam_audit_event_service.py` |
| Exam submission service | `features/course/exam/services/exam_submission_service.py` |
| Exam AI grading | `features/course/exam/services/exam_ai_grading_service.py` |
| Face service | `features/face/services/face_recognition_service.py` |
| Face monitor consumer (WS) | `features/face/consumers/face_monitor_consumer.py` |
| Payment model | `features/payment/models/payment.py` |
| MoMo service | `features/payment/services/momo_service.py` |
| Payment service | `features/payment/services/payment_service.py` |
| IPN view | `features/payment/views/ipn_views.py` |
| Classroom member service | `features/course/classroom/services/classroom_member_service.py` |
| XP service | `features/ranking/services/xp_service.py` |
| XP event catalog | `features/ranking/enums/xp_event.py` |
| Leaderboard service | `features/ranking/services/leaderboard_service.py` |
| Calendar email tasks | `features/calendar/tasks/calendar_email_tasks.py` |
| Calendar notification | `features/calendar/services/calendar_notification_service.py` |
| Attendance service | `features/calendar/services/attendance_service.py` |
| Social post service | `features/social/services/post_service.py` |
| Social follow service | `features/social/services/follow_service.py` |
| Certificate issuance | `features/quiz_collection/services/certificate_issuance_service.py` |
| Resource service | `features/resource/services/resource_service.py` |
| Account (Space) | `features/account/space/` |
| Account (Consumer) | `features/account/consumer/` |
| AGENTS.md | `AGENTS.md` |
| README.md | `README.md` |
