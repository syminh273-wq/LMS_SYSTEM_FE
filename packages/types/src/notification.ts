export type NotificationMetadata = {
  classroom_uid?: string;
  classroom_name?: string;
  status?: string;
  student_uid?: string;
  student_name?: string;
  [key: string]: unknown;
};

export type NotificationItem = {
  uid: string;
  target_uid: string;
  notify_type: string;
  type?: string;
  title: string;
  content: string;
  metadata: string | NotificationMetadata;
  is_read: boolean;
  created_at: string;
};
