import React from "react";
import { User } from "../types";
import { motion } from "motion/react";
import { Clock, ShieldCheck, LogOut, RefreshCw, XCircle, Sparkles } from "lucide-react";

interface ApprovalPendingProps {
  currentUser: User;
  onLogout: () => void;
  onRefresh: () => void;
}

export default function ApprovalPendingScreen({ currentUser, onLogout, onRefresh }: ApprovalPendingProps) {
  const isRejected = currentUser.status === "rejected";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0d0f17] p-4 font-sans select-none relative overflow-hidden">
      {/* Decorative premium ambient glow behind container */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] bg-indigo-600/10 rounded-full blur-[110px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md bg-[#131726]/90 backdrop-blur-md border border-slate-800/80 rounded-[35px] shadow-2xl p-6 relative flex flex-col justify-between z-10"
        style={{ minHeight: "640px" }}
      >
        {/* Status Indicator Bar */}
        <div className="flex justify-between items-center bg-[#1a1f33] border border-slate-850 rounded-2xl p-3 mb-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isRejected ? "bg-rose-500 animate-pulse" : "bg-amber-400 animate-pulse"}`} />
            <span className="text-xs font-black text-slate-300">
              {isRejected ? "Başvuru Reddedildi" : "Başvuru Değerlendiriliyor"}
            </span>
          </div>
          <button 
            onClick={onRefresh}
            className="p-1.5 hover:bg-[#232943] rounded-lg text-slate-400 transition-colors cursor-pointer"
            title="Durumu Güncelle"
          >
            <RefreshCw size={13} className="animate-spin-slow text-indigo-400" />
          </button>
        </div>

        {/* Hero Section */}
        <div className="flex-1 flex flex-col items-center justify-center text-center my-6 space-y-6">
          
          {/* Visual Badge Indicator */}
          <div className="relative">
            <div 
              className={`w-24 h-24 ${currentUser.avatarBg} rounded-full flex items-center justify-center text-5xl shadow-xl border-4 border-[#131726] relative z-10 overflow-hidden`}
            >
              {currentUser.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                currentUser.avatarEmoji
              )}
            </div>
            
            {/* Soft decorative badge underneath */}
            <div className="absolute -bottom-2 -right-2 bg-[#1a1f33] p-2 rounded-full shadow-md z-20 border border-slate-800 text-slate-200">
              {isRejected ? (
                <XCircle size={20} className="text-rose-500" />
              ) : (
                <Clock size={20} className="text-amber-500 animate-pulse" />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-black text-slate-100 tracking-tight">
              Merhaba, {currentUser.username}!
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Kayıt başvurunuz başarıyla sistem yöneticisine ulaştı.
            </p>
          </div>

          <div className="w-full bg-[#161a2c] border border-slate-800/85 rounded-2xl p-4 space-y-3">
            <div className="text-left text-xs space-y-2 text-slate-300">
              <div className="flex justify-between border-b border-dashed border-slate-800 pb-1.5">
                <span className="font-bold text-slate-400">Mekan Adı:</span>
                <span className="font-semibold text-slate-100">Ardanın Mekanı</span>
              </div>
              <div className="flex justify-between border-b border-dashed border-slate-800 pb-1.5">
                <span className="font-bold text-slate-400">Kullanıcı Kimliğiniz:</span>
                <span className="font-mono text-slate-100 truncate max-w-[120px]">{currentUser.id}</span>
              </div>
              <div className="flex justify-between pb-0.5">
                <span className="font-bold text-slate-400">Onay Durumu:</span>
                {isRejected ? (
                  <span className="font-black text-rose-450">Kabul Edilmedi</span>
                ) : (
                  <span className="font-black text-amber-400 flex items-center gap-1">
                    <Clock size={12} className="animate-spin" />
                    Onay Bekliyor
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-400 px-4 leading-relaxed max-w-sm font-medium">
            {isRejected ? (
              <span className="text-rose-400 font-semibold bg-rose-500/10 border border-rose-500/15 p-3 rounded-2xl block text-center">
                Üzgünüz, Arda tarafından yapılan başvuru incelemesinde kaydınız onaylanmadı veya askıya alındı. Farklı bir hesapla kaydolmak için aşağıdan çıkış yapabilirsiniz.
              </span>
            ) : (
              <span>
                Mekanın kapıları sadece onaylı dostlarımız için açılmaktadır. <strong className="text-indigo-300 font-bold">Yönetici Arda (ardkrks)</strong> başvurunu onayladığında, <strong className="text-indigo-400 font-bold">bu ekran kendiliğinden kapanacak</strong> ve direkt sohbete dahil olacaksın!
              </span>
            )}
          </div>

        </div>

        {/* Footer Actions */}
        <div className="space-y-3 mt-4">
          <button
            onClick={onRefresh}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 shadow-md shadow-indigo-950/40"
          >
            <RefreshCw size={14} className="animate-pulse text-indigo-200" />
            <span>Onay Durumunu Denetle / Güncelle</span>
          </button>

          <button
            onClick={onLogout}
            className="w-full py-3 px-4 bg-transparent border border-slate-800 hover:bg-[#1a1f33] text-slate-400 hover:text-slate-200 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
          >
            <LogOut size={14} />
            <span>Hesaptan Çıkış Yap</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
