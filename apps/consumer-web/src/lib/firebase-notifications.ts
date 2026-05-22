import { getDatabase, ref, set } from "firebase/database";
import firebaseApp from "./firebase";

export async function sendJoinClassroomNotification(params: {
  classroomId: string;
  classroomName: string;
  code: string;
}) {
  const db = getDatabase(firebaseApp);
  // Ghi signal real-time để space-web biết có thông báo mới ngay lập tức
  await set(ref(db, "signals/new_notification"), {
    classroom_id: params.classroomId,
    classroom_name: params.classroomName,
    code: params.code,
    at: Date.now(),
  });
}
