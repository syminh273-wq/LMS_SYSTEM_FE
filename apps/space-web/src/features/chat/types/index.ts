export type MsgType = 'text' | 'image' | 'video' | 'audio' | 'pdf' | 'file';

export interface ChatAttachment {
  uid: string | null;
  url: string;
  name: string;
  size: number;
  type: MsgType;
}

export interface ChatMessage {
  uid: string;
  conversation_uid: string;
  msg_type: MsgType;
  content: string;
  sender_id: string | null;
  sender_type: 'space' | 'consumer' | string;
  sender_name: string;
  attachment: ChatAttachment | null;
  created_at: string;
}

export interface ChatConversation {
  uid: string;
  type: 'channel' | 'direct';
  name: string;
  description: string;
  classroom_uid: string | null;
  member_count: number;
  last_msg_text: string;
  last_msg_sender: string;
  last_msg_at: string | null;
  created_at: string;
}
