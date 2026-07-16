# Quiz Generation — Async Task Flow (Frontend Guide)

> Stack: Django REST + django-rq + Redis + Ollama (local LLM)
> Module: `features/quiz/`

---

## Tổng quan

Quiz generation gồm **3 chế độ**, FE chỉ cần dùng **1 chế độ async (task queue)** để tránh block UI:

| Mode | Endpoint | Thời gian phản hồi | Ghi chú |
|------|----------|-------------------|---------|
| Sync | `POST /api/v1/space/quiz/generate/` | ~30s–2 phút | ❌ Không khuyến nghị, block request |
| SSE Stream | `POST /api/v1/space/quiz/generate-stream/` | Giữ connection mở | Live từng câu |
| **Async Task** | `POST /api/v1/space/quiz/generate-task/` | **< 1s (202)** | ✅ **Khuyến nghị** |

**Tài liệu này mô tả chế độ Async Task.**

---

## Flow tổng thể

```
┌────────┐  1. POST /generate-task/   ┌─────────┐
│  FE    │ ─────────────────────────► │ Backend │
│        │ ◄───────────────────────── │         │
│        │   202 { task_id, status }  │         │
└────┬───┘                            └────┬────┘
     │                                    │ enqueue RQ
     │                                    ▼
     │                               ┌─────────┐
     │                               │  Redis  │  queue "default"
     │                               │ (DB 10) │
     │                               └────┬────┘
     │                                    │ pick
     │                                    ▼
     │                               ┌─────────────┐
     │                               │  RQ Worker  │
     │                               │  - call LLM │ ──► Ollama
     │                               │  - save DB  │ ──► Cassandra
     │                               │  - index    │ ──► Typesense
     │                               └────┬────────┘
     │                                    │
     │   2. GET /tasks/<task_id>/  ◄──────┘
     │   (FE poll mỗi 2-5s)
     ▼
┌────────┐
│  FE    │ → status: queued | running | successful | failed
└────────┘
```

---

## Bước 1 — Submit (Enqueue)

### Request

```http
POST /api/v1/space/quiz/generate-task/
Authorization: Bearer <jwt_access_token>
Content-Type: application/json
```

**Body (chọn 1 trong 3 nguồn nội dung):**

```json
{
  "content": "<paste trực tiếp text vào đây>",
  "quiz_type": "multiple_choice",
  "num_questions": 10,
  "max_content_length": 12000
}
```

**Hoặc dùng `resource_id` đã upload:**

```json
{
  "resource_id": "b3a4-...-uuid",
  "quiz_type": "multiple_choice",
  "num_questions": 10
}
```

**Hoặc upload file PDF trực tiếp** (multipart/form-data):

```
file: <binary>
quiz_type: multiple_choice
num_questions: 10
```

### Field reference

| Field | Type | Required | Default | Ghi chú |
|-------|------|----------|---------|---------|
| `content` | string | một trong 3 | — | Text thô để LLM đọc |
| `resource_id` | uuid | một trong 3 | — | File đã upload trong hệ thống |
| `file` | file (PDF) | một trong 3 | — | Backend tự extract text |
| `quiz_type` | string | ❌ | `multiple_choice` | `multiple_choice` \| `essay` |
| `num_questions` | int | ❌ | `10` | Số câu muốn sinh |
| `max_content_length` | int | ❌ | `12000` | Cắt content quá dài |

### Response 202 — Accepted

```json
{
  "task_id": "9f1c2e8a-7b3d-4a1e-9f2c-1d8e6b4a3c2f",
  "status": "queued"
}
```

> **Lưu lại `task_id` ngay** — đây là key để poll status.
> Server xử lý job trong queue với **timeout 300s (5 phút)**.

### Response 400 — Bad Request

```json
{
  "detail": "Provide 'content', 'resource_id', or upload a 'file'."
}
```

hoặc

```json
{
  "detail": "Không thể đọc file PDF: <error>"
}
```

---

## Bước 2 — Poll Status

### Request

```http
GET /api/v1/space/quiz/tasks/<task_id>/
Authorization: Bearer <jwt_access_token>
```

### Bảng trạng thái

| `status` | Ý nghĩa | Hành động FE | Có `result`? | Có `error`? |
|----------|----------|--------------|--------------|-------------|
| `queued` | Job đang chờ trong Redis, worker chưa nhận | Tiếp tục poll | ❌ | ❌ |
| `running` | Worker đang gọi LLM + ghi DB | Tiếp tục poll, có thể show spinner "Đang tạo câu hỏi..." | ❌ | ❌ |
| `successful` | Quiz đã tạo xong trong DB | Navigate tới chi tiết quiz | ✅ | ❌ |
| `failed` | Lỗi (LLM timeout, exception, v.v.) | Hiện error, cho retry | ❌ | ✅ |

### Response — `queued` / `running`

```json
{
  "task_id": "9f1c2e8a-7b3d-4a1e-9f2c-1d8e6b4a3c2f",
  "status": "queued",
  "result": null,
  "error": null
}
```

### Response — `successful`

```json
{
  "task_id": "9f1c2e8a-7b3d-4a1e-9f2c-1d8e6b4a3c2f",
  "status": "successful",
  "result": {
    "quiz_uid": "a1b2c3d4-...-uuid",
    "title": "Chapter 1: Introduction to Algebra",
    "description": "Auto-generated from your material",
    "questions_count": 10
  },
  "error": null
}
```

