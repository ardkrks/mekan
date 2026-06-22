import React, { useState, useEffect } from "react";
import { User, Room } from "../types";
import { 
  saveLocalUser, 
  removeLocalUser, 
  updateUserProfile, 
  adminFetchUsers, 
  adminBanUser, 
  adminDeleteRoom,
  adminSetUserStatus,
  compressImage
} from "../utils/api";
import { Smartphone, Sparkles, LogOut, Check, ArrowLeft, Trash2, ShieldAlert, Users, Crown, Shield, Camera } from "lucide-react";
import { motion } from "motion/react";
import ConfirmModal from "./ConfirmModal";

interface ProfileProps {
  currentUser: User;
  onUpdateUser: (user: User) => void;
  onBack: () => void;
  onLogout: () => void;
  onOpenPWAInstructions: () => void;
  rooms?: Room[];
  onRefreshRooms?: () => void;
}

const EMOJI_PRESETS = [
  "😎", "👨‍💻", "👩‍💻", "🦊", "🍕", "🚀", "🤖", "🦄", "🐼", 
  "👽", "🦁", "🦖", "🍟", "🐱", "🐶", "🥑", "🐙", "👻"
];

const COLOR_PRESETS = [
  "bg-blue-500", "bg-pink-500", "bg-indigo-500", "bg-emerald-500", 
  "bg-amber-500", "bg-rose-500", "bg-violet-500", "bg-teal-500", 
  "bg-orange-500", "bg-slate-700"
];

