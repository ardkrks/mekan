import { User, Room, Message, SyncResponse } from "../types";

const LOCAL_STORAGE_KEY_USER = "ichat_user_v1";

export function getLocalUser(): User | null {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY_USER);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function saveLocalUser(user: User): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_USER, JSON.stringify(user));
  } catch (error) {
    console.error("Error saving user to localstorage:", error);
  }
}

export function removeLocalUser(): void {
  localStorage.removeItem(LOCAL_STORAGE_KEY_USER);
}

// REST Services
export async function registerUser(data: {
  username: string;
  password?: string;
  avatarEmoji: string;
  avatarBg: string;
}): Promise<{ user: User }> {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Kayıt olunurken bir hata oluştu.");
  }
  return response.json();
}

export async function loginUser(data: {
  username: string;
  password?: string;
}): Promise<{ user: User }> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Giriş başarısız. Lütfen şifrenizi kontrol edin.");
  }
  return response.json();
}

export async function updateUserProfile(data: {
  id: string;
  username: string;
  avatarEmoji: string;
  avatarBg: string;
  avatarUrl?: string;
  bio?: string;
  statusText?: string;
}): Promise<{ user: User }> {
  const response = await fetch("/api/auth/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Profil güncellenemedi.");
  }
  return response.json();
}

export async function syncState(uid?: string, roomId?: string): Promise<SyncResponse> {
  const query = new URLSearchParams();
  if (uid) query.append("uid", uid);
  if (roomId) query.append("roomId", roomId);
  
  const response = await fetch(`/api/sync?${query.toString()}`);
  if (!response.ok) {
    throw new Error("Sunucu ile senkronizasyon başarısız oldu.");
  }
  return response.json();
}

export async function createRoom(data: {
  name: string;
  description: string;
  avatarEmoji: string;
  avatarBg: string;
  creatorId: string;
}): Promise<Room> {
  const response = await fetch("/api/rooms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Grup oluşturulamadı.");
  }
  return response.json();
}

export async function joinRoomByCode(inviteCode: string): Promise<Room> {
  const response = await fetch("/api/rooms/join", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ inviteCode }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Grup bulunamadı.");
  }
  return response.json();
}

export async function postMessage(data: {
  roomId: string;
  senderId: string;
  senderName: string;
  senderAvatarEmoji: string;
  senderAvatarBg: string;
  text: string;
  image?: string | null;
  audio?: string | null;
  audioDuration?: number | null;
  replyTo?: {
    id: string;
    senderName: string;
    text: string;
  } | null;
}): Promise<Message> {
  const response = await fetch("/api/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Mesaj gönderilemedi.");
  }
  return response.json();
}

export async function reactToMessage(data: {
  messageId: string;
  emoji: string;
  userId: string;
  username: string;
}): Promise<Message> {
  const response = await fetch("/api/messages/react", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Tepki eklenemedi.");
  }
  return response.json();
}

// --- ADMIN SERVICES ---

export async function adminDeleteMessage(adminId: string, messageId: string): Promise<boolean> {
  const response = await fetch("/api/admin/delete-message", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ adminId, messageId }),
  });
  return response.ok;
}

export async function adminDeleteRoom(adminId: string, roomId: string): Promise<boolean> {
  const response = await fetch("/api/admin/delete-room", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ adminId, roomId }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Grup silinemedi.");
  }
  return response.ok;
}

export async function adminFetchUsers(adminId: string): Promise<User[]> {
  const response = await fetch("/api/admin/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ adminId }),
  });
  if (!response.ok) {
    throw new Error("Kullanıcı listesi alınamadı.");
  }
  const data = await response.json();
  return data.users;
}

export async function adminBanUser(adminId: string, targetUserId: string): Promise<boolean> {
  const response = await fetch("/api/admin/ban-user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ adminId, targetUserId }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Kullanıcı banlanamadı.");
  }
  return response.ok;
}

export async function adminSetUserStatus(
  adminId: string, 
  targetUserId: string, 
  status: "approved" | "rejected" | "pending"
): Promise<boolean> {
  const response = await fetch("/api/admin/set-user-status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ adminId, targetUserId, status }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "İşlem gerçekleştirilemedi.");
  }
  return response.ok;
}

// Resizes images in-browser to save upload size (Base64 is compressed to fit < 250kb comfortably)
export function compressImage(file: File, maxWidth = 600, maxHeight = 600): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Output compressed jpeg format to save size
        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
        resolve(compressedBase64);
      };
      img.onerror = () => reject(new Error("Görsel yüklenemedi"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Dosya okunamadı."));
    reader.readAsDataURL(file);
  });
}

export async function fetchMembers(): Promise<User[]> {
  const response = await fetch("/api/users/members");
  if (!response.ok) {
    throw new Error("Üye listesi alınamadı.");
  }
  const data = await response.json();
  return data.members;
}

export async function getOrCreateDMRoom(user1Id: string, user2Id: string): Promise<Room> {
  const response = await fetch("/api/rooms/dm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user1Id, user2Id }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Özel sohbet odası oluşturulamadı.");
  }
  return response.json();
}

