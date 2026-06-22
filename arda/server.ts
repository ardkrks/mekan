import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { Room, Message, SyncResponse } from "./src/types";

const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "db.json");

// Helper to load database
function loadDb(): { rooms: Room[]; messages: Message[]; users: any[] } {
  let parsed: any = null;
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      parsed = JSON.parse(data);
    }
  } catch (error) {
    console.error("Database reading error, using fallback instead", error);
  }

  if (!parsed) {
    // Default Database Setup
    parsed = {
      rooms: [
        {
          id: "general",
          name: "Genel Grup ☕",
          description: "Arkadaşlarımızla geyik yaptığımız ana sohbet odası.",
          avatarEmoji: "☕",
          avatarBg: "bg-indigo-500",
          createdBy: "sistem",
          createdAt: Date.now(),
          inviteCode: "GENEL"
        },
        {
          id: "weekend-plans",
          name: "Hafta Sonu Planları 🍕",
          description: "Buluşmalar, sinema ve aktiviteler için plan yeri.",
          avatarEmoji: "🍕",
          avatarBg: "bg-emerald-500",
          createdBy: "sistem",
          createdAt: Date.now() - 3600000,
          inviteCode: "PLAN1"
        }
      ],
      messages: [
        {
          id: "system-1",
          roomId: "general",
          senderId: "system",
          senderName: "Bilgilendirme",
          senderAvatarEmoji: "🤖",
          senderAvatarBg: "bg-slate-700",
          text: "Ardanın Mekanı'na hoş geldiniz! Bu mobil tasarımlı uygulamayı Safari'de 'Ana Ekrana Ekle' diyerek gerçek bir iOS uygulaması gibi kullanabilirsiniz.",
          timestamp: Date.now() - 1200000,
          reactions: []
        }
      ],
      users: []
    };
  }

  if (!parsed.users) {
    parsed.users = [];
  }

  // Ensure ardkrks admin account exists and is marked as admin
  const adminIndex = parsed.users.findIndex((u: any) => u.username.toLowerCase() === "ardkrks");
  if (adminIndex === -1) {
    parsed.users.push({
      id: "admin_ard",
      username: "ardkrks",
      password: "ARDKRKSfb2005",
      avatarEmoji: "👑",
      avatarBg: "bg-amber-500",
      joinedAt: Date.now(),
      role: "admin",
      status: "approved"
    });
    saveDb(parsed);
  } else {
    // Ensure accurate password, role, emoji, and status
    let changed = false;
    if (parsed.users[adminIndex].role !== "admin") {
      parsed.users[adminIndex].role = "admin";
      changed = true;
    }
    if (parsed.users[adminIndex].password !== "ARDKRKSfb2005") {
      parsed.users[adminIndex].password = "ARDKRKSfb2005";
      changed = true;
    }
    if (parsed.users[adminIndex].avatarEmoji !== "👑") {
      parsed.users[adminIndex].avatarEmoji = "👑";
      changed = true;
    }
    if (parsed.users[adminIndex].status !== "approved") {
      parsed.users[adminIndex].status = "approved";
      changed = true;
    }
    if (changed) {
      saveDb(parsed);
    }
  }

  // Ensure all other existing users have a status, defaulting to approved
  let migrationChanged = false;
  parsed.users.forEach((u: any) => {
    if (u.username.toLowerCase() !== "ardkrks" && !u.status) {
      u.status = "approved";
      migrationChanged = true;
    }
  });
  if (migrationChanged) {
    saveDb(parsed);
  }

  return parsed;
}

// Helper to save database
function saveDb(data: { rooms: Room[]; messages: Message[]; users: any[] }) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Database saving error:", error);
  }
}

