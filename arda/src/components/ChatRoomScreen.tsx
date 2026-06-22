import React, { useState, useEffect, useRef } from "react";
import { User, Room, Message } from "../types";
import { postMessage, reactToMessage, compressImage, adminDeleteMessage, fetchMembers } from "../utils/api";
import { motion, AnimatePresence } from "motion/react";
import ConfirmModal from "./ConfirmModal";
import { 
  ArrowLeft, 
  Send, 
  Camera, 
  Mic, 
  Trash2, 
  CornerUpLeft, 
  Smile,
  X,
  Play,
  Pause,
  Copy,
  Users,
  Eye,
  Settings,
  XCircle,
  Share2
} from "lucide-react";

interface ChatRoomProps {
  currentUser: User;
  room: Room;
  messages: Message[];
  activeCount: number;
  onBack: () => void;
  onRefresh: () => void;
}

const TAPBACK_EMOJIS = ["❤️", "👍", "👎", "😂", "😮", "😢"];

export default function ChatRoomScreen({
  currentUser,
  room,
  messages,
  activeCount,
  onBack,
  onRefresh,
}: ChatRoomProps) {
  const [inputText, setInputText] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // Swipe/Reply state
  const [replyTarget, setReplyTarget] = useState<Message | null>(null);

  // Reaction menu open id
  const [activeReactionMenuId, setActiveReactionMenuId] = useState<string | null>(null);

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  
  const [copied, setCopied] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {}
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioElementsRef = useRef<{ [msgId: string]: HTMLAudioElement }>({});

  const feedEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load members dynamically to resolve partner user profile in DM
  const [members, setMembers] = useState<User[]>([]);
  useEffect(() => {
    const loadMembers = async () => {
      try {
        const list = await fetchMembers();
        setMembers(list);
      } catch (err) {
        console.warn("Üyeler yüklenemedi:", err);
      }
    };
    loadMembers();
    const interval = setInterval(loadMembers, 8000);
    return () => clearInterval(interval);
  }, []);

  const otherUserId = room.isDM && room.dmUserIds ? room.dmUserIds.find(id => id !== currentUser.id) : null;
  const partnerUser = otherUserId ? members.find(m => m.id === otherUserId) : null;

  const roomName = partnerUser ? partnerUser.username : room.name;
  const roomAvatarEmoji = partnerUser ? (partnerUser.avatarUrl ? "" : partnerUser.avatarEmoji) : room.avatarEmoji;
  const roomAvatarBg = partnerUser ? partnerUser.avatarBg : room.avatarBg;
  const roomAvatarUrl = partnerUser ? partnerUser.avatarUrl : undefined;
  const roomDescription = room.isDM ? (partnerUser ? (partnerUser.statusText ? `💬 "${partnerUser.statusText}"` : "Özel Sohbet") : "Özel Sohbet") : room.description;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Audio Recording Time Counter
  useEffect(() => {
    if (isRecording) {
      recordingIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      setRecordingSeconds(0);
    }

    return () => {
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    };
  }, [isRecording]);

  // Handle image select
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64Img = await compressImage(file);
      setSelectedImage(base64Img);
    } catch (err) {
      alert("Görsel işlenirken hı bir sorun çıktı.");
    }
  };

  // Recording audio logic
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const blobUrl = URL.createObjectURL(audioBlob);
        setAudioBlobUrl(blobUrl);

        // Convert blob to Base64 to transfer via REST API safely
        const reader = new FileReader();
        reader.onloadend = () => {
          setAudioBase64(reader.result as string);
        };
        reader.readAsDataURL(audioBlob);

        // Turn off stream tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      alert("Mikrofon izni gerekebilir. Lütfen izinlerinizi kontrol edin.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    setAudioBlobUrl(null);
    setAudioBase64(null);
    setRecordingSeconds(0);
  };

  // Submit Text/Image/Audio Msg
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanText = inputText.trim();

    if (!cleanText && !selectedImage && !audioBase64) return;

    try {
      const payload: any = {
        roomId: room.id,
        senderId: currentUser.id,
        senderName: currentUser.username,
        senderAvatarEmoji: currentUser.avatarEmoji,
        senderAvatarBg: currentUser.avatarBg,
        text: cleanText || "",
      };

      if (selectedImage) {
        payload.image = selectedImage;
      }

      if (audioBase64) {
        payload.audio = audioBase64;
        payload.audioDuration = recordingSeconds || 3; // fallback duration estimate
      }

      if (replyTarget) {
        payload.replyTo = {
          id: replyTarget.id,
          senderName: replyTarget.senderName,
          text: replyTarget.text || "Fotoğraf/Ses",
        };
      }

      await postMessage(payload);

      // Reset states
      setInputText("");
      setSelectedImage(null);
      setAudioBlobUrl(null);
      setAudioBase64(null);
      setReplyTarget(null);
      onRefresh();
    } catch (err) {
      alert("Mesaj gönderilemedi, lütfen tekrar deneyin.");
    }
  };

  const handleToggleReaction = async (messageId: string, emoji: string) => {
    try {
      await reactToMessage({
        messageId,
        emoji,
        userId: currentUser.id,
        username: currentUser.username,
      });
      setActiveReactionMenuId(null);
      onRefresh();
    } catch {
      // ignore
    }
  };

  // Custom Audio player engine
  const togglePlayAudio = (msgId: string, audioUrlStr: string) => {
    if (playingAudioId === msgId) {
      const el = audioElementsRef.current[msgId];
      if (el) {
        el.pause();
        setPlayingAudioId(null);
      }
    } else {
      // Pause any previously playing audio first
      if (playingAudioId) {
        const oldEl = audioElementsRef.current[playingAudioId];
        if (oldEl) oldEl.pause();
      }

      let el = audioElementsRef.current[msgId];
      if (!el) {
        el = new Audio(audioUrlStr);
        el.onended = () => {
          setPlayingAudioId(null);
        };
        audioElementsRef.current[msgId] = el;
      }
      el.play();
      setPlayingAudioId(msgId);
    }
  };

  // Convert timestamp to beautiful dynamic human reading: 12:45, Dün 09:30, etc.
  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const hrs = d.getHours().toString().padStart(2, "0");
    const mins = d.getMinutes().toString().padStart(2, "0");
    return `${hrs}:${mins}`;
  };

  const handleDeleteMessage = (msgId: string) => {
    setConfirmConfig({
      isOpen: true,
      title: "Mesajı Sil",
      message: "Bu mesajı yönetici olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.",
      confirmText: "Evet, Sil",
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        try {
          const success = await adminDeleteMessage(currentUser.id, msgId);
          if (success) {
            onRefresh();
          } else {
            console.warn("Mesaj silinemedi.");
          }
        } catch (err) {
          console.error("Mesaj silinirken bir hata oluştu:", err);
        }
      }
    });
  };

  const copyCode = () => {
    navigator.clipboard.writeText(room.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="flex flex-col h-full bg-[#0d0f17] text-slate-100 font-sans relative overflow-hidden select-none">
      
      {/* iOS elegant Blurred Navigation Bar */}
      <div className="bg-[#0f1220]/95 backdrop-blur-md px-4 py-3.5 border-b border-slate-800/80 flex items-center justify-between sticky top-0 z-30 flex-shrink-0 shadow-sm">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button
            onClick={onBack}
            className="w-10 h-10 -ml-1 text-indigo-400 hover:bg-[#1a1f33] rounded-full flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
          >
            <ArrowLeft size={22} className="stroke-[2.5]" />
          </button>

          <div className="flex items-center gap-2.5 min-w-0 pr-1.5 cursor-pointer" onClick={copyCode}>
            <div className={`w-10 h-10 ${roomAvatarBg} text-white rounded-xl flex items-center justify-center text-lg font-bold shadow-inner flex-shrink-0 overflow-hidden`}>
              {roomAvatarUrl ? (
                <img src={roomAvatarUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                roomAvatarEmoji || "👤"
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="font-bold text-slate-100 text-sm truncate max-w-[140px] leading-tight">
                  {roomName}
                </h2>
                <span className="inline-flex items-center gap-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-full text-[9px] font-bold">
                  <span className="w-1 h-1 bg-emerald-500 rounded-full animate-ping"></span>
                  <span>{activeCount} Aktif</span>
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate leading-relaxed">
                {roomDescription}
              </p>
            </div>
          </div>
        </div>

        {/* Right action controls */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={copyCode}
            className="py-1 px-2.5 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 text-indigo-300 text-[10px] font-extrabold rounded-lg flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
            title="Kodu kopyala ve paylaş"
          >
            <Share2 size={11} />
            <span>Kodu Paylaş</span>
          </button>
        </div>
      </div>

      {/* Messages Feed View */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-12 max-w-xs mx-auto">
            <span className="text-4xl animate-bounce">👋</span>
            <p className="text-xs font-bold text-slate-100 mt-3">Grupta henüz mesaj yok</p>
            <p className="text-[10px] text-slate-400 mt-1">
              İlk mesajı yazıp arkadaşlarınızı davet edin! Gruptakilerle sohbet etmek çok keyifli olacak.
            </p>
          </div>
        ) : (
          messages
            .filter((m) => m.roomId === room.id)
            .map((msg, index, filteredArr) => {
              const isMe = msg.senderId === currentUser.id;
              
              // Consecutive message verification: hide sender name/avatar if same sender within 2 minutes of preceding message
              const prevMsg = filteredArr[index - 1];
              const isConsecutive = 
                prevMsg && 
                prevMsg.senderId === msg.senderId && 
                msg.timestamp - prevMsg.timestamp < 120000;

              return (
                <div key={msg.id} className="flex flex-col">
                  {/* System/Alert Message type support */}
                  {msg.senderId === "system" ? (
                    <div className="flex justify-center my-2 select-text">
                      <div className="max-w-xs bg-[#1a1f33]/85 rounded-xl px-3 py-1.5 text-center shadow-sm border border-slate-800/60">
                        <p className="text-[10px] text-slate-400 leading-normal font-semibold">
                          {msg.text}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className={`flex w-full ${isMe ? "justify-end" : "justify-start"} items-end gap-2 my-0.5`}>
                      
                      {/* Received Message Avatar block */}
                      {!isMe && (
                        <div className="w-8 flex justify-center flex-shrink-0">
                          {!isConsecutive ? (
                            <div className={`w-8 h-8 rounded-full ${msg.senderAvatarBg} text-white flex items-center justify-center text-sm font-semibold shadow-inner border border-[#0d0f17] overflow-hidden`}>
                              {msg.senderAvatarUrl ? (
                                <img src={msg.senderAvatarUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                msg.senderAvatarEmoji
                              )}
                            </div>
                          ) : (
                            <div className="w-8"></div> // empty placeholder preserving spacing alignment
                          )}
                        </div>
                      )}

                      {/* Chat Bubbles column */}
                      <div className={`flex flex-col max-w-[70%] ${isMe ? "items-end" : "items-start"} relative`}>
                        {/* Sender Nickname Display */}
                        {!isMe && !isConsecutive && (
                          <span className="text-[10px] font-black text-slate-450 ml-1.5 mb-1 tracking-wide uppercase">
                            {msg.senderName}
                          </span>
                        )}

                        {/* Interactive Tapback Reactions display above the bubble */}
                        <div className="relative">
                          {/* Inner chat bubble wrapper */}
                          <div 
                            onDoubleClick={() => setActiveReactionMenuId(activeReactionMenuId === msg.id ? null : msg.id)}
                            className={`px-3.5 py-2.5 rounded-2xl relative select-text transition-all ${
                              isMe 
                                ? "bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-950/30" 
                                : "bg-[#1d2238]/90 text-slate-100 rounded-bl-none border border-slate-800/60 shadow-sm"
                            }`}
                          >
                            {/* Reply to reference snippet display inside the bubble */}
                            {msg.replyTo && (
                              <div className={`text-xs p-1.5 px-2 rounded-lg mb-2 flex items-center gap-1 max-w-full font-medium ${
                                isMe ? "bg-indigo-900/80 text-indigo-200" : "bg-[#131726] text-slate-400 border-l-2 border-indigo-500"
                              }`}>
                                <CornerUpLeft size={10} />
                                <span className="truncate">
                                  <strong>{msg.replyTo.senderName}:</strong> {msg.replyTo.text}
                                </span>
                              </div>
                            )}

                            {/* Attachted image display */}
                            {msg.image && (
                              <div className="mb-2 rounded-xl overflow-hidden max-w-full border shadow-sm border-slate-800/80 bg-black/40">
                                <img 
                                  src={msg.image} 
                                  alt="Görsel" 
                                  className="w-full h-auto max-h-48 object-cover cursor-pointer"
                                  onClick={() => {
                                    // simple popup review
                                    const w = window.open();
                                    if (w) w.document.write(`<img src="${msg.image}" style="max-width:100%; max-height:100vh; position:absolute; top:0; bottom:0; left:0; right:0; margin:auto;" />`);
                                  }}
                                />
                              </div>
                            )}

                            {/* Voice Clip widget support */}
                            {msg.audio && (
                              <div className="flex items-center gap-3 py-1 px-1 flex-shrink-0 min-w-[140px]">
                                <button
                                  onClick={() => togglePlayAudio(msg.id, msg.audio || "")}
                                  className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all ${
                                    isMe 
                                      ? "bg-white text-indigo-650 hover:scale-105" 
                                      : "bg-indigo-600 text-white hover:scale-105"
                                  }`}
                                >
                                  {playingAudioId === msg.id ? <Pause size={14} className="fill-current" /> : <Play size={14} className="fill-current ml-0.5" />}
                                </button>
                                
                                <div className="flex-1">
                                  {/* Beautiful voice record waves mock indicator */}
                                  <div className="flex gap-0.5 items-end h-6 pb-1">
                                    <span className={`w-0.5 h-2 rounded ${isMe ? "bg-indigo-300" : "bg-slate-500"} ${playingAudioId === msg.id ? "animate-pulse" : ""}`}></span>
                                    <span className={`w-0.5 h-4 rounded ${isMe ? "bg-indigo-100" : "bg-slate-450"} ${playingAudioId === msg.id ? "animate-bounce" : ""}`}></span>
                                    <span className={`w-0.5 h-3 rounded ${isMe ? "bg-indigo-300" : "bg-slate-500"} ${playingAudioId === msg.id ? "animate-pulse" : ""}`}></span>
                                    <span className={`w-0.5 h-5 rounded ${isMe ? "bg-white" : "bg-slate-350"} ${playingAudioId === msg.id ? "animate-bounce" : ""}`}></span>
                                    <span className={`w-0.5 h-1 rounded ${isMe ? "bg-indigo-400" : "bg-slate-600"}`}></span>
                                    <span className={`w-0.5 h-3 rounded ${isMe ? "bg-indigo-300" : "bg-slate-550"} ${playingAudioId === msg.id ? "animate-pulse" : ""}`}></span>
                                    <span className={`w-0.5 h-2 rounded ${isMe ? "bg-indigo-400" : "bg-slate-600"}`}></span>
                                  </div>
                                  <p className={`text-[9px] font-bold ${isMe ? "text-indigo-200" : "text-slate-400"} mt-0.5`}>
                                    {msg.audioDuration ? `${msg.audioDuration} sn saniye` : "Ses Kaydı"}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Message Core Text description */}
                            {msg.text && (
                              <p className="text-[14px] leading-relaxed break-words font-medium">
                                {msg.text}
                              </p>
                            )}

                            {/* Timestamp indicator */}
                            <p className={`text-[8px] font-bold mt-1 text-right select-none ${
                              isMe ? "text-indigo-200/90" : "text-slate-450"
                            }`}>
                              {formatTime(msg.timestamp)}
                            </p>
                          </div>

                          {/* Reactions listing overlay inside bubbles */}
                          {msg.reactions && msg.reactions.length > 0 && (
                            <div className="absolute -bottom-2 right-2 flex gap-0.5 bg-[#181d32] border border-slate-800 shadow-md py-0.5 px-1.5 rounded-full z-10 scale-95 select-none">
                              {msg.reactions.map((r) => (
                                <button
                                  key={r.emoji}
                                  onClick={() => handleToggleReaction(msg.id, r.emoji)}
                                  className="text-[11px] hover:scale-125 transition-transform flex items-center gap-0.5 cursor-pointer"
                                  title={r.users.map((u) => u.username).join(", ")}
                                >
                                  <span>{r.emoji}</span>
                                  {r.users.length > 1 && (
                                    <span className="text-[8px] text-slate-400 font-bold">{r.users.length}</span>
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Slide actions helper tab */}
                        <div className="flex gap-2.5 mt-1 select-none pr-1">
                          <button
                            onClick={() => setReplyTarget(msg)}
                            className="text-[9px] font-bold text-slate-400 hover:text-indigo-400 transition-colors flex items-center gap-0.5"
                          >
                            <CornerUpLeft size={10} />
                            <span>Cevapla</span>
                          </button>
                          <button
                            onClick={() => setActiveReactionMenuId(activeReactionMenuId === msg.id ? null : msg.id)}
                            className="text-[9px] font-bold text-slate-400 hover:text-amber-500 transition-colors flex items-center gap-0.5"
                          >
                            <Smile size={10} />
                            <span>Tepki</span>
                          </button>
                          {currentUser.role === "admin" && (
                            <button
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="text-[9px] font-bold text-rose-450 hover:text-rose-400 transition-colors flex items-center gap-0.5 ml-1 cursor-pointer"
                            >
                              <Trash2 size={10} />
                              <span>Sil (Admin)</span>
                            </button>
                          )}
                        </div>

                        {/* Tapback Interactive Overlay Panel widget */}
                        <AnimatePresence>
                          {activeReactionMenuId === msg.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8, y: 10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.8, y: 10 }}
                              className={`absolute -top-12 ${isMe ? "right-0" : "left-0"} bg-[#131726] shadow-2xl border border-slate-800/80 rounded-full px-2 py-1.5 flex gap-1.5 z-40`}
                            >
                              {TAPBACK_EMOJIS.map((emoji) => {
                                const hasReacted = msg.reactions?.some(
                                  (r) => r.emoji === emoji && r.users.some((u) => u.id === currentUser.id)
                                );
                                return (
                                  <button
                                    key={emoji}
                                    onClick={() => handleToggleReaction(msg.id, emoji)}
                                    className={`w-7 h-7 text-base rounded-full flex items-center justify-center hover:scale-135 transition-all cursor-pointer ${
                                      hasReacted ? "bg-amber-500/20 text-amber-500 scale-110" : "hover:bg-[#1a1f33] text-slate-200"
                                    }`}
                                  >
                                    {emoji}
                                  </button>
                                );
                              })}
                              
                              <button
                                onClick={() => setActiveReactionMenuId(null)}
                                className="w-7 h-7 text-slate-450 hover:bg-[#1a1f33] hover:text-rose-400 rounded-full flex items-center justify-center text-xs transition-colors cursor-pointer ml-1"
                              >
                                <X size={12} />
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
        )}
        <div ref={feedEndRef} />
      </div>

      {/* Interactive Bottom Control Toolbar / Input section */}
      <div className="bg-[#0f1220] border-t border-slate-800/80 p-3.5 pb-4 sticky bottom-0 z-20 flex-shrink-0 flex flex-col gap-2">
        
        {/* Reply Context Bar */}
        {replyTarget && (
          <div className="bg-[#131726] px-3 py-2 border-l-4 border-indigo-505 rounded-xl flex items-center justify-between text-xs font-semibold relative animate-fade-in select-none">
            <div className="min-w-0 flex-1">
              <span className="text-[10px] text-indigo-400 uppercase font-bold tracking-wider">Cevaplanıyor</span>
              <p className="text-slate-300 truncate mt-0.5 font-normal">
                <strong>{replyTarget.senderName}:</strong> {replyTarget.text || "Görsel / Ses"}
              </p>
            </div>
            <button
              onClick={() => setReplyTarget(null)}
              className="w-5 h-5 text-slate-400 hover:text-slate-200 rounded-full flex items-center justify-center cursor-pointer ml-2"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Selected Image Review Preview */}
        {selectedImage && (
          <div className="bg-[#131726] border border-slate-800/80 p-2 rounded-xl flex items-center gap-3 relative select-none">
            <div className="w-14 h-14 rounded-lg overflow-hidden border border-slate-800 bg-black/50">
              <img src={selectedImage} alt="Görsel Seçimi" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-100">Seçilen Fotoğraf</p>
              <p className="text-[10px] text-slate-450 mt-0.5">Yüklenmeye hazır durumda.</p>
            </div>
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-2 right-2 w-6 h-6 bg-[#1e233d]/80 hover:bg-rose-500/20 hover:text-rose-450 rounded-full flex items-center justify-center text-slate-405 cursor-pointer border border-slate-800"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Audio Recording preview control bar */}
        {audioBlobUrl && (
          <div className="bg-[#131726]/90 border border-slate-800/80 p-2.5 rounded-xl flex items-center justify-between relative select-none">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-450 flex items-center justify-center border border-indigo-500/15">
                <Mic size={14} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-100">Ses Kaydı Hazır</p>
                <p className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold mt-0.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                  <span>{recordingSeconds} saniye uzunluğunda</span>
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={cancelRecording}
                className="p-1.5 bg-[#1d2238] hover:bg-rose-500/20 hover:text-rose-400 rounded-lg text-slate-400 cursor-pointer flex items-center gap-1 text-[10px] font-bold border border-slate-800"
              >
                <Trash2 size={12} />
                <span>Sil</span>
              </button>
            </div>
          </div>
        )}

        {/* Input box row */}
        <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
          
          {/* File Camera button triggers file dialog on-the-fly */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-10 h-10 bg-[#1d2238] hover:bg-[#252b48] text-[#a5b4fc] rounded-full flex items-center justify-center cursor-pointer flex-shrink-0 transition-all active:scale-95 border border-slate-800/30"
            title="Fotoğraf Ekle"
          >
            <Camera size={20} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            accept="image/*"
            className="hidden"
          />

          {/* Core TextArea / Rich recording panel */}
          {isRecording ? (
            <div className="flex-1 h-10 bg-rose-500/10 border border-rose-500/20 rounded-full px-4 flex items-center justify-between animate-pulse">
              <div className="flex items-center gap-2 text-rose-400">
                <span className="w-2 h-2 bg-rose-500 rounded-full animate-ping"></span>
                <span className="text-xs font-bold font-mono">Ses Kaydediliyor... {recordingSeconds}s</span>
              </div>
              <button
                type="button"
                onClick={stopRecording}
                className="px-3 py-1 bg-rose-500 hover:bg-rose-600 text-white rounded-full text-[10px] font-bold cursor-pointer"
              >
                Durdur
              </button>
            </div>
          ) : (
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Mesajınızı yazın..."
              className="flex-1 px-4 h-10 bg-[#131726]/70 border border-slate-800/80 rounded-full text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              maxLength={400}
            />
          )}

          {/* Mic / Send toggle buttons */}
          {(!inputText && !selectedImage && !audioBase64) ? (
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all active:scale-95 flex-shrink-0 border border-slate-800/30 ${
                isRecording 
                  ? "bg-rose-500 text-white hover:bg-rose-600 font-extrabold rotate-12" 
                  : "bg-[#1d2238] hover:bg-[#252b48] text-[#a5b4fc]"
              }`}
            >
              <Mic size={20} />
            </button>
          ) : (
            <button
              type="submit"
              className="w-10 h-10 bg-indigo-650 hover:bg-indigo-600 text-white rounded-full flex items-center justify-center cursor-pointer flex-shrink-0 shadow-md shadow-indigo-950/20 transition-all hover:scale-105 active:scale-95 border border-indigo-500/10"
            >
              <Send size={18} className="ml-0.5" />
            </button>
          )}
        </form>
      </div>

      {/* Copy notification top banner toast */}
      <AnimatePresence>
        {copied && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            style={{ x: "-50%" }}
            className="absolute top-16 left-1/2 z-50 bg-[#0f1220]/95 text-slate-100 border border-slate-800 rounded-full px-5 py-2 text-xs font-black leading-none tracking-wide shadow-2xl flex items-center gap-1.5 select-none"
          >
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
            <span>Grup Davet Kodu Kopyalandı!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Confirm deletion modal */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
