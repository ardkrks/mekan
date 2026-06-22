/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { User, Room, Message } from "./types";
import { getLocalUser, syncState } from "./utils/api";
import LoginScreen from "./components/LoginScreen";
import ChatListScreen from "./components/ChatListScreen";
import ChatRoomScreen from "./components/ChatRoomScreen";
import ProfileSettings from "./components/ProfileSettings";
import PWAInstructions from "./components/PWAInstructions";
import ApprovalPendingScreen from "./components/ApprovalPendingScreen";
import { Smartphone, RefreshCw, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeUsersCount, setActiveUsersCount] = useState<{ [roomId: string]: number }>({});
  
  // Navigation states
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [activeScreen, setActiveScreen] = useState<"list" | "room" | "profile" | "pwa-instructions">("list");
  
  // Loader and Error notifications
  const [isLoading, setIsLoading] = useState(true);
  const [syncError, setSyncError] = useState("");
  const initialLoadRef = useRef(false);

  // Initialize and load local profile
  useEffect(() => {
    const user = getLocalUser();
    if (user) {
      setCurrentUser(user);
    }
    // Set first screen loading complete after user state check
    setIsLoading(false);
  }, []);

  // Sync state with server periodic updates (polling every 1.5s)
  const performSync = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      const response = await syncState(
        currentUser.id, 
        selectedRoom ? selectedRoom.id : undefined
      );

      setRooms(response.rooms);
      setMessages(response.messages);
      setActiveUsersCount(response.activeUsersCount);
      setSyncError("");

      // Reactive update for status and role changed by admin
      if (
        (response.userStatus && response.userStatus !== currentUser.status) || 
        (response.userRole && response.userRole !== currentUser.role)
      ) {
        const updatedUser: User = {
          ...currentUser,
          status: response.userStatus,
          role: response.userRole
        };
        setCurrentUser(updatedUser);
        localStorage.setItem("ichat_user_v1", JSON.stringify(updatedUser));
      }
    } catch (err) {
      console.warn("Sohbet senkronizasyonu aksadı:", err);
      setSyncError("Bağlantı hatası: Sunucu ile senkronizasyon yapılamıyor.");
    } finally {
      initialLoadRef.current = true;
    }
  }, [currentUser, selectedRoom]);

  // Handle auto polling
  useEffect(() => {
    if (!currentUser) return;

    // Direct initial poll
    performSync();

    // Trigger polling interval (1500 ms) for smooth real-time like chat
    const interval = setInterval(() => {
      performSync();
    }, 1500);

    return () => clearInterval(interval);
  }, [currentUser, performSync]);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setActiveScreen("list");
  };

  const handleUpdateUser = (updatedUser: User) => {
    setCurrentUser(updatedUser);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setSelectedRoom(null);
    setActiveScreen("list");
  };

  // Outer Wrapper for loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 font-sans select-none">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <RefreshCw className="w-10 h-10 text-blue-500 animate-spin" />
          <p className="text-sm font-bold text-slate-700">Ardanın Mekanı Yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Not logged in -> Show login
  if (!currentUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // Logged in but registration status is pending or rejected
  if (currentUser.status && currentUser.status !== "approved") {
    return (
      <ApprovalPendingScreen 
        currentUser={currentUser}
        onLogout={handleLogout}
        onRefresh={performSync}
      />
    );
  }

  // Render proper views
  return (
    <div className="flex justify-center min-h-screen bg-[#07080d] sm:bg-slate-950 p-0 sm:p-4 select-none">
      {/* Simulation Frame for desktop view to maintain mobile dimensions */}
      <div className="w-full max-w-md bg-[#0d0f17] sm:border sm:border-slate-800/80 sm:rounded-[40px] sm:shadow-[0_0_50px_rgba(99,102,241,0.15)] overflow-hidden flex flex-col relative sm:h-[820px] aspect-[9/19] sm:aspect-auto">
        
        {/* Connection Error Alert Indicator */}
        {syncError && (
          <div className="bg-amber-500/15 border-b border-amber-500/20 text-amber-400 text-[10px] py-2 px-3 flex items-center justify-center gap-1.5 font-bold z-50 absolute top-0 left-0 w-full shadow-md animate-fade-in select-none backdrop-blur-md">
            <AlertCircle size={12} className="animate-bounce" />
            <span>{syncError}</span>
          </div>
        )}

        {/* View Switches */}
        <AnimatePresence mode="wait">
          {activeScreen === "list" && (
            <motion.div
              key="list"
              initial={{ opacity: 0, x: -16, filter: "blur(4px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: -16, filter: "blur(4px)" }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1 flex flex-col h-full overflow-hidden"
            >
              <ChatListScreen
                currentUser={currentUser}
                rooms={rooms}
                activeUsersCount={activeUsersCount}
                onSelectRoom={(room) => {
                  setSelectedRoom(room);
                  setActiveScreen("room");
                }}
                onOpenSettings={() => setActiveScreen("profile")}
                onLogout={handleLogout}
                onRefresh={performSync}
              />
            </motion.div>
          )}

          {activeScreen === "room" && selectedRoom && (
            <motion.div
              key={`room-${selectedRoom.id}`}
              initial={{ opacity: 0, x: 24, filter: "blur(6px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: 24, filter: "blur(6px)" }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1 flex flex-col h-full overflow-hidden"
            >
              <ChatRoomScreen
                currentUser={currentUser}
                room={selectedRoom}
                messages={messages}
                activeCount={activeUsersCount[selectedRoom.id] || 0}
                onBack={() => {
                  setSelectedRoom(null);
                  setActiveScreen("list");
                }}
                onRefresh={performSync}
              />
            </motion.div>
          )}

          {activeScreen === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: 16, filter: "blur(4px)" }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1 flex flex-col h-full overflow-hidden"
            >
              <ProfileSettings
                currentUser={currentUser}
                onUpdateUser={handleUpdateUser}
                onBack={() => setActiveScreen("list")}
                onLogout={handleLogout}
                onOpenPWAInstructions={() => setActiveScreen("pwa-instructions")}
                rooms={rooms}
                onRefreshRooms={performSync}
              />
            </motion.div>
          )}

          {activeScreen === "pwa-instructions" && (
            <motion.div
              key="pwa"
              initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: 16, filter: "blur(4px)" }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1 flex flex-col h-full overflow-hidden"
            >
              <PWAInstructions
                onBack={() => setActiveScreen("profile")}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
