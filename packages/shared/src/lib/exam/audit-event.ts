const AUDIT_VIOLATION_EVENTS = [
  'tab_leave',
  'window_out',
  'window_blur',
  'app_blur',
  'fullscreen_exit',
  'visibility_lost',
  'camera_lost',
  'face_not_recognized',
  'multiple_faces',
  'no_face',
] as const;

const AUDIT_LIMIT_EVENTS = [
  'visibility_breaks_exceeded',
  'face_warnings_exceeded',
] as const;

const AUDIT_FORCE_EVENTS = ['force_submitted'] as const;

const HUMAN_LABELS: Record<string, string> = {
  joined: 'Bắt đầu làm bài',
  submitted: 'Bạn đã nộp bài',
  timeout_submit: 'Hết giờ — hệ thống đã tự nộp giúp bạn',
  force_submitted: 'Bài thi đã được nộp bắt buộc do vi phạm quy chế',
  tab_leave: 'Bạn vừa rời khỏi tab bài thi',
  tab_return: 'Bạn đã quay lại tab bài thi',
  window_out: 'Bạn vừa chuyển sang cửa sổ khác',
  window_back: 'Bạn đã quay lại cửa sổ bài thi',
  window_blur: 'Cửa sổ bài thi vừa mất tiêu điểm',
  app_blur: 'Ứng dụng vừa chuyển sang nền',
  app_focus: 'Bạn đã quay lại ứng dụng',
  fullscreen_exit: 'Bạn vừa thoát chế độ toàn màn hình',
  visibility_lost: 'Trang bài thi vừa bị ẩn',
  visibility_restored: 'Trang bài thi đã hiển thị lại',
  camera_lost: 'Không nhận tín hiệu camera — bạn kiểm tra lại nhé',
  no_face: 'Chưa thấy bạn trong khung hình',
  face_not_recognized:
    'Chưa nhận diện được khuôn mặt — bạn ngồi thẳng và nhìn thẳng camera nhé',
  face_recognized: 'Đã nhận diện khuôn mặt thành công',
  multiple_faces: 'Có nhiều người trong khung hình — bạn đảm bảo chỉ mình bạn nhé',
  visibility_breaks_exceeded:
    'Bạn đã rời màn hình quá nhiều lần — hệ thống đã nộp bài bắt buộc',
  face_warnings_exceeded:
    'Bạn đã vi phạm quy chế camera quá nhiều lần — hệ thống đã nộp bài bắt buộc',
};

export function humanizeAuditEvent(eventType: string): string {
  return HUMAN_LABELS[eventType] ?? eventType;
}

export function isAuditViolation(eventType: string): boolean {
  return (AUDIT_VIOLATION_EVENTS as readonly string[]).includes(eventType);
}

export function isAuditLimit(eventType: string): boolean {
  return (AUDIT_LIMIT_EVENTS as readonly string[]).includes(eventType);
}

export function isAuditForce(eventType: string): boolean {
  return (AUDIT_FORCE_EVENTS as readonly string[]).includes(eventType);
}

function formatIsoTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

function toNumber(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function formatAuditEventData(
  eventType: string,
  raw: unknown,
): string {
  if (!raw || typeof raw !== 'object') return '';
  const data = raw as Record<string, unknown>;

  if (eventType === 'joined') {
    const start = typeof data.started_at === 'string' ? data.started_at : null;
    const end = typeof data.ends_at === 'string' ? data.ends_at : null;
    if (start && end)
      return `Bắt đầu lúc ${formatIsoTime(start)} · Kết thúc lúc ${formatIsoTime(end)}`;
  }

  if (eventType === 'submitted' || eventType === 'timeout_submit') {
    const ts = typeof data.submitted_at === 'string' ? data.submitted_at : null;
    if (ts) return `Đã nộp lúc ${formatIsoTime(ts)}`;
  }

  if (eventType === 'force_submitted') {
    const reason = typeof data.reason === 'string' ? data.reason : '';
    const count = toNumber(data.count);
    const max = toNumber(data.max);
    const reasonText =
      reason === 'face_warnings_exceeded'
        ? 'vi phạm quy chế camera'
        : reason === 'visibility_breaks_exceeded'
          ? 'rời màn hình quá nhiều lần'
          : 'vi phạm quy chế thi';
    if (count != null && max != null) return `Lý do: ${reasonText} (${count}/${max})`;
    return `Lý do: ${reasonText}`;
  }

  if (isAuditLimit(eventType)) {
    const count = toNumber(data.count);
    const max = toNumber(data.max);
    if (count != null && max != null)
      return `Bạn đã vi phạm ${count}/${max} lần cho phép`;
  }

  if (eventType === 'face_not_recognized') {
    const sim = toNumber(data.similarity);
    if (sim != null) return `Mức độ khớp: ${Math.round(sim * 100)}%`;
  }

  if (eventType === 'multiple_faces') {
    const fc = toNumber(data.face_count);
    if (fc != null) return `Phát hiện ${fc} người trong khung hình`;
  }

  if (eventType === 'camera_lost' || eventType === 'no_face') {
    const fc = toNumber(data.face_count);
    if (fc != null) return `Số khuôn mặt phát hiện: ${fc}`;
  }

  if (
    eventType === 'tab_leave' ||
    eventType === 'window_out' ||
    eventType === 'window_blur' ||
    eventType === 'app_blur' ||
    eventType === 'fullscreen_exit' ||
    eventType === 'visibility_lost'
  ) {
    const total = toNumber(data.visibility_breaks_count);
    if (total != null) return `Tổng số lần rời màn hình: ${total}`;
  }

  return '';
}

export function formatAuditClockTime(iso: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}
