# Voice Setting API Documentation

Module này quản lý cấu hình Voice (TTS) cho người dùng, bao gồm việc bật/tắt voice, chọn loại giọng nói và ngôn ngữ.

**Base URL**: `/api/v1/account/voice-settings/`

---

## 1. Lấy cấu hình Voice hiện tại
Trả về cấu hình của người dùng đang đăng nhập. Nếu chưa có, hệ thống sẽ tự động tạo cấu hình mặc định.

- **Endpoint**: `GET /`
- **Auth**: Required (Bearer Token)
- **Response**: `200 OK`
```json
{
    "user_id": "uuid-v7-string",
    "user_type": "consumer", // hoặc "space"
    "voice_name": "vi-VN-HoaiMyNeural",
    "is_voice_enabled": true,
    "language": "vi-VN",
    "updated_at": "2026-06-04T11:22:00Z"
}
```

---

## 2. Cập nhật cấu hình Voice
Cập nhật một hoặc nhiều trường trong cấu hình voice.

- **Endpoint**: `PATCH /`
- **Auth**: Required (Bearer Token)
- **Request Body**:
```json
{
    "voice_name": "en-US-JennyNeural",
    "is_voice_enabled": false,
    "language": "en-US"
}
```
- **Response**: `200 OK` (Trả về object đã cập nhật)

---

## 3. Lấy danh sách Voice khả dụng
Trả về danh sách các giọng nói được hệ thống hỗ trợ.

- **Endpoint**: `GET /available-voices/`
- **Auth**: Required (Bearer Token)
- **Response**: `200 OK`
```json
[
    {
        "id": "vi-VN-HoaiMyNeural",
        "name": "Vietnamese - Hoai My (Female)"
    },
    {
        "id": "vi-VN-NamMinhNeural",
        "name": "Vietnamese - Nam Minh (Male)"
    },
    {
        "id": "en-US-AriaNeural",
        "name": "English (US) - Aria (Female)"
    },
    ...
]
```

---

## Danh sách Voice Constants (Backend)

| ID | Description |
|---|---|
| `vi-VN-HoaiMyNeural` | Vietnamese (Female) |
| `vi-VN-NamMinhNeural` | Vietnamese (Male) |
| `en-US-AriaNeural` | English US (Female) |
| `en-US-GuyNeural` | English US (Male) |
| `en-US-JennyNeural` | English US (Female) |
| `en-GB-SoniaNeural` | English UK (Female) |
| `en-GB-RyanNeural` | English UK (Male) |
| `zh-CN-XiaoxiaoNeural` | Chinese (Female) |
| `zh-CN-YunjianNeural` | Chinese (Male) |
