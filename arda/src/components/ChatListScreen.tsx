import React, { useState, useEffect } from "react";
import { User, Room } from "../types";
import { createRoom, joinRoomByCode, fetchMembers, getOrCreateDMRoom } from "../utils/api";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, 
  Plus, 
  Hash, 
  Settings, 
  Users, 
  FileText, 
  LogOut, 
  Sparkles,
  Clipboard,
  Smartphone,
  X,
  Calendar,
  Crown,
  MessageSquare,
  RefreshCw
} from "lucide-react";

interface ChatListProps {
  currentUser: User;
  rooms: Room[];
  activeUsersCount: { [roomId: string]: number };
  onSelectRoom: (room: Room) => void;
  onOpenSettings: () => void;
  onLogout: () => void;
  onRefresh: () => void;
}

const EMOJI_OPTIONS = ["💬", "☕", "🍕", "🍔", "🎮", "⚽", "🍿", "🎉", "🔥", "❤️", "🚀", "🎸", "🎧", "🎬", "🍻"];
const BG_OPTIONS = [
  "bg-blue-500", "bg-emerald-500", "bg-indigo-500", "bg-pink-500", 
  "bg-rose-500", "bg-violet-500", "bg-amber-500", "bg-teal-500"
];

export default function ChatListScreen({
  currentUser,
  rooms,
  activeUsersCount,
  onSelectRoom,
  onOpenSettings,
  onLogout,
  onRefresh,
}: ChatListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  
  // Community members state
  const [members, setMembers] = useState<User[]>([]);
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");

  const loadMembers = async () => {
    try {
      const list = await fetchMembers();
      setMembers(list);
    } catch (err) {
      console.warn("Üyeler yüklenemedi:", err);
    }
  };

  useEffect(() => {
    loadMembers();
    const interval = setInterval(loadMembers, 8000);
    return () => clearInterval(interval);
  }, []);

  const [dmLoadingId, setDmLoadingId] = useState<string | null>(null);

  const handleStartDM = async (member: User) => {
    try {
      setDmLoadingId(member.id);
      const dmRoom = await getOrCreateDMRoom(currentUser.id, member.id);
      setIsMembersOpen(false);
      onSelectRoom(dmRoom);
    } catch (err: any) {
      console.error("Özel mesaj odası açılamadı:", err);
    } finally {
      setDmLoadingId(null);
    }
  };
  
  // Create Room Form State
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomDesc, setNewRoomDesc] = useState("");
  const [newEmoji, setNewEmoji] = useState("💬");
  const [newBg, setNewBg] = useState("bg-blue-500");
  const [createError, setCreateError] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  // Join Room Form State
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newRoomName.trim();
    if (!cleanName) {
      setCreateError("Grup adı girmelisiniz.");
      return;
    }
    setCreateLoading(true);
    setCreateError("");
    try {
      const room = await createRoom({
        name: cleanName,
        description: newRoomDesc.trim() || `${cleanName} sohbet grubu`,
        avatarEmoji: newEmoji,
        avatarBg: newBg,
        creatorId: currentUser.id,
      });
      setIsCreateOpen(false);
      setNewRoomName("");
      setNewRoomDesc("");
      onRefresh();
      onSelectRoom(room);
    } catch (err: any) {
      setCreateError(err.message || "Grup oluşturulurken bir hata oluştu.");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = joinCode.trim();
    if (!cleanCode) {
      setJoinError("Bir davet kodu veya Grup ID'si girin.");
      return;
    }
    setJoinLoading(true);
    setJoinError("");
    try {
      const room = await joinRoomByCode(cleanCode);
      setIsJoinOpen(false);
      setJoinCode("");
      onRefresh();
      onSelectRoom(room);
    } catch (err: any) {
      setJoinError(err.message || "Gruba katılamadı. Kod geçersiz olabilir.");
    } finally {
      setJoinLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const groupRooms = rooms.filter(room => !room.isDM);
  const dmRooms = rooms.filter(room => room.isDM && room.dmUserIds?.includes(currentUser.id));

  const filteredGroupRooms = groupRooms.filter(
    (room) =>
      room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.inviteCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDMRooms = dmRooms.filter((room) => {
    const otherUserId = room.dmUserIds?.find(id => id !== currentUser.id);
    const otherUser = members.find(m => m.id === otherUserId);
    const dispName = otherUser ? otherUser.username : room.name;
    const dispBio = otherUser ? (otherUser.bio || "") : "";
    const dispStatusText = otherUser ? (otherUser.statusText || "") : "";

    return (
      dispName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispBio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispStatusText.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const filteredMembers = members.filter(
    (member) =>
      member.username.toLowerCase().includes(memberSearch.toLowerCase()) ||
      (member.bio && member.bio.toLowerCase().includes(memberSearch.toLowerCase())) ||
      (member.statusText && member.statusText.toLowerCase().includes(memberSearch.toLowerCase()))
  );

  return (
    <div className="flex flex-col h-full bg-[#0d0f17] text-slate-100 font-sans relative overflow-hidden select-none">
      {/* iOS styled Header block with soft glass effect alignment */}
      <div className="bg-[#0f1220]/95 backdrop-blur-md px-4 pt-5 pb-4 border-b border-slate-800/80 sticky top-0 z-20 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenSettings}
              className={`w-10 h-10 ${currentUser.avatarBg} text-white rounded-full flex items-center justify-center text-lg shadow-sm font-semibold relative cursor-pointer border border-[#1e233d] overflow-hidden`}
            >
              {currentUser.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                currentUser.avatarEmoji
              )}
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#0d0f17] rounded-full z-10"></span>
            </button>
            <div>
              <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider leading-none">Hoş geldin</p>
              <h2 className="text-sm font-bold text-slate-100 truncate max-w-[150px] mt-1.5 leading-none">
                {currentUser.username}
              </h2>
            </div>
          </div>

          <h1 className="text-sm font-black bg-gradient-to-r from-indigo-200 to-purple-350 bg-clip-text text-transparent tracking-tight">Ardanın Mekanı</h1>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenSettings}
              className="w-9 h-9 bg-[#1d2238] hover:bg-[#252b48] text-[#a5b4fc] rounded-full flex items-center justify-center transition-colors cursor-pointer border border-slate-800/30"
              title="Ayarlar"
            >
              <Settings size={17} />
            </button>
            <button
              onClick={onLogout}
              className="w-9 h-9 bg-rose-500/10 hover:bg-rose-500/20 text-[#fb7185] rounded-full flex items-center justify-center transition-colors cursor-pointer animate-none border border-rose-500/10"
              title="Çıkış Yap"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>

        {/* Quick Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              setIsCreateOpen(true);
              setIsJoinOpen(false);
            }}
            className="flex-1 py-2.5 px-3 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-indigo-950/20 transition-all cursor-pointer border border-indigo-500/10"
          >
            <Plus size={15} />
            <span>Yeni Grup Kur</span>
          </button>
          <button
            onClick={() => {
              setIsJoinOpen(true);
              setIsCreateOpen(false);
            }}
            className="flex-1 py-2.5 px-3 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 text-indigo-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Hash size={14} />
            <span>Koda Katıl</span>
          </button>
        </div>
      </div>

      {/* Main List & Search */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {/* Search Input bar */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Grup ara (Örn: Genel, Hafta sonu...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-[#131726]/70 border border-slate-800/80 rounded-2xl text-sm placeholder-slate-500 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all font-medium"
          />
        </div>

        {/* Dynamic Modals Section */}
        {isCreateOpen && (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#131726]/95 p-4 rounded-2xl border border-slate-800/80 shadow-lg space-y-3 relative"
          >
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              <Plus size={16} className="text-indigo-400" />
              Yeni Grup Sohbeti Kur
            </h3>
            <form onSubmit={handleCreateRoom} className="space-y-3">
              <div>
                <input
                  type="text"
                  placeholder="Grup İsmi (Örn: Kadro, Sınıf...)"
                  value={newRoomName}
                  onChange={(e) => {
                    setNewRoomName(e.target.value);
                    if (createError) setCreateError("");
                  }}
                  className="w-full px-3 py-2 bg-[#161a2c] border border-slate-800/80 rounded-xl text-xs placeholder-slate-500 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  maxLength={25}
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Grup Açıklaması (Opsiyonel)"
                  value={newRoomDesc}
                  onChange={(e) => setNewRoomDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-[#161a2c] border border-slate-800/80 rounded-xl text-xs placeholder-slate-500 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  maxLength={60}
                />
              </div>

              {/* Emoji Options list */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setNewEmoji(emoji)}
                    className={`flex-shrink-0 w-8 h-8 rounded-full text-sm flex items-center justify-center transition-all ${
                      newEmoji === emoji ? "bg-indigo-600 border border-indigo-400 text-white scale-110 shadow-sm" : "bg-[#161a2c] hover:bg-[#232943] text-slate-350"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Color Options list */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
                {BG_OPTIONS.map((bg) => (
                  <button
                    key={bg}
                    type="button"
                    onClick={() => setNewBg(bg)}
                    className={`flex-shrink-0 w-6 h-6 rounded-full ${bg} transition-all relative ${
                      newBg === bg ? "ring-2 ring-offset-1 ring-[#131726] ring-indigo-500 scale-110" : "opacity-80"
                    }`}
                  >
                    {newBg === bg && (
                      <span className="absolute inset-0 m-auto w-1.5 h-1.5 rounded-full bg-white"></span>
                    )}
                  </button>
                ))}
              </div>

              {createError && (
                <p className="text-[11px] text-rose-400 font-medium px-0.5">{createError}</p>
              )}

              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:bg-[#1a1f33] rounded-lg cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-4 py-1.5 text-xs bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-lg cursor-pointer shadow-sm active:scale-98 transition-all"
                >
                  {createLoading ? "Kuruluyor..." : "Grubu Kur"}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {isJoinOpen && (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#131726]/95 p-4 rounded-2xl border border-slate-800/80 shadow-lg space-y-3 relative"
          >
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              <Hash size={16} className="text-indigo-400" />
              Davet Kodu ile Gruba Katıl
            </h3>
            <form onSubmit={handleJoinRoom} className="space-y-3">
              <div>
                <input
                  type="text"
                  placeholder="Davet Kodunu Girin (Örn: GENEL, PLAN1...)"
                  value={joinCode}
                  onChange={(e) => {
                    setJoinCode(e.target.value);
                    if (joinError) setJoinError("");
                  }}
                  className="w-full px-3 py-2 bg-[#161a2c] border border-slate-800/80 rounded-xl text-xs placeholder-slate-500 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 tracking-wider text-center font-bold"
                  maxLength={15}
                />
              </div>

              {joinError && (
                <p className="text-[11px] text-rose-400 font-medium px-0.5">{joinError}</p>
              )}

              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setIsJoinOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:bg-[#1a1f33] rounded-lg cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={joinLoading}
                  className="px-4 py-1.5 text-xs bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-lg cursor-pointer shadow-sm active:scale-98 transition-all"
                >
                  {joinLoading ? "Katılınıyor..." : "Gruba Katıl"}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Chat Rooms List mapping */}
        <div className="space-y-4">
          
          {/* Groups Section */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-black text-slate-450 uppercase tracking-widest">Grup Sohbet Odaları</span>
              <span className="text-[10px] text-slate-450 font-mono">Toplam {filteredGroupRooms.length} oda</span>
            </div>

            {filteredGroupRooms.length === 0 ? (
              <div className="text-center py-7 bg-[#131726]/80 border border-slate-800/80 rounded-3xl p-5">
                <Users size={24} className="text-slate-500 mx-auto mb-1.5" />
                <p className="text-xs font-semibold text-slate-100">Grup bulunamadı</p>
                <p className="text-[10px] text-slate-450 mt-1 max-w-xs mx-auto">
                  Yeni bir grup kurabilir veya davet koduyla katılabilirsiniz.
                </p>
              </div>
            ) : (
              filteredGroupRooms.map((room) => {
                const activeCount = activeUsersCount[room.id] || 0;
                return (
                  <div 
                    key={room.id}
                    onClick={() => onSelectRoom(room)}
                    className="group bg-[#131726]/80 border border-slate-800/60 rounded-2xl relative shadow-sm hover:bg-[#181d32] hover:border-slate-850 transition-all flex items-center justify-between p-3.5 cursor-pointer"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                      <div className={`w-11 h-11 ${room.avatarBg} text-white rounded-xl flex items-center justify-center text-lg shadow-inner font-semibold flex-shrink-0`}>
                        {room.avatarEmoji}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-slate-100 group-hover:text-indigo-400 transition-colors truncate text-xs leading-none">
                            {room.name}
                          </h4>
                          {activeCount > 1 && (
                            <span className="flex-shrink-0 inline-flex items-center gap-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-full text-[8px] font-bold">
                              <span className="w-1 h-1 bg-emerald-500 rounded-full animate-ping"></span>
                              <span>{activeCount} Aktif</span>
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 truncate mt-1.5 leading-normal">
                          {room.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(room.inviteCode);
                        }}
                        className="px-2 py-1 bg-[#232943] hover:bg-[#2e3758] text-slate-300 hover:text-slate-100 rounded-lg text-[9px] font-bold border border-slate-700/30 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                        title="Davet kodunu kopyala"
                      >
                        <Clipboard size={8} />
                        <span>{copiedCode === room.inviteCode ? "Kopyalandı!" : `Kod: ${room.inviteCode}`}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Direct Messages Section */}
          <div className="space-y-2.5 pt-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-black text-slate-450 uppercase tracking-widest">Özel Mesajlarım</span>
              <span className="text-[10px] text-slate-450 font-mono">Toplam {filteredDMRooms.length} sohbet</span>
            </div>

            {filteredDMRooms.length === 0 ? (
              <div className="text-center py-7 bg-[#131726]/40 border border-dashed border-slate-800/80 rounded-3xl p-5">
                <MessageSquare size={24} className="text-slate-500 mx-auto mb-1.5" />
                <p className="text-xs font-semibold text-slate-350">Henüz özel sohbet yok</p>
                <p className="text-[10px] text-slate-450 mt-1 max-w-xs mx-auto leading-relaxed">
                  Üye listesinden dilediğiniz bir kişiye tıklayarak hemen özel mesaj gönderebilirsiniz!
                </p>
              </div>
            ) : (
              filteredDMRooms.map((room) => {
                const otherUserId = room.dmUserIds?.find(id => id !== currentUser.id);
                const otherUser = members.find(m => m.id === otherUserId);
                
                const dispName = otherUser ? otherUser.username : room.name;
                const dispStatus = otherUser ? (otherUser.statusText ? `💬 "${otherUser.statusText}"` : "Özel Mesaj") : "Özel Mesaj";
                const dispAvatarEmoji = otherUser ? (otherUser.avatarUrl ? "" : otherUser.avatarEmoji) : room.avatarEmoji;
                const dispAvatarBg = otherUser ? otherUser.avatarBg : room.avatarBg;
                const dispAvatarUrl = otherUser ? otherUser.avatarUrl : undefined;

                const activeCount = activeUsersCount[room.id] || 0;

                return (
                  <div 
                    key={room.id}
                    onClick={() => onSelectRoom(room)}
                    className="group bg-[#131726]/80 border border-slate-800/60 rounded-2xl relative shadow-sm hover:bg-[#181d32] hover:border-slate-850 transition-all flex items-center justify-between p-3.5 cursor-pointer"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                      <div className={`w-11 h-11 ${dispAvatarBg} text-white rounded-xl flex items-center justify-center text-lg shadow-inner font-semibold flex-shrink-0 overflow-hidden relative`}>
                        {dispAvatarUrl ? (
                          <img src={dispAvatarUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          dispAvatarEmoji || "👤"
                        )}
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#131726] rounded-full z-10" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-slate-100 group-hover:text-indigo-400 transition-colors truncate text-xs leading-none">
                            {dispName}
                          </h4>
                          {activeCount > 1 && (
                            <span className="flex-shrink-0 inline-flex items-center gap-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-full text-[8px] font-bold">
                              <span className="w-1 h-1 bg-emerald-500 rounded-full animate-ping"></span>
                              <span>Aktif</span>
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-450 truncate mt-1.5 leading-normal italic">
                          {dispStatus}
                        </p>
                      </div>
                    </div>

                    <div className="flex-shrink-0 p-1.5 bg-indigo-500/10 group-hover:bg-indigo-500/20 text-indigo-400 rounded-lg text-xs font-semibold border border-indigo-500/15">
                      <MessageSquare size={13} />
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>
      </div>

      {/* Info Notice banner at bottom */}
      <div className="bg-gradient-to-r from-[#0d0f17] to-indigo-950/40 text-white p-3.5 border-t border-slate-800/60 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Smartphone size={16} className="text-indigo-400 animate-pulse flex-shrink-0" />
          <p className="text-[10px] text-slate-300 truncate leading-tight">
            iPhone'unuzda kullanmak ister misiniz? Ana ekrana ekleyin!
          </p>
        </div>
        <button
          onClick={onOpenSettings}
          className="text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-500 px-2.5 py-1.2 rounded-lg flex items-center gap-0.5 cursor-pointer flex-shrink-0 transition-colors"
        >
          <Sparkles size={10} />
          <span>Nasıl?</span>
        </button>
      </div>

      {/* Floating Members Bubble at Bottom Right (above bottom notice bar) */}
      <div className="absolute bottom-18 right-5 z-30">
        <motion.button
          onClick={() => {
            loadMembers();
            setIsMembersOpen(true);
          }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          className="w-14 h-14 bg-gradient-to-tr from-indigo-550 to-purple-650 hover:from-indigo-600 hover:to-purple-700 text-white rounded-full flex items-center justify-center shadow-xl cursor-pointer relative border-2 border-slate-800/80 group"
          title="Üyeler ve Profiller"
        >
          <Users size={24} className="group-hover:rotate-12 transition-transform duration-300" />
          
          {/* Members Count Badge */}
          {members.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white border-2 border-[#0d0f17] text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center shadow-sm">
              {members.length}
            </span>
          )}
        </motion.button>
      </div>

      {/* Members Directory Bottom Sheet / Overlay Modal */}
      <AnimatePresence>
        {isMembersOpen && (
          <>
            {/* Backdrop shadow filter */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMembersOpen(false)}
              className="absolute inset-0 bg-black/90 z-40 cursor-pointer"
            />

            {/* Bottom Sheet Drawer Panel */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 220 }}
              className="absolute bottom-0 left-0 right-0 max-h-[85%] bg-[#0f1220] rounded-t-[32px] border-t border-slate-800/80 shadow-2xl flex flex-col z-50 overflow-hidden"
            >
              {/* iOS style Top notch bar overlay */}
              <div className="flex justify-center py-2.5 bg-[#131726]/60 border-b border-slate-800/40 flex-shrink-0">
                <div className="w-12 h-1.5 bg-slate-700 rounded-full" />
              </div>

              {/* Title Header with Close control */}
              <div className="px-5 py-4 bg-[#131726] border-b border-slate-800/80 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/15">
                    <Users size={16} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-100 text-sm tracking-tight">Kayıtlı Tüm Üyeler</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Topluluk Dizini • {members.length} Üye</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsMembersOpen(false)}
                  className="w-8 h-8 bg-[#1d2238] hover:bg-[#252b48] text-slate-400 hover:text-slate-200 rounded-full flex items-center justify-center transition-colors cursor-pointer border border-slate-850"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Inline Directory Search Bar */}
              <div className="p-3.5 bg-[#131726]/80 border-b border-slate-800/60 flex-shrink-0">
                <div className="relative">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="İsim, hakkımda veya durum ile ara..."
                    className="w-full pl-9 pr-8 py-2 bg-[#1a1f33] border border-slate-800/80 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all font-medium"
                  />
                  {memberSearch && (
                    <button
                      onClick={() => setMemberSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-300 rounded-full"
                    >
                      <X size={10} />
                    </button>
                  )}
                </div>
              </div>

              {/* Scrollable Members Feed list */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0d0f17] min-h-0">
                {filteredMembers.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <p className="text-xs text-slate-400 font-bold">Aranan kriterlere uygun üye bulunamadı.</p>
                    <p className="text-[10px] text-slate-500 mt-1">Lütfen farklı kelimeler deneyin.</p>
                  </div>
                ) : (
                  filteredMembers.map((member) => {
                    const isAdmin = member.role === "admin" || member.id === "admin_ard";
                    const isMe = member.id === currentUser.id;
                    return (
                      <div
                        key={member.id}
                        onClick={() => handleStartDM(member)}
                        className="bg-[#131726]/80 border border-slate-800/60 p-3 rounded-2xl shadow-sm flex items-start gap-3 hover:border-indigo-500/30 hover:bg-[#181d32] transition-colors cursor-pointer active:scale-[0.99] relative group/card"
                      >
                        {/* Member Avatar */}
                        <div className={`w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center text-xl overflow-hidden ${member.avatarBg || "bg-indigo-500"} text-white font-bold shadow-inner relative`}>
                          {member.avatarUrl ? (
                            <img src={member.avatarUrl} alt={member.username} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            member.avatarEmoji || "👤"
                          )}
                          
                          {/* Mini online status dot preset */}
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#131726] rounded-full z-10" />
                        </div>

                        {/* Details Block */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-bold text-slate-100 text-xs truncate max-w-[130px]">
                              {member.username} {isMe && <span className="text-indigo-400 font-bold text-[10px] ml-0.5">(Sen)</span>}
                            </h4>

                            {/* Custom Badge tags */}
                            {isAdmin ? (
                              <span className="inline-flex items-center gap-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded-full text-[8px] font-black tracking-wide uppercase leading-none select-none">
                                <Crown size={7} />
                                <span>Kurucu</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center bg-[#1d2238] text-slate-400 px-1.5 py-0.5 rounded-full text-[8px] font-black tracking-wide uppercase leading-none select-none">
                                Üye
                              </span>
                            )}
                          </div>

                          {/* Member custom status line */}
                          {member.statusText && (
                            <p className="text-[10px] text-indigo-400 font-extrabold italic mt-1 leading-normal flex items-start gap-1">
                              <span className="flex-shrink-0">💬</span>
                              <span className="truncate">"{member.statusText}"</span>
                            </p>
                          )}

                          {/* Member bio description */}
                          {member.bio ? (
                            <p className="text-[10px] text-slate-400 bg-[#161a2c] border border-slate-800/40 p-1.5 rounded-lg mt-1.5 leading-relaxed font-semibold italic">
                              {member.bio}
                            </p>
                          ) : (
                            <p className="text-[9px] text-slate-500 mt-1 mt-1.5 leading-normal font-medium">Hakkında bilgisi eklenmemiş.</p>
                          )}

                          {/* Registry calendar details */}
                          <div className="flex items-center gap-1 text-[8px] text-slate-500 mt-2 font-mono uppercase font-black">
                            <Calendar size={8} />
                            <span>Kayıt: {new Date(member.joinedAt || Date.now()).toLocaleDateString("tr-TR")}</span>
                          </div>
                        </div>

                        {/* Direct Message Action Icon */}
                        <div className="self-center flex-shrink-0 ml-1">
                          <div className="w-8 h-8 rounded-full bg-[#1e233d]/80 group-hover/card:bg-indigo-600 text-slate-400 group-hover/card:text-white flex items-center justify-center transition-all duration-300 shadow-sm border border-slate-850">
                            {dmLoadingId === member.id ? (
                              <RefreshCw size={12} className="animate-spin text-indigo-500 group-hover/card:text-white" />
                            ) : (
                              <MessageSquare size={14} className="group-hover/card:scale-110 transition-transform" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
