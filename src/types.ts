export interface User {
  id: string;
  username: string;
  avatarEmoji: string;
  avatarBg: string; // Tailwind class e.g., 'bg-blue-500'
  joinedAt: number;
  role?: 'admin' | 'user';
  status?: 'pending' | 'approved' | 'rejected';
  avatarUrl?: string; // base64 representation of a custom uploaded profile picture
  bio?: string; // optional user bio
  statusText?: string; // optional status message
}

export interface Room {
  id: string;
  name: string;
  description: string;
  avatarEmoji: string;
  avatarBg: string;
  createdBy: string;
  createdAt: number;
  inviteCode: string;
  isDM?: boolean;
  dmUserIds?: string[];
}

export interface MessageReaction {
  emoji: string;
  users: { id: string; username: string }[];
}

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderAvatarEmoji: string;
  senderAvatarBg: string;
  senderAvatarUrl?: string; // custom profile photo represented as URL/base64
  text: string;
  image?: string; // base64 dataurl
  audio?: string; // base64 dataurl
  audioDuration?: number; // in seconds
  timestamp: number;
  reactions: MessageReaction[];
  replyTo?: {
    id: string;
    senderName: string;
    text: string;
  } | null;
}

export interface SyncResponse {
  rooms: Room[];
  messages: Message[];
  activeUsersCount: { [roomId: string]: number };
  userStatus?: 'pending' | 'approved' | 'rejected';
  userRole?: 'admin' | 'user';
}
