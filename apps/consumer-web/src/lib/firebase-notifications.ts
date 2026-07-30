import { ref, set } from "firebase/database";
import firebaseApp, { getRealtimeDatabase } from "./firebase";

function getDb() {
  const db = getRealtimeDatabase();
  if (!db) throw new Error("Firebase app not initialized");
  return db;
}

export async function sendJoinClassroomNotification(params: {
  classroomId: string;
  classroomName: string;
  code: string;
}) {
  if (!firebaseApp) return;
  const db = getDb();
  await set(ref(db, "signals/new_notification"), {
    classroom_id: params.classroomId,
    classroom_name: params.classroomName,
    code: params.code,
    at: Date.now(),
  });
}