async function startServer() {
  const app = express();

  // Increase body limit for custom voice recordings & photos (Base64)
  app.use(express.json({ limit: "25mb" }));
  app.use(express.urlencoded({ limit: "25mb", extended: true }));

  // Keep track of active connections to simulate online room users count
  // Map of userId -> timestamp of last poll
  const activeUsers: { [uid: string]: { lastSeen: number; activeRoomId: string } } = {};

  // Clean inactive users periodic cleanup (older than 10 seconds considered idle/offline)
  setInterval(() => {
    const now = Date.now();
    for (const uid in activeUsers) {
      if (now - activeUsers[uid].lastSeen > 12000) {
        delete activeUsers[uid];
      }
    }
  }, 10000);

  // --- API ENDPOINTS ---

  // Sync endpoint (Polling)
  app.get("/api/sync", (req, res) => {
    const uid = req.query.uid as string;
    const roomId = req.query.roomId as string;
    
    const db = loadDb();
    
    let userRecord = null;
    let isApproved = true; // default to true if they are old or didn't supply uid, though clients should supply uid

    if (uid) {
      userRecord = db.users.find(u => u.id === uid);
      if (userRecord) {
        // If they have record, default status to approved if somehow empty
        const status = userRecord.status || "approved";
        if (status !== "approved") {
          isApproved = false;
        }
      }
      
      activeUsers[uid] = {
        lastSeen: Date.now(),
        activeRoomId: roomId || ""
      };
    }

    if (!isApproved) {
      // Return safe empty representation for unapproved/pending users
      return res.json({
        rooms: [],
        messages: [],
        activeUsersCount: {},
        userStatus: userRecord ? (userRecord.status || "pending") : "pending",
        userRole: userRecord ? (userRecord.role || "user") : "user"
      });
    }

    // Calculate active user count per room
    const activeUsersCount: { [roomId: string]: number } = {};
    // Default system rooms have at least some simulated activity or the real connected users count
    db.rooms.forEach(r => {
      activeUsersCount[r.id] = 1; // standard self/default
    });

    Object.values(activeUsers).forEach(user => {
      if (user.activeRoomId) {
        activeUsersCount[user.activeRoomId] = (activeUsersCount[user.activeRoomId] || 0) + 1;
      }
    });

    const messagesWithRealtimeProfiles = db.messages.slice(-300).map((msg) => {
      const u = db.users.find(usr => usr.id === msg.senderId);
      if (u) {
        return {
          ...msg,
          senderName: u.username,
          senderAvatarEmoji: u.avatarEmoji,
          senderAvatarBg: u.avatarBg,
          senderAvatarUrl: u.avatarUrl
        };
      }
      return msg;
    });

    res.json({
      rooms: db.rooms,
      messages: messagesWithRealtimeProfiles, // Keep client payloads performance optimized
      activeUsersCount,
      userStatus: userRecord ? (userRecord.status || "approved") : "approved",
      userRole: userRecord ? (userRecord.role || "user") : "user"
    });
  });

  // Create room endpoint
  app.post("/api/rooms", (req, res) => {
    const { name, description, avatarEmoji, avatarBg, creatorId } = req.body;
    
    if (!name || !avatarEmoji) {
      return res.status(400).json({ error: "Grup ismi ve emoji gereklidir." });
    }

    const db = loadDb();
    const inviteCode = Math.random().toString(36).substring(2, 7).toUpperCase();
    
    const newRoom: Room = {
      id: "room_" + Math.random().toString(36).substring(2, 9),
      name,
      description: description || "Grup sohbet odası",
      avatarEmoji,
      avatarBg: avatarBg || "bg-blue-500",
      createdBy: creatorId || "anonim",
      createdAt: Date.now(),
      inviteCode
    };

    db.rooms.push(newRoom);
    saveDb(db);
    res.json(newRoom);
  });

  // Join room by invite code
  app.post("/api/rooms/join", (req, res) => {
    const { inviteCode } = req.body;
    
    if (!inviteCode) {
      return res.status(400).json({ error: "Davet kodu gereklidir." });
    }

    const db = loadDb();
    const code = inviteCode.toString().trim().toUpperCase();
    const room = db.rooms.find(r => r.inviteCode === code || r.id === inviteCode);

    if (!room) {
      return res.status(404).json({ error: "Grup bulunamadı. Lütfen davet kodunu kontrol edin." });
    }

    res.json(room);
  });

  // Create or get DM room
  app.post("/api/rooms/dm", (req, res) => {
    const { user1Id, user2Id } = req.body;
    
    if (!user1Id || !user2Id) {
      return res.status(400).json({ error: "İki kullanıcı kimliği de gereklidir." });
    }

    const db = loadDb();
    
    // Find existing DM room between these two users
    const existingRoom = db.rooms.find(r => 
      r.isDM && 
      r.dmUserIds && 
      r.dmUserIds.includes(user1Id) && 
      r.dmUserIds.includes(user2Id)
    );

    if (existingRoom) {
      return res.json(existingRoom);
    }

    // Get usernames for naming the DM room as fallback
    const u1 = db.users.find(u => u.id === user1Id);
    const u2 = db.users.find(u => u.id === user2Id);
    const u1Name = u1 ? u1.username : "Kullanıcı 1";
    const u2Name = u2 ? u2.username : "Kullanıcı 2";

    const newRoom: any = {
      id: "room_dm_" + Math.random().toString(36).substring(2, 9),
      name: `${u1Name} & ${u2Name}`,
      description: "Özel Mesajlaşma",
      avatarEmoji: "💬",
      avatarBg: "bg-slate-700",
      createdBy: "system",
      createdAt: Date.now(),
      inviteCode: "DM_" + Math.random().toString(36).substring(2, 7).toUpperCase(),
      isDM: true,
      dmUserIds: [user1Id, user2Id]
    };

    db.rooms.push(newRoom);
    saveDb(db);
    res.json(newRoom);
  });

  // Post message
  app.post("/api/messages", (req, res) => {
    const {
      roomId,
      senderId,
      senderName,
      senderAvatarEmoji,
      senderAvatarBg,
      text,
      image,
      audio,
      audioDuration,
      replyTo
    } = req.body;

    if (!roomId || !senderId || (!text && !image && !audio)) {
      return res.status(400).json({ error: "Geçersiz mesaj içeriği." });
    }

    const db = loadDb();
    const user = db.users.find(u => u.id === senderId);
    
    const finalSenderName = user ? user.username : senderName;
    const finalSenderEmoji = user ? user.avatarEmoji : senderAvatarEmoji;
    const finalSenderBg = user ? user.avatarBg : senderAvatarBg;
    const senderAvatarUrl = user ? user.avatarUrl : undefined;

    const newMessage: Message = {
      id: "msg_" + Math.random().toString(36).substring(2, 9),
      roomId,
      senderId,
      senderName: finalSenderName,
      senderAvatarEmoji: finalSenderEmoji,
      senderAvatarBg: finalSenderBg,
      senderAvatarUrl,
      text: text || "",
      image,
      audio,
      audioDuration,
      timestamp: Date.now(),
      reactions: [],
      replyTo: replyTo || null
    };

    db.messages.push(newMessage);
    
    // Prevent unbounded memory growth, keep last 1000 messages total
    if (db.messages.length > 1000) {
      db.messages = db.messages.slice(-1000);
    }

    saveDb(db);
    res.json(newMessage);
  });

  // React to message
  app.post("/api/messages/react", (req, res) => {
    const { messageId, emoji, userId, username } = req.body;

    if (!messageId || !emoji || !userId || !username) {
      return res.status(400).json({ error: "Eksik parametre." });
    }

    const db = loadDb();
    const msg = db.messages.find(m => m.id === messageId);

    if (!msg) {
      return res.status(404).json({ error: "Mesaj bulunamadı." });
    }

    if (!msg.reactions) {
      msg.reactions = [];
    }

    const reactionIndex = msg.reactions.findIndex(r => r.emoji === emoji);
    if (reactionIndex > -1) {
      const userIndex = msg.reactions[reactionIndex].users.findIndex(u => u.id === userId);
      if (userIndex > -1) {
        // Toggle off if already reacted
        msg.reactions[reactionIndex].users.splice(userIndex, 1);
        // Remove reaction block if empty
        if (msg.reactions[reactionIndex].users.length === 0) {
          msg.reactions.splice(reactionIndex, 1);
        }
      } else {
        // Add user reaction
        msg.reactions[reactionIndex].users.push({ id: userId, username });
      }
    } else {
      // First reaction with this emoji
      msg.reactions.push({
        emoji,
        users: [{ id: userId, username }]
      });
    }

    saveDb(db);
    res.json(msg);
  });

  // Register endpoint
  app.post("/api/auth/register", (req, res) => {
    const { username, password, avatarEmoji, avatarBg } = req.body;
    const cleanUsername = username ? username.trim() : "";
    
    if (!cleanUsername || !password) {
      return res.status(400).json({ error: "Kullanıcı adı ve şifre gereklidir." });
    }
    
    if (cleanUsername.length < 2 || cleanUsername.length > 20) {
      return res.status(400).json({ error: "Kullanıcı adı 2 ile 20 karakter arasında olmalıdır." });
    }
    
    if (password.length < 4) {
      return res.status(400).json({ error: "Şifre en az 4 karakter olmalıdır." });
    }
    
    const db = loadDb();
    const existing = db.users.find(u => u.username.toLowerCase() === cleanUsername.toLowerCase());
    
    if (existing) {
      return res.status(400).json({ error: "Bu kullanıcı adı zaten alınmış." });
    }
    
    const newUser = {
      id: "u_" + Math.random().toString(36).substring(2, 9),
      username: cleanUsername,
      password, // in simple private group chat, plain representation is fully sufficient and easy to verify
      avatarEmoji: avatarEmoji || "😎",
      avatarBg: avatarBg || "bg-blue-500",
      joinedAt: Date.now(),
      status: "pending" as const
    };
    
    db.users.push(newUser);
    saveDb(db);
    
    // Return custom user object without password
    const { password: _, ...userSafe } = newUser;
    res.json({ user: userSafe });
  });

  // Login endpoint
  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;
    const cleanUsername = username ? username.trim() : "";
    
    if (!cleanUsername || !password) {
      return res.status(400).json({ error: "Kullanıcı adı ve şifre gereklidir." });
    }
    
    const db = loadDb();
    const user = db.users.find(u => u.username.toLowerCase() === cleanUsername.toLowerCase());
    
    if (!user || user.password !== password) {
      return res.status(401).json({ error: "Kullanıcı adı veya şifre hatalı." });
    }
    
    const { password: _, ...userSafe } = user;
    res.json({ user: userSafe });
  });

  // Update profile endpoint
  app.post("/api/auth/update", (req, res) => {
    const { id, username, avatarEmoji, avatarBg, avatarUrl, bio, statusText } = req.body;
    const cleanUsername = username ? username.trim() : "";
    
    if (!id || !cleanUsername) {
      return res.status(400).json({ error: "Kullanıcı adı ve kimliği gereklidir." });
    }
    
    const db = loadDb();
    
    // Check if new username belongs to someone else
    const existing = db.users.find(u => u.username.toLowerCase() === cleanUsername.toLowerCase() && u.id !== id);
    if (existing) {
      return res.status(400).json({ error: "Kullanıcı adı saten başka bir kullanıcı tarafından kullanılıyor." });
    }
    
    // Update both registered user profile or append registration record if somehow guest did it
    const userIndex = db.users.findIndex(u => u.id === id);
    if (userIndex > -1) {
      db.users[userIndex].username = cleanUsername;
      db.users[userIndex].avatarEmoji = avatarEmoji;
      db.users[userIndex].avatarBg = avatarBg;
      db.users[userIndex].avatarUrl = avatarUrl;
      db.users[userIndex].bio = bio;
      db.users[userIndex].statusText = statusText;
      saveDb(db);
      const { password: _, ...userSafe } = db.users[userIndex];
      return res.json({ user: userSafe });
    } else {
      // Allow profile edits for users initialized before
      const userSafe = {
        id,
        username: cleanUsername,
        avatarEmoji,
        avatarBg,
        avatarUrl,
        bio,
        statusText,
        joinedAt: Date.now()
      };
      return res.json({ user: userSafe });
    }
  });

  // --- ADMINISTRATIVE ENDPOINTS ---

  // Middleware-like role check helper
  const verifyAdmin = (userId: string): boolean => {
    if (!userId) return false;
    const db = loadDb();
    const user = db.users.find(u => u.id === userId);
    return user && user.role === "admin";
  };

  // Delete message
  app.post("/api/admin/delete-message", (req, res) => {
    const { adminId, messageId } = req.body;
    if (!verifyAdmin(adminId)) {
      return res.status(403).json({ error: "Bu işlem için yetkiniz yok." });
    }

    const db = loadDb();
    const originalLength = db.messages.length;
    db.messages = db.messages.filter(m => m.id !== messageId);

    if (db.messages.length === originalLength) {
      return res.status(404).json({ error: "Mesaj bulunamadı." });
    }

    saveDb(db);
    res.json({ success: true, messageId });
  });

  // Delete room
  app.post("/api/admin/delete-room", (req, res) => {
    const { adminId, roomId } = req.body;
    if (!verifyAdmin(adminId)) {
      return res.status(403).json({ error: "Bu işlem için yetkiniz yok." });
    }

    if (roomId === "general") {
      return res.status(400).json({ error: "Genel Grup odası silinemez." });
    }

    const db = loadDb();
    db.rooms = db.rooms.filter(r => r.id !== roomId);
    // clean up messages of this room
    db.messages = db.messages.filter(m => m.roomId !== roomId);

    saveDb(db);
    res.json({ success: true, roomId });
  });

  // Get users database (excluding passwords)
  app.post("/api/admin/users", (req, res) => {
    const { adminId } = req.body;
    if (!verifyAdmin(adminId)) {
      return res.status(403).json({ error: "Bu işlem için yetkiniz yok." });
    }

    const db = loadDb();
    const safeUsers = db.users.map(({ password, ...user }) => user);
    res.json({ users: safeUsers });
  });

  // Ban/Delete user
  app.post("/api/admin/ban-user", (req, res) => {
    const { adminId, targetUserId } = req.body;
    if (!verifyAdmin(adminId)) {
      return res.status(403).json({ error: "Bu işlem için yetkiniz yok." });
    }

    if (targetUserId === "admin_ard") {
      return res.status(400).json({ error: "Ana kurucu yönetici banlanamaz!" });
    }

    const db = loadDb();
    const originalLength = db.users.length;
    db.users = db.users.filter(u => u.id !== targetUserId);

    if (db.users.length === originalLength) {
      return res.status(404).json({ error: "Kullanıcı bulunamadı." });
    }

    // Optional: clear banned user's messages as well
    db.messages = db.messages.filter(m => m.senderId !== targetUserId);

    saveDb(db);
    res.json({ success: true, targetUserId });
  });

  // Set user status (Approve / Reject)
  app.post("/api/admin/set-user-status", (req, res) => {
    const { adminId, targetUserId, status } = req.body; // status: 'approved' | 'rejected' | 'pending'
    if (!verifyAdmin(adminId)) {
      return res.status(403).json({ error: "Bu işlem için yetkiniz yok." });
    }

    if (targetUserId === "admin_ard") {
      return res.status(400).json({ error: "Ana kurucu yönetici durumu değiştirilemez." });
    }

    const db = loadDb();
    const user = db.users.find(u => u.id === targetUserId);
    if (!user) {
      return res.status(404).json({ error: "Kullanıcı bulunamadı." });
    }

    user.status = status;
    saveDb(db);
    res.json({ success: true, targetUserId, status });
  });

  // Get active registered public members list
  app.get("/api/users/members", (req, res) => {
    const db = loadDb();
    // Filter users who are not rejected (and not banned)
    const approvedUsers = db.users
      .filter(u => u.status !== "rejected")
      .map(({ password: _, ...userSafe }) => userSafe);
    res.json({ members: approvedUsers });
  });

  // --- VITE MIDDLEWARE CONFIGURATION ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
