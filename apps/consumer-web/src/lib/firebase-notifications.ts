import { getDatabase, ref, set } from "firebase/database";
import firebaseApp, { firebaseConfig } from "./firebase";

const RTDB_URL = firebaseConfig.databaseURL;

let cachedDb: ReturnType<typeof getDatabase> | null = null;

function getDb() {
  if (cachedDb) return cachedDb;
  if (!firebaseApp) throw new Error("Firebase app not initialized");
  cachedDb = RTDB_URL
    ? getDatabase(firebaseApp, RTDB_URL)
    : getDatabase(firebaseApp);
  return cachedDb;
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
