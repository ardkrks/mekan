import React, { useState } from "react";
import { User } from "../types";
import { saveLocalUser, loginUser, registerUser } from "../utils/api";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, ArrowRight, Smartphone, Key, User as UserIcon, LogIn, UserPlus } from "lucide-react";

interface LoginProps {
  onLoginSuccess: (user: User) => void;
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

export default function LoginScreen({ onLoginSuccess }: LoginProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  
  // Fields
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  // Register avatar presets
  const [selectedEmoji, setSelectedEmoji] = useState(EMOJI_PRESETS[0]);
  const [selectedColor, setSelectedColor] = useState(COLOR_PRESETS[0]);
  
  // States
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = username.trim();
    if (!cleanName) {
      setError("Lütfen kullanıcı adınızı girin.");
      return;
    }
    if (!password) {
      setError("Lütfen şifrenizi girin.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (activeTab === "login") {
        // Log in
        const res = await loginUser({ username: cleanName, password });
        saveLocalUser(res.user);
        onLoginSuccess(res.user);
      } else {
        // Register
        if (cleanName.length < 2 || cleanName.length > 20) {
          setError("Kullanıcı adı 2 ile 20 karakter arasında olmalıdır.");
          setLoading(false);
          return;
        }
        if (password.length < 4) {
          setError("Şifreniz en az 4 karakter olmalıdır.");
          setLoading(false);
          return;
        }
        
        const res = await registerUser({
          username: cleanName,
          password,
          avatarEmoji: selectedEmoji,
          avatarBg: selectedColor
        });
        saveLocalUser(res.user);
        onLoginSuccess(res.user);
      }
    } catch (err: any) {
      setError(err.message || "Bir bağlantı hatası oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0d0f17] p-4 font-sans select-none relative overflow-hidden">
      {/* Decorative premium ambient glow behind container */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] bg-indigo-600/10 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[260px] h-[260px] bg-purple-600/8- rounded-full blur-[90px] pointer-events-none" />

      {/* Phone container wrapper to design specifically for iOS preview feel */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md bg-[#131726]/90 backdrop-blur-md border border-slate-800/80 rounded-[35px] shadow-2xl overflow-hidden p-6 relative flex flex-col justify-between z-10"
        style={{ minHeight: "680px" }}
      >
        <div className="absolute top-4 right-4 flex items-center gap-1 text-xs text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-full">
          <Smartphone size={13} className="text-indigo-400" />
          <span className="font-semibold">iOS Mobil Uyumu</span>
        </div>

        {/* Header Section */}
        <div className="text-center mt-6">
          <div className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full text-[10px] font-black tracking-wider uppercase mb-3">
            <Sparkles size={11} className="animate-pulse text-indigo-400" />
            <span>24/7 Çevrimiçi Şifreli</span>
          </div>
          <h1 id="welcome-title" className="text-3xl font-black bg-gradient-to-r from-indigo-100 via-purple-100 to-indigo-100 bg-clip-text text-transparent tracking-tight">
            Ardanın Mekanı
          </h1>
          <p className="text-xs text-slate-400 mt-2 max-w-xs mx-auto leading-relaxed">
            Arkadaşlarınızla kendi aranızda özgürce konuşabileceğiniz şifreli özel mekanınız.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="bg-[#1a1f33] p-1 rounded-2xl flex items-center mt-6 border border-slate-800/60 relative">
          <button
            type="button"
            onClick={() => {
              setActiveTab("login");
              setError("");
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer z-10 ${
              activeTab === "login" ? "bg-[#232943] text-slate-150 shadow-md shadow-black/20 border border-slate-700/30" : "text-slate-400"
            }`}
          >
            <LogIn size={14} />
            <span>Giriş Yap</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("register");
              setError("");
            }}
            className={`flex-1 py-1.2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer z-10 ${
              activeTab === "register" ? "bg-[#232943] text-slate-150 shadow-md shadow-black/20 border border-slate-700/30" : "text-slate-400"
            }`}
            style={{ paddingBlock: "10px" }}
          >
            <UserPlus size={14} />
            <span>Yeni Kayıt</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-center my-6 space-y-4">
          
          {/* Avatar Preview only for registrations */}
          <AnimatePresence mode="wait">
            {activeTab === "register" && (
              <motion.div 
                initial={{ opacity: 0, height: 0, scale: 0.8 }}
                animate={{ opacity: 1, height: "auto", scale: 1 }}
                exit={{ opacity: 0, height: 0, scale: 0.8 }}
                className="flex flex-col items-center mb-1 overflow-hidden"
              >
                <div 
                  className={`w-20 h-20 ${selectedColor} rounded-full flex items-center justify-center text-4xl shadow-lg border-4 border-[#131726] transition-all`}
                >
                  {selectedEmoji}
                </div>
                <span className="text-[10px] text-slate-450 mt-1.5 font-mono uppercase tracking-widest font-bold">Avatar Seçimi</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Emoji & Color pickers only when register mode is active */}
          <AnimatePresence>
            {activeTab === "register" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 overflow-hidden"
              >
                {/* Emoji list picker */}
                <div className="space-y-1">
                  <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none py-0.5 -mx-2 px-2">
                    {EMOJI_PRESETS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setSelectedEmoji(emoji)}
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-base transition-all ${
                          selectedEmoji === emoji 
                            ? "bg-indigo-600 scale-110 shadow-md text-white border border-indigo-400" 
                            : "bg-[#1d2238] hover:bg-[#232943] text-slate-200"
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color list picker */}
                <div className="space-y-1">
                  <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none py-0.5 -mx-2 px-2">
                    {COLOR_PRESETS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={`flex-shrink-0 w-6 h-6 rounded-full ${color} transition-all relative ${
                          selectedColor === color 
                            ? "ring-2 ring-offset-2 ring-offset-[#131726] ring-indigo-500 scale-110" 
                            : "opacity-80 hover:opacity-100"
                        }`}
                      >
                        {selectedColor === color && (
                          <span className="absolute inset-0 m-auto w-1.5 h-1.5 rounded-full bg-white"></span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form Fields Inputs */}
          <div className="space-y-3">
            
            {/* Username input */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                Kullanıcı Adı
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-slate-500">
                  <UserIcon size={16} />
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder={activeTab === "register" ? "Örn: arda_mekan" : "Kullanıcı adınız"}
                  className="w-full pl-11 pr-4 py-3 bg-[#1a1f33] border border-slate-800/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-transparent transition-all font-semibold text-sm"
                  maxLength={20}
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password input */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                Şifre
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-slate-500">
                  <Key size={16} />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder={activeTab === "register" ? "En az 4 karakter girin" : "Giriş şifreniz"}
                  className="w-full pl-11 pr-4 py-3 bg-[#1a1f33] border border-slate-800/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-transparent transition-all font-semibold text-sm"
                  autoComplete="current-password"
                />
              </div>
            </div>

          </div>

          {/* Error visualizer inside form */}
          {error && (
            <motion.p 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-rose-400 font-extrabold bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl text-center"
            >
              {error}
            </motion.p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/40 hover:shadow-indigo-900/30 transition-all cursor-pointer mt-4 border border-indigo-400/20 active:scale-[0.98]"
          >
            {loading ? (
              <span className="animate-pulse">Bağlanılıyor...</span>
            ) : activeTab === "login" ? (
              <>
                <span>Mekana Giriş Yap</span>
                <ArrowRight size={16} className="text-indigo-200" />
              </>
            ) : (
              <>
                <span>Hesabımı Oluştur ve Gir</span>
                <ArrowRight size={16} className="text-indigo-200" />
              </>
            )}
          </button>
        </form>

        {/* Footer info text */}
        <div className="text-center text-[10px] text-slate-400 mt-2 px-4 leading-relaxed font-medium">
          Şifreli kimlik sistemi sayesinde diğer katılımcılar sizin lakabınızı çalamaz. Kendi isminizle güvenle grup sohbetine kaydolun!
        </div>
      </motion.div>
    </div>
  );
}
