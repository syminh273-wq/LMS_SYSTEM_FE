import { getDatabase, ref, set } from "firebase/database";
import firebaseApp from "./firebase";

export async function sendJoinClassroomNotification(params: {
  classroomId: string;
  classroomName: string;
  code: string;
}) {
  if (!firebaseApp) return;
  const db = getDatabase(firebaseApp);
  await set(ref(db, "signals/new_notification"), {
    classroom_id: params.classroomId,
    classroom_name: params.classroomName,
    code: params.code,
    at: Date.now(),
  });
}