> **Dùng `result.quiz_uid`** để navigate tới trang chi tiết quiz, ví dụ:
> ```
> GET /api/v1/space/quiz/quizzes/<quiz_uid>/
> ```

### Response — `failed`

```json
{
  "task_id": "9f1c2e8a-7b3d-4a1e-9f2c-1d8e6b4a3c2f",
  "status": "failed",
  "result": null,
  "error": "Traceback (most recent call last):\n  ...\nTimeoutError: ..."
}
```

> `error` chứa full traceback — chỉ hiển thị message chính cho user, log full cho dev.

### Response — 404 Not Found

```json
{
  "detail": "Task \"9f1c2e8a-...\" not found."
}
```

> 404 có thể xảy ra nếu:
> - `task_id` sai / nhầm
> - Job đã bị Redis xóa sau TTL (mặc định ~500s sau khi finish)
> - Worker chưa chạy → job bị drop

---

## Polling Strategy (khuyến nghị)

### Cách 1 — Interval đơn giản

```ts
async function pollTaskStatus(taskId: string): Promise<TaskResult> {
  const interval = 2000;       // 2s
  const maxDuration = 300_000; // 5 phút
  const start = Date.now();

  while (Date.now() - start < maxDuration) {
    const res = await fetch(`/api/v1/space/quiz/tasks/${taskId}/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 404) throw new Error('Task not found');
    const data = await res.json();

    if (data.status === 'successful') return data.result;
    if (data.status === 'failed') throw new Error(data.error);

    await sleep(interval);
  }
  throw new Error('Task timeout');
}
```

### Cách 2 — Backoff (tiết kiệm request hơn)

```ts
// 2s → 3s → 5s → 5s → 5s ...
const delays = [2000, 3000, 5000];
let i = 0;
while (...) {
  await sleep(delays[Math.min(i++, delays.length - 1)]);
}
```

### Dừng poll khi

- ✅ `status === 'successful'` → lấy `result.quiz_uid`
- ❌ `status === 'failed'` → show error
- ⏱️ Quá 5 phút (timeout RQ = 300s)
- 🚫 404 (job đã bị xóa)
- 🚪 User rời trang → `AbortController` / `clearInterval`

---

## Sequence Diagram

```
FE                Backend              Redis          RQ Worker       Ollama
│                     │                   │                │             │
│── POST ────────────►│                   │                │             │
│   /generate-task/   │                   │                │             │
│                     │── enqueue(job) ──►│                │             │
│◄── 202 {task_id} ───│                   │                │             │
│                     │                   │── pick job ───►│             │
│                     │                   │                │── chat() ──►│
│── GET ─────────────►│                   │                │   (30-90s)  │
│   /tasks/<id>/      │                   │                │             │
│◄── queued/running ──│                   │                │             │
│  (poll 2-5s)        │                   │                │◄── JSON ────│
│                     │                   │                │   parse +   │
│                     │                   │                │   save DB   │
│── GET ─────────────►│                   │                │             │
│◄── successful ──────│                   │                │             │
│   { quiz_uid }      │                   │                │             │
│                     │                   │                │             │
│── GET /quizzes/<quiz_uid>/             │                │             │
│─── render quiz detail ─►                │                │             │
```

---

## Edge Cases cho FE

| Tình huống | Xử lý |
|------------|-------|
| User refresh giữa lúc poll | Mất `task_id` → cho nhập lại từ list, hoặc backend nên lưu `task_id` theo user vào localStorage / DB |
| User click "Generate" 2 lần liên tiếp | Disable button khi đang enqueue + poll. Có thể dùng idempotency key nếu backend hỗ trợ (hiện chưa có) |
| Job 404 ngay sau khi enqueue | Worker có thể chưa chạy, hoặc Redis flush. Show "Hệ thống đang bận, thử lại sau" |
| `failed` vì timeout 300s | Content quá dài, FE nên giảm `num_questions` hoặc tăng `max_content_length` (nhưng LLM cũng chậm theo) |
| Muốn hủy job đang chạy | Hiện backend chưa expose cancel endpoint. Có thể gọi RQ admin hoặc chờ timeout tự nhiên |

---

## Code Reference (Backend)

| File | Vai trò |
|------|---------|
| `features/quiz/viewsets/quiz_viewset.py:300-352` | Endpoint enqueue |
| `features/quiz/viewsets/quiz_viewset.py:354-392` | Endpoint poll status |
| `features/quiz/tasks/generate_quiz_task.py:17-64` | Worker function (gọi LLM + save DB) |
| `features/quiz/tasks/serializers.py` | Response shape |
| `features/quiz/services/quiz_generation_service.py:222-259` | LLM call (Ollama sync) |
| `features/quiz/services/quiz_service.py` | Lưu quiz + questions vào Cassandra |
| `LMS_SYSTEM/settings.py:118-145` | Cấu hình Redis + RQ |
| `pyproject.toml:39-41` | `django-rq`, `rq`, `redis` |

---

## TL;DR cho FE

```ts
// 1. Submit
const { task_id } = await api.post('/api/v1/space/quiz/generate-task/', {
  content: '...',
  num_questions: 10,
  quiz_type: 'multiple_choice',
});

// 2. Poll
const result = await pollUntilDone(task_id);

// 3. Navigate
router.push(`/quizzes/${result.quiz_uid}`);
```

Happy polling! 🎯
