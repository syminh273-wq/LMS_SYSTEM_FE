# Certificate Auto-Award — Implementation & Test Plan

## What was broken

1. **Silent `except Exception: pass`** in `consumer_quiz_viewset.py:160-161` (pre-fix) swallowed every
   certificate-issuance error. The student got a 200 on the quiz but **no `IssuedCertificate` was ever written**.
2. **No lazy issuance** in the `progress` and `certificate` GET endpoints. If issuance failed once
   at submit time, it would never be retried.
3. **No classroom-membership check** in `check_and_issue` (a student could trigger issuance for any classroom).
4. **`int(score_pct)` truncation** in `consumer_quiz_viewset.py:122` (pre-fix) — `66.7 → 66` would silently
   push borderline scores below threshold.
5. **No signal in response** — the frontend could not know the moment a cert was awarded.
6. **No animation/notification** in the frontend when a cert was earned.

## What was changed

### Backend (`/Users/siminh/PycharmProjects/LMS_BACKEND`)

| File | Change |
|------|--------|
| `features/quiz_collection/services/certificate_issuance_service.py` | Added `_is_student_in_classroom` guard, full exception logging, `just_submitted_quiz_id=None` lazy mode, and **self-healing lazy issuance** in `get_student_progress`. |
| `features/quiz/viewsets/consumer_quiz_viewset.py` | Replaced silent `except: pass` with `logger.exception(...)`, fixed `int(score_pct)` → `round(score_pct)`, captured newly issued certs and added them to the response. |
| `features/quiz_collection/viewsets/consumer_quiz_collection_viewset.py` | Added lazy issuance safety net in the `certificate` GET endpoint. |
| `core/management/commands/backfill_certificates.py` (new) | One-shot management command to issue missing certs for any student/classroom/all. |

### Frontend (`/Users/siminh/PycharmProjects/LMS_SYSTEM`)

| File | Change |
|------|--------|
| `apps/consumer-web/src/lib/api/types.ts` | `QuizResult` now includes `is_passed`, `passing_score`, `show_explanation`, and `certificate_issued: IssuedCertificate[]`. |
| `apps/consumer-web/src/components/quiz/certificate-celebration.tsx` (new) | Custom confetti (no extra deps) + modal showing the new cert, view/share/stay actions. |
| `apps/consumer-web/src/app/consumer/classroom/[uid]/quiz/[quizUid]/page.tsx` | Renders the celebration modal on submit + a persistent celebratory card. |
| `apps/consumer-web/src/components/layout/consumer-shell.tsx` | Red-dot badge on the **Certificates** nav item for unseen certs; auto-marks as seen when the user opens `/consumer/certificate`. |
| `apps/consumer-web/src/locales/quiz-collection/{en,vi}.json` | Added 5 celebration keys per locale. |
| `apps/space-web/src/app/space/quiz-collections/[collectionUid]/page.tsx` | Warning banner when a collection has no `certificate_id`. |
| `apps/space-web/src/components/quiz-collection/CreateCollectionDialog.tsx` | New "is certificate collection" checkbox; certificate select is now mandatory + blocked when no templates exist. |
| `apps/space-web/src/locales/quiz-collection/{en,vi}.json` | New i18n keys for the warnings. |

## Verification Steps

### 1. Immediate: backfill the current OOP student

```bash
cd /Users/siminh/PycharmProjects/LMS_BACKEND
python manage.py backfill_certificates --student=<your-student-uid> --dry-run   # preview
python manage.py backfill_certificates --student=<your-student-uid>            # apply
```

Expected output:
```
  ✓ student=… classroom=…: issued 1 new certificate(s).
Backfill complete.
  Issued:   1
  Skipped:  0
  Failed:   0
```

Then verify in the consumer app: the **Certificates** nav item shows a red dot, and `/consumer/certificate/<uid>` shows the OOP cert.

### 2. End-to-end new flow

1. As a teacher: open the OOP collection, confirm the **yellow warning** appears if no cert is linked, then assign one.
2. As a student: open the classroom → expand the OOP collection → answer all missions with 100%.
3. After the last quiz submit, you should see:
   - **Confetti animation** (1.5s)
   - **Modal** with the verification code, "View certificate" + "Share" buttons.
   - **Persistent celebratory card** under the result score.
4. Refresh the classroom page → the red dot on the **Certificates** nav appears.
5. Click **Certificates** → the new cert is there; the red dot clears.

### 3. Lazy issuance safety net

1. Pick any collection where the student is 100% but has no `IssuedCertificate` (use `cqlsh` or Django shell).
2. Call `GET /api/v1/consumer/quiz-collection/<uid>/certificate/?classroom_id=...` — the endpoint should now lazily issue and return the cert.
3. Or open the classroom page — the classroom view polls `progress` and lazy-issues there.

### 4. Edge cases

| Case | Expected | Where to test |
|------|----------|---------------|
| 100% on 1/1 quiz, `passing_score_pct=100` | cert issued (pass=100 ≥ 100) | unit test on `_is_completed` |
| 80% on 1/1 quiz, `passing_score_pct=80` | cert issued | unit test |
| 79% on 1/1 quiz, `passing_score_pct=80` | no cert | unit test |
| 50% on 2/2 quizzes, `passing_score_pct=50` | cert issued (boundary `>=`) | unit test |
| 7/21 (33.3%) on 1/1, `passing_score_pct=33` | cert issued (round, not trunc) | unit test |
| Collection has no `certificate_id` | skip + log INFO (not error) | check logs |
| Student is not a member of classroom | refusal + log WARNING | security test |
| Submit throws DB error | exception logged, response still 200 | error-injection test |

### 5. Teacher UX

1. Open a collection with no cert → see yellow "students will NOT receive a certificate" banner.
2. Open create-collection dialog → see the new "is certificate collection" checkbox.
3. Tick it with zero cert templates → see the "no cert templates available" warning.
4. Tick it with templates → certificate select becomes mandatory (asterisk + validation).

## Smoke run (no full test suite — env is currently broken)

```bash
cd /Users/siminh/PycharmProjects/LMS_SYSTEM
npx tsc --noEmit -p apps/consumer-web/tsconfig.json   # only pre-existing exam/page errors
npx tsc --noEmit -p apps/space-web/tsconfig.json      # only pre-existing errors
cd /Users/siminh/PycharmProjects/LMS_BACKEND
python -c "import ast; ast.parse(open('features/quiz_collection/services/certificate_issuance_service.py').read()); print('OK')"
python -c "import ast; ast.parse(open('features/quiz/viewsets/consumer_quiz_viewset.py').read()); print('OK')"
python -c "import ast; ast.parse(open('features/quiz_collection/viewsets/consumer_quiz_collection_viewset.py').read()); print('OK')"
python -c "import ast; ast.parse(open('core/management/commands/backfill_certificates.py').read()); print('OK')"
```

## Roll-out checklist

- [ ] Deploy backend, check logs for `[Certificate]` lines
- [ ] Run `backfill_certificates --student=<uid>` for the OOP user
- [ ] Verify the OOP cert appears in `/consumer/certificate`
- [ ] Deploy frontend, do an end-to-end 100% test in staging
- [ ] Verify confetti + red-dot badge + modal in browser
- [ ] Verify teacher warning banners appear in space-web
- [ ] Optional: run `backfill_certificates --all --dry-run` to estimate how many students have missing certs
