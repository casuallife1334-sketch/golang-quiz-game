import { useState, useRef, useEffect, useCallback } from "react";
import { socket } from "../socket/socket";
import { soundManager } from "../utils/soundManager";
import { getUserProfile } from "../userProfile";
import "../styles/chat.css";

// Функция для получения URL аватара игрока по playerId
function getPlayerAvatar(playerId, players) {
  if (!playerId || !players) return "";
  const player = players.find(p => p.id === playerId);
  return player?.avatar || "";
}

// Функция для получения имени игрока
function getPlayerName(playerId, players, fallbackName) {
  if (!playerId || !players) return fallbackName;
  const player = players.find(p => p.id === playerId);
  return player?.name || fallbackName;
}

export default function Chat({ roomId, host, players, scores }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [isNearBottom, setIsNearBottom] = useState(true);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const textareaRef = useRef(null);
  const historyRequestedRef = useRef(false);

  // Проверка, находится ли пользователь внизу контейнера
  const checkIfNearBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return true;
    const threshold = 50; // пикселей от низа
    return container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
  }, []);

  // Автоскролл только если пользователь внизу
  const scrollToBottom = useCallback((force = false) => {
    if (force || isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [isNearBottom]);

  // Отслеживание получения новых сообщений
  const prevMessagesLengthRef = useRef(0);

  useEffect(() => {
    setMessages([]);
    prevMessagesLengthRef.current = 0;
    historyRequestedRef.current = false;
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;

    const requestHistory = (force = false) => {
      if (historyRequestedRef.current && !force) return;
      historyRequestedRef.current = true;
      socket.emit("request-chat-history", { roomId });
    };

    const handleChatHistory = (payload) => {
      if (payload?.roomId && payload.roomId !== roomId) return;

      const history = Array.isArray(payload) ? payload : payload?.messages || [];
      setMessages((prev) => {
        const merged = [...prev];
        const existingIds = new Set(prev.map((message) => message.id));

        history.forEach((message) => {
          if (!existingIds.has(message.id)) {
            existingIds.add(message.id);
            merged.push(message);
          }
        });

        return merged.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      });
    };

    const handleConnect = () => requestHistory(true);
    const handleGameState = () => requestHistory();

    socket.on("chat-history", handleChatHistory);
    socket.on("connect", handleConnect);
    socket.on("game-state", handleGameState);
    requestHistory();

    return () => {
      socket.off("chat-history", handleChatHistory);
      socket.off("connect", handleConnect);
      socket.off("game-state", handleGameState);
    };
  }, [roomId]);

  useEffect(() => {
    const handleChatMessage = (msg) => {
      setMessages((prev) => {
        // Проверяем, не дубликат ли это
        const isDuplicate = prev.some(m => m.id === msg.id);
        if (isDuplicate) return prev;
        return [...prev, msg];
      });
      // Воспроизводим звук при получении сообщения (не своего)
      if (msg.userId !== socket.id) {
        soundManager.playChatMessage();
      }
    };

    socket.on("chat-message", handleChatMessage);

    return () => {
      socket.off("chat-message", handleChatMessage);
    };
  }, []);

  // Автоскролл при добавлении новых сообщений
  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current && messages.length > 0) {
      scrollToBottom(true); // force scroll для новых сообщений
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages, scrollToBottom]);

  // Отслеживание скролла пользователя
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setIsNearBottom(checkIfNearBottom());
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [checkIfNearBottom]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    const scrollHeight = textarea.scrollHeight;
    textarea.style.height = `${Math.min(scrollHeight, 120)}px`;
  }, [text]);

  const sendMessage = () => {
    const trimmed = text.trim();
    if (!trimmed || !roomId) return;

    soundManager.playClick();

    const profile = getUserProfile();

    const message = {
      id: Date.now() + Math.random(),
      text: trimmed,
      roomId,
      userId: socket.id,
      username: profile?.name || `User${socket.id.slice(0, 6)}`,
      avatar: profile?.avatar || "",
      avatarColor: getAvatarColor(socket.id),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    socket.emit("chat-message", message);
    setText("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getAvatarColor = (id) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 70%, 60%)`;
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h3>Чат комнаты</h3>
      </div>

      <div className="chat-messages" ref={messagesContainerRef}>
        {messages.length === 0 && (
          <div className="empty-chat">
            <span>Сообщений пока нет</span>
            <small>Напишите первое!</small>
          </div>
        )}

        {messages.map((msg) => {
          const isOwn = msg.userId === socket.id;
          // Сначала ищем аватар в сообщении, потом в списке игроков
          const userAvatar = msg.avatar || getPlayerAvatar(msg.userId, players);
          const userName = msg.username || "User";
          const initials = getInitials(userName);

          return (
            <div key={msg.id} className={`message-wrapper ${isOwn ? "own" : "other"}`}>
              {!isOwn && (
                <div className="avatar" style={{ backgroundColor: userAvatar ? "transparent" : msg.avatarColor }}>
                  {userAvatar ? (
                    <img src={userAvatar} alt={userName} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                  ) : (
                    initials
                  )}
                </div>
              )}

              <div className="message-bubble">
                {!isOwn && <div className="message-username">{userName}</div>}
                <div className="message-content">{msg.text}</div>
                <div className="message-time">{msg.time}</div>
              </div>

              {isOwn && (
                <div className="avatar own-avatar" style={{ backgroundColor: userAvatar ? "transparent" : msg.avatarColor }}>
                  {userAvatar ? (
                    <img src={userAvatar} alt={userName} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                  ) : (
                    initials
                  )}
                </div>
              )}
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Напишите сообщение..."
          rows={1}
        />
        <button
          className="send-btn"
          onClick={sendMessage}
          disabled={!text.trim()}
          title="Отправить"
        >
          →
        </button>
      </div>
    </div>
  );
}