export default function ProfileSettings({
  currentUser,
  onUpdateUser,
  onBack,
  onLogout,
  onOpenPWAInstructions,
  rooms = [],
  onRefreshRooms,
}: ProfileProps) {
  const [username, setUsername] = useState(currentUser.username);
  const [selectedEmoji, setSelectedEmoji] = useState(currentUser.avatarEmoji);
  const [selectedColor, setSelectedColor] = useState(currentUser.avatarBg);
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl || "");
  const [bio, setBio] = useState(currentUser.bio || "");
  const [statusText, setStatusText] = useState(currentUser.statusText || "");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  // Admin states
  const [usersList, setUsersList] = useState<User[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminMsg, setAdminMsg] = useState("");

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    severity?: "error" | "warning" | "info" | "success";
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const loadAdminData = async () => {
    if (currentUser.role !== "admin") return;
    setAdminLoading(true);
    try {
      const u = await adminFetchUsers(currentUser.id);
      setUsersList(u);
    } catch (err) {
      console.error(err);
    } finally {
      setAdminLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [currentUser]);

  const handleBanUser = (targetId: string, name: string) => {
    setConfirmConfig({
      isOpen: true,
      title: "Kullanıcıyı Engelle",
      message: `"${name}" adlı kullanıcıyı engellemek ve sistemden tamamen silmek istediğinizden emin misiniz?`,
      confirmText: "Yasakla / Engelle",
      severity: "error",
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        try {
          await adminBanUser(currentUser.id, targetId);
          setAdminMsg("Kullanıcı başarıyla banlandı.");
          loadAdminData();
          if (onRefreshRooms) onRefreshRooms();
          setTimeout(() => setAdminMsg(""), 3000);
        } catch (err: any) {
          setAdminMsg(`Hata: ${err.message || "Kullanıcı engellenirken bir hata oluştu."}`);
          setTimeout(() => setAdminMsg(""), 4000);
        }
      }
    });
  };

  const handleDeleteRoom = (roomId: string, name: string) => {
    setConfirmConfig({
      isOpen: true,
      title: "Grubu Sil",
      message: `"${name}" odasını ve içerisindeki TÜM mesajları silmek istediğinizden emin misiniz?`,
      confirmText: "Grubu Kalıcı Olarak Sil",
      severity: "error",
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        try {
          await adminDeleteRoom(currentUser.id, roomId);
          setAdminMsg("Oda başarıyla silindi.");
          if (onRefreshRooms) onRefreshRooms();
          setTimeout(() => setAdminMsg(""), 3000);
        } catch (err: any) {
          setAdminMsg(`Hata: ${err.message || "Oda silinirken bir hata oluştu."}`);
          setTimeout(() => setAdminMsg(""), 4000);
        }
      }
    });
  };

  const handleSetUserStatus = (targetId: string, name: string, status: "approved" | "rejected") => {
    const actionText = status === "approved" ? "onaylamak" : "reddetmek";
    setConfirmConfig({
      isOpen: true,
      title: "Üye Onay İşlemi",
      message: `"${name}" adlı kullanıcının başvurusunu ${actionText} istediğinizden emin misiniz?`,
      confirmText: status === "approved" ? "Evet, Onayla" : "Evet, Reddet",
      severity: status === "approved" ? "success" : "warning",
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        try {
          await adminSetUserStatus(currentUser.id, targetId, status);
          setAdminMsg(`Kullanıcı başarıyla ${status === "approved" ? "onaylandı" : "reddedildi"}.`);
          loadAdminData();
          if (onRefreshRooms) onRefreshRooms();
          setTimeout(() => setAdminMsg(""), 3000);
        } catch (err: any) {
          setAdminMsg(`Hata: ${err.message || "İşlem yapılırken bir hata oluştu."}`);
          setTimeout(() => setAdminMsg(""), 4000);
        }
      }
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = username.trim();
    if (!cleanName) {
      setError("Nickname boş bırakılamaz.");
      return;
    }
    if (cleanName.length < 2 || cleanName.length > 20) {
      setError("Lakap 2 ile 20 karakter arasında olmalıdır.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await updateUserProfile({
        id: currentUser.id,
        username: cleanName,
        avatarEmoji: selectedEmoji,
        avatarBg: selectedColor,
        avatarUrl: avatarUrl || "",
        bio: bio || "",
        statusText: statusText || ""
      });

      saveLocalUser(res.user);
      onUpdateUser(res.user);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Güncelleme sırasında bir sunucu hatası oluştu.");
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64Img = await compressImage(file);
      setAvatarUrl(base64Img);
      setError("");
    } catch (err) {
      console.error("Fotoğraf yükleme hatası:", err);
      setError("Fotoğraf işlenirken bir sorun çıktı. Lütfen daha küçük bir görsel seçin.");
    }
  };

  const handleRemovePhoto = () => {
    setAvatarUrl("");
  };

  const handleClearCache = () => {
    setConfirmConfig({
      isOpen: true,
      title: "Cihaz Verilerini Sıfırla",
      message: "Uygulama çerezlerini sıfırlamak istiyor musunuz? Bu işlem sizi çıkışa yönlendirip yeniden kaydolmanızı gerektirecektir.",
      confirmText: "Evet, Verileri Sil",
      severity: "error",
      onConfirm: () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        removeLocalUser();
        onLogout();
      }
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#0d0f17] text-slate-100 font-sans">
      
      {/* Settings Navigation Header */}
      <div className="flex items-center justify-between px-4 py-4 bg-[#131726]/95 border-b border-slate-800/80 flex-shrink-0 sticky top-0 z-30 backdrop-blur-md">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-semibold text-15 outline-none cursor-pointer transition-colors"
        >
          <ArrowLeft size={18} />
          <span>Sohbetler</span>
        </button>
        <span className="font-extrabold text-slate-100 italic tracking-wide">Ayarlarım</span>
        <div className="w-8"></div>
      </div>

      {/* Main Content Pane */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        
        {/* Dynamic Avatar Builder in Header with upload overlay */}
        <div className="flex flex-col items-center py-5 bg-[#131726] border border-slate-800/80 rounded-3xl p-5 shadow-lg text-center relative overflow-hidden group">
          <div className="relative">
            <div className={`w-24 h-24 ${selectedColor} text-white rounded-full flex items-center justify-center text-4xl shadow-md border-4 border-[#131726] overflow-hidden relative`}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover select-none" referrerPolicy="no-referrer" />
              ) : (
                selectedEmoji
              )}
            </div>
            
            {/* Camera Overlay button trigger */}
            <label className="absolute bottom-0 right-0 w-8 h-8 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full flex items-center justify-center border-2 border-[#131726] cursor-pointer shadow-lg transition-colors">
              <Camera size={14} />
              <input 
                type="file" 
                accept="image/*" 
                onChange={handlePhotoUpload} 
                className="hidden" 
              />
            </label>
          </div>

          {avatarUrl && (
            <button
              type="button"
              onClick={handleRemovePhoto}
              className="mt-3 text-[10px] text-rose-450 hover:text-rose-400 font-bold bg-rose-500/10 hover:bg-rose-500/20 px-3 py-1 rounded-full transition-colors cursor-pointer border border-rose-500/15"
            >
              Fotoğrafı Kaldır
            </button>
          )}

          <h3 className="font-extrabold text-slate-100 text-base mt-2.5 leading-tight">{username || currentUser.username}</h3>
          
          {statusText ? (
            <span className="mt-1 px-3 py-1 bg-indigo-500/10 text-indigo-300 rounded-full text-[10px] font-black tracking-wide italic max-w-xs truncate border border-indigo-500/20">
              💬 "{statusText}"
            </span>
          ) : (
            <p className="text-[10px] text-slate-500 mt-1 uppercase font-mono tracking-wide font-bold">Üye ID: {currentUser.id}</p>
          )}

          {bio && (
            <p className="text-[11px] text-slate-400 mt-2 max-w-xs line-clamp-2 px-4 leading-relaxed font-medium italic">
               {bio}
            </p>
          )}
        </div>

        {/* Edit profile detail Form */}
        <form onSubmit={handleSave} className="space-y-4 bg-[#131726] border border-slate-800/80 rounded-3xl p-4 shadow-lg">
          <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1 px-1">PROFİL AYARLARI</div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-450 uppercase px-1">Lakabınız (Nickname)</label>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (error) setError("");
              }}
              className="w-full px-4 py-2.5 bg-[#161a2c] border border-slate-800/80 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              maxLength={20}
            />
            {error && <p className="text-xs text-rose-400 font-semibold">{error}</p>}
          </div>

          {/* Custom Picture Upload inside Form */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-450 uppercase px-1">Kişisel Profil Fotoğrafı</label>
            <div className="flex items-center gap-3 bg-[#161a2c] border border-slate-800/60 p-3 rounded-2xl">
              <div className={`w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center text-xl overflow-hidden ${selectedColor} text-white font-black`}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  selectedEmoji
                )}
              </div>
              <div className="flex-1">
                <p className="text-[9px] text-slate-400 font-bold leading-none tracking-widest">YÜKSEK ÇÖZÜNÜRLÜKLÜ GÖRSEL</p>
                <div className="flex gap-2 mt-2">
                  <label className="px-3 py-1.5 bg-[#232943] hover:bg-[#2b3353] rounded-lg text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1 select-none text-indigo-300">
                    <Camera size={10} />
                    <span>Fotoğraf Seç</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handlePhotoUpload} 
                      className="hidden" 
                    />
                  </label>
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-440 rounded-lg text-[10px] font-bold cursor-pointer transition-colors border border-rose-500/15"
                    >
                      Kaldır
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-450 uppercase px-1">Durum Mesajı</label>
            <input
              type="text"
              value={statusText}
              onChange={(e) => setStatusText(e.target.value)}
              placeholder="Örn: Kahve içiyor, Mekanda gıybet..."
              className="w-full px-4 py-2.5 bg-[#161a2c] border border-slate-800/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              maxLength={40}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-450 uppercase px-1">Hakkımda / Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Kendinizden kısaca bahsedin..."
              className="w-full px-4 py-2.5 bg-[#161a2c] border border-slate-800/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 min-h-16 resize-none"
              maxLength={150}
            />
          </div>

          {/* Preset Emojis choice */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-450 uppercase px-1">Avatar Emojisi</label>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {EMOJI_PRESETS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedEmoji(emoji)}
                  className={`flex-shrink-0 w-8 h-8 rounded-full text-base flex items-center justify-center transition-all cursor-pointer ${
                    selectedEmoji === emoji ? "bg-indigo-600 border border-indigo-400 text-white scale-115 shadow-sm" : "bg-[#161a2c] hover:bg-[#1f253e] text-slate-350"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Preset Colors choice */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-450 uppercase px-1">Profil Arka Planı</label>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {COLOR_PRESETS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`flex-shrink-0 w-6 h-6 rounded-full ${color} transition-all relative cursor-pointer ${
                    selectedColor === color ? "ring-2 ring-offset-1 ring-slate-800 scale-110" : "opacity-80"
                  }`}
                >
                  {selectedColor === color && (
                    <span className="absolute inset-0 m-auto w-1.5 h-1.5 bg-white rounded-full"></span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-98 shadow-sm"
          >
            {saving ? (
              <span>Kaydediliyor...</span>
            ) : success ? (
              <>
                <Check size={14} className="text-emerald-400" />
                <span>Değişiklikler Kaydedildi!</span>
              </>
            ) : (
              <span>Güncellemeyi Kaydet</span>
            )}
          </button>
        </form>

        {/* iPhone install guideline referral box */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-5 text-white shadow-lg space-y-3 relative overflow-hidden border border-indigo-400/15">
          <div className="absolute -top-5 -right-5 w-24 h-24 bg-indigo-500 rounded-full blur-xl opacity-40"></div>
          
          <div className="inline-flex w-10 h-10 bg-white/10 rounded-xl items-center justify-center">
            <Smartphone size={20} className="text-white" />
          </div>

          <div className="space-y-1 relative">
            <h4 className="font-extrabold text-sm tracking-tight">iPhone iOS Kurulum Kılavuzu</h4>
            <p className="text-[11px] text-indigo-100 leading-normal font-medium">
              Bu sohbet uygulamasını ana ekranına ekleyip tam ekran native bir iOS uygulaması gibi grupta konuşmaya başlayın!
            </p>
          </div>

          <button
            onClick={onOpenPWAInstructions}
            className="w-full py-2.5 bg-[#131726]/60 backdrop-blur-sm border border-white/20 text-white hover:bg-white/10 rounded-xl text-xs font-black transition-all shadow-sm cursor-pointer"
          >
            iOS Kurulum Adımlarını Gör
          </button>
        </div>

        {/* Technical Data maintenance sections */}
        <div className="bg-[#131726] border border-slate-800/80 rounded-3xl p-4 shadow-lg space-y-3">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">GÜVENLİK VE VERİ</div>
          
          <div className="flex items-center justify-between py-1 px-1">
            <div>
              <p className="text-xs font-bold text-slate-200 leading-none">Cihaz Kimliği Sıfırlama</p>
              <p className="text-[10px] text-slate-400 mt-1">Uygulama çerezlerini sıfırlayıp yeniden giriş yapın.</p>
            </div>
            <button
              onClick={handleClearCache}
              className="px-3 py-1.5 bg-rose-500/10 border border-rose-500/15 text-rose-455 hover:bg-rose-500/20 rounded-xl text-[10px] font-extrabold cursor-pointer transition-colors"
            >
              <Trash2 size={12} className="inline mr-1" />
              <span>Verileri Sil</span>
            </button>
          </div>
        </div>

        {/* Admin Dashboard section */}
        {currentUser.role === "admin" && (
          <div className="bg-[#131726] border-2 border-indigo-600 rounded-3xl p-5 shadow-lg space-y-4">
            <div className="flex items-center gap-1.5 pb-2 border-b border-slate-800/80">
              <Crown size={16} className="text-indigo-400 animate-pulse" />
              <div className="text-xs font-black text-slate-100 uppercase tracking-wider">KURUCU VE YÖNETİCİ PANELİ</div>
            </div>

            {adminMsg && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold p-2.5 rounded-xl text-center">
                {adminMsg}
              </div>
            )}

            {/* Room Management */}
            <div className="space-y-2">
              <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-1">Mekan Odalarını Yönet ({rooms.length})</h5>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {rooms.map((room) => {
                  const isGeneral = room.id === "general";
                  return (
                    <div key={room.id} className="flex items-center justify-between bg-[#161a2c] p-2.5 rounded-xl border border-slate-800/40 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm">{room.avatarEmoji}</span>
                        <div className="truncate min-w-0">
                          <p className="font-bold text-slate-200 truncate leading-none">{room.name}</p>
                          <p className="text-[9px] text-[#868fa9] mt-1 font-mono">Kod: {room.inviteCode}</p>
                        </div>
                      </div>
                      {!isGeneral ? (
                        <button
                          onClick={() => handleDeleteRoom(room.id, room.name)}
                          className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-455 rounded-lg text-[9px] font-bold cursor-pointer transition-colors border border-rose-500/15"
                        >
                          Grubu Sil
                        </button>
                      ) : (
                        <span className="text-[9px] text-[#868fa9] italic font-medium px-2">Sistem Odası</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* User Management sections */}
            <div className="space-y-4 pt-2 border-t border-slate-800/80">
              {adminLoading ? (
                <div className="text-center text-[10px] text-slate-400 py-2">Üye verileri yükleniyor...</div>
              ) : (
                <div className="space-y-4">
                  
                  {/* Category 1: Pending Approvals */}
                  <div className="space-y-1.5">
                    <h5 className="text-[10px] font-extrabold text-amber-500 uppercase tracking-wider flex items-center gap-1.5 px-1 animate-pulse">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
                      Onay Bekleyen Başvurular ({usersList.filter(u => u.status === "pending").length})
                    </h5>
                    
                    {usersList.filter(u => u.status === "pending").length === 0 ? (
                      <p className="text-[10px] italic text-slate-400 pl-3">Onay bekleyen başvuru bulunmuyor.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {usersList.filter(u => u.status === "pending").map((usr) => (
                          <div key={usr.id} className="flex flex-col gap-2 bg-amber-500/5 p-2.5 rounded-xl border border-amber-500/10 text-xs shadow-sm">
                            <div className="flex items-center gap-2 justify-between">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className={`w-6 h-6 rounded-full ${usr.avatarBg || "bg-slate-700"} flex items-center justify-center text-xs text-white overflow-hidden`}>
                                  {usr.avatarUrl ? (
                                    <img src={usr.avatarUrl} alt={usr.username} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  ) : (
                                    usr.avatarEmoji || "👤"
                                  )}
                                </span>
                                <div className="truncate min-w-0">
                                  <p className="font-bold text-slate-200 truncate leading-none">{usr.username}</p>
                                  <p className="text-[9px] text-[#868fa9] mt-1 font-mono">ID: {usr.id}</p>
                                </div>
                              </div>
                              <span className="bg-amber-500/10 text-amber-400 border border-amber-500/15 font-black text-[8px] px-1.5 py-0.5 rounded-full uppercase">Beklemede</span>
                            </div>
                            <div className="flex justify-end gap-1.5 border-t border-slate-800/80 pt-1.5">
                              <button
                                onClick={() => handleSetUserStatus(usr.id, usr.username, "rejected")}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[9px] font-bold cursor-pointer transition-colors"
                              >
                                Reddet
                              </button>
                              <button
                                onClick={() => handleSetUserStatus(usr.id, usr.username, "approved")}
                                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[9px] font-bold cursor-pointer transition-colors"
                              >
                                Onayla / Mekana Al
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Category 2: Approved Members */}
                  <div className="space-y-1.5 pt-1">
                    <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-1">
                      Onaylı Üyeler ({usersList.filter(u => u.status === "approved" || !u.status).length})
                    </h5>
                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                      {usersList.filter(u => u.status === "approved" || !u.status).map((usr) => {
                        const isSelf = usr.id === currentUser.id;
                        const isMainAdmin = usr.username === "ardkrks";
                        return (
                          <div key={usr.id} className="flex items-center justify-between bg-[#161a2c] p-2.5 rounded-xl border border-slate-800/30 text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`w-6 h-6 rounded-full ${usr.avatarBg || "bg-slate-700"} flex items-center justify-center text-xs text-white overflow-hidden`}>
                                {usr.avatarUrl ? (
                                  <img src={usr.avatarUrl} alt={usr.username} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  usr.avatarEmoji || "👤"
                                )}
                              </span>
                              <div className="truncate min-w-0">
                                <p className="font-bold text-slate-200 truncate leading-none flex items-center gap-1">
                                  {usr.username}
                                  {usr.role === "admin" && <Shield size={10} className="text-amber-500 fill-amber-500" />}
                                </p>
                                <p className="text-[9px] text-[#868fa9] mt-0.5 font-mono">ID: {usr.id}</p>
                              </div>
                            </div>
                            {!isSelf && !isMainAdmin ? (
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => handleSetUserStatus(usr.id, usr.username, "rejected")}
                                  className="px-2.5 py-1 bg-[#232943] hover:bg-[#2e3758] text-slate-300 rounded-lg text-[9px] font-bold cursor-pointer transition-colors"
                                  title="Onayı geri al ve reddet"
                                >
                                  Askıya Al
                                </button>
                                <button
                                  onClick={() => handleBanUser(usr.id, usr.username)}
                                  className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-455 rounded-lg text-[9px] font-bold cursor-pointer transition-colors border border-rose-500/15"
                                >
                                  Engelle / Ban
                                </button>
                              </div>
                            ) : (
                              <span className="text-[9px] text-amber-500 font-extrabold flex items-center gap-0.5 uppercase tracking-wider">
                                <Crown size={10} className="text-amber-500" />
                                Kurucu
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Category 3: Rejected / Blocked Applications */}
                  <div className="space-y-1.5 pt-1">
                    <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-1">
                      Reddedilen Başvurular ({usersList.filter(u => u.status === "rejected").length})
                    </h5>
                    
                    {usersList.filter(u => u.status === "rejected").length === 0 ? (
                      <p className="text-[10px] italic text-slate-400 pl-3">Reddedilen başvuru bulunmuyor.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {usersList.filter(u => u.status === "rejected").map((usr) => (
                          <div key={usr.id} className="flex items-center justify-between bg-rose-500/5 p-2.5 rounded-xl border border-rose-500/10 text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-6 h-6 rounded-full bg-slate-650 flex items-center justify-center text-xs text-white overflow-hidden">
                                {usr.avatarUrl ? (
                                  <img src={usr.avatarUrl} alt={usr.username} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  usr.avatarEmoji || "👤"
                                )}
                              </span>
                              <div className="truncate min-w-0">
                                <p className="font-bold text-slate-500 line-through truncate leading-none">{usr.username}</p>
                                <p className="text-[9px] text-slate-400 mt-0.5 font-mono">ID: {usr.id}</p>
                              </div>
                            </div>
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => handleSetUserStatus(usr.id, usr.username, "approved")}
                                className="px-2.5 py-1 bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-400 rounded-lg text-[9px] font-bold cursor-pointer transition-colors"
                              >
                                Onayla
                              </button>
                              <button
                                onClick={() => handleBanUser(usr.id, usr.username)}
                                className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-455 rounded-lg text-[9px] font-bold cursor-pointer transition-colors border border-rose-500/15"
                              >
                                Tamamen Sil
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>
          </div>
        )}

        {/* App stats credits */}
        <div className="text-center text-slate-400 space-y-1">
          <p className="text-[10px] font-bold">Ardanın Mekanı v1.4.2</p>
          <p className="text-[9px] leading-relaxed max-w-xs mx-auto">
            Geri bildirim ve sorularınız için sohbet ekranından sistem odalarını kullanabilir veya link paylaşımı ile gruptaki herkesle etkileşime girebilirsiniz.
          </p>
        </div>

      </div>

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        cancelText={confirmConfig.cancelText}
        severity={confirmConfig.severity}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
