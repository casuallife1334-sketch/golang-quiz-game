import { useRef, useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { socket } from "../socket/socket";
import { getUserProfile, saveUserProfile } from "../userProfile";
import { User, Upload, ArrowLeft, Users } from "lucide-react";
import "../styles/join.css";

export default function Join() {
  const navigate = useNavigate();
  const { type } = useParams();
  const [searchParams] = useSearchParams();

  const isHost = type === "host";
  const roomFromUrl = searchParams.get("room") || "";
  const autoJoin = searchParams.get("auto") === "true";

  const initialProfile = getUserProfile();
  const [name, setName] = useState(initialProfile.name || "");
  const [avatar, setAvatar] = useState(initialProfile.avatar || "");
  const [room, setRoom] = useState(roomFromUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoJoining, setIsAutoJoining] = useState(autoJoin && !isHost);
  const [isDragOver, setIsDragOver] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const joinTimeoutRef = useRef(null);

  const clearJoinTimeout = () => {
    if (joinTimeoutRef.current) {
      clearTimeout(joinTimeoutRef.current);
      joinTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    if (autoJoin && !isHost && initialProfile.name && roomFromUrl) {
      handleAutoJoin();
    }
  }, []);

  useEffect(() => {
    const handleRoomCreated = (data) => {
      clearJoinTimeout();
      navigate(`/lobby/${data.roomId}`);
    };

    const handlePlayersUpdate = (data) => {
      // Навигация теперь происходит сразу после join()
      // Этот обработчик нужен для обновления состояния комнаты
      if (data.roomId && !window.location.pathname.includes('/lobby')) {
        clearJoinTimeout();
        navigate(`/lobby/${data.roomId}`);
      }
    };

    const handleErrorRoom = (data) => {
      clearJoinTimeout();
      alert("Комната не существует или уже закрыта");
      setIsLoading(false);
      setIsAutoJoining(false);
      setConnectionError(false);
    };

    const handleConnectError = (error) => {
      console.error('[Join] Socket connect error:', error);
      clearJoinTimeout();
      setConnectionError(true);
      setIsLoading(false);
      setIsAutoJoining(false);
    };

    const handleConnect = () => {
      console.log('[Join] Socket connected');
      setConnectionError(false);
    };

    socket.on("room-created", handleRoomCreated);
    socket.on("players-update", handlePlayersUpdate);
    socket.on("error-room", handleErrorRoom);
    socket.on("connect_error", handleConnectError);
    socket.on("connect", handleConnect);

    return () => {
      socket.off("room-created", handleRoomCreated);
      socket.off("players-update", handlePlayersUpdate);
      socket.off("error-room", handleErrorRoom);
      socket.off("connect_error", handleConnectError);
      socket.off("connect", handleConnect);
      clearJoinTimeout();
    };
  }, [navigate]);

  const handleAutoJoin = async () => {
    if (!roomFromUrl || !initialProfile?.name) {
      setIsAutoJoining(false);
      return;
    }

    setIsAutoJoining(true);
    setIsLoading(true);
    setConnectionError(false);

    // Timeout for auto-join
    clearJoinTimeout();
    joinTimeoutRef.current = setTimeout(() => {
      setIsAutoJoining(false);
      setIsLoading(false);
      setConnectionError(true);
      joinTimeoutRef.current = null;
    }, 15000);

    let finalAvatar = initialProfile.avatar;
    if (initialProfile.avatar && initialProfile.avatar.startsWith("data:image")) {
      finalAvatar = await compressAvatar(initialProfile.avatar);
    }

    socket.emit("join-room", {
      roomId: roomFromUrl.toUpperCase(),
      name: initialProfile.name,
      avatar: finalAvatar
    });
  };

  const compressAvatar = (dataUrl) => {
    return new Promise((resolve) => {
      if (!dataUrl || !dataUrl.startsWith("data:image")) {
        resolve(dataUrl || "");
        return;
      }
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const max = 120;
        let w = img.width, h = img.height;
        if (w > max || h > max) {
          if (w > h) { h = (h * max) / w; w = max; }
          else { w = (w * max) / h; h = max; }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        try {
          resolve(canvas.toDataURL("image/jpeg", 0.65));
        } catch {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setAvatar(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const join = async () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      alert("Введите имя");
      return;
    }

    if (!isHost && !room.trim()) {
      alert("Введите код комнаты");
      return;
    }

    setIsLoading(true);
    setConnectionError(false);
    setRetryCount(0);

    // Timeout after 10 seconds
    clearJoinTimeout();
    joinTimeoutRef.current = setTimeout(() => {
      setIsLoading(false);
      setConnectionError(true);
      joinTimeoutRef.current = null;
    }, 15000);

    let finalAvatar = avatar;
    if (avatar && avatar.startsWith("data:image")) {
      finalAvatar = await compressAvatar(avatar);
    }

    saveUserProfile({ name: trimmedName, avatar: finalAvatar });

    if (isHost) {
      socket.emit("create-room", {
        name: trimmedName,
        avatar: finalAvatar
      });
    } else {
      socket.emit("join-room", {
        roomId: room.trim().toUpperCase(),
        name: trimmedName,
        avatar: finalAvatar
      });
    }
  };

  if (isAutoJoining) {
    return (
      <div className="join-screen">
        <div className="join-bg-gradient" />
        <div className="join-bg-grid" />
        <div className="join-card auto-join">
          <div className="auto-join-content">
            <div className="loading-spinner-wrapper">
              <div className="loading-spinner" />
              <div className="loading-ring" />
            </div>
            <h2>Подключение к комнате <span className="room-code-highlight">{roomFromUrl}</span></h2>
            <p>Пожалуйста, подождите...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="join-screen">
      <div className="join-bg-gradient" />
      <div className="join-bg-grid" />

      <div className="join-card">
        <button className="back-nav" onClick={() => navigate("/")}>
          <ArrowLeft size={16} strokeWidth={2.5} />
          <span>Назад</span>
        </button>

        <div className="join-header">
          <div className="join-icon-wrapper">
            {isHost ? <User size={32} strokeWidth={2} /> : <Users size={32} strokeWidth={2} />}
          </div>
          <h2 className="join-title">
            {isHost ? "Создать игру" : "Присоединиться"}
          </h2>
        </div>

        {roomFromUrl && !isHost && (
          <div className="room-hint">
            <Users size={14} strokeWidth={2.5} />
            <span>Комната: <strong>{roomFromUrl}</strong></span>
          </div>
        )}

        <div className="profile-section">
          <div 
            className={`avatar-preview ${isDragOver ? "drag-over" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleFileDrop}
          >
            {avatar ? (
              <img src={avatar} alt="Аватар" />
            ) : (
              <div className="avatar-placeholder">
                <User size={32} strokeWidth={2} />
                <span className="avatar-initial">
                  {name.trim() ? name.trim()[0].toUpperCase() : "?"}
                </span>
              </div>
            )}
            <label className="avatar-overlay">
              <Upload size={20} strokeWidth={2} />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file || !file.type.startsWith("image/")) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => setAvatar(ev.target.result);
                  reader.readAsDataURL(file);
                  e.target.value = "";
                }}
              />
            </label>
          </div>

          <div className="profile-fields">
            <div className="input-group">
              <User size={18} strokeWidth={2} className="input-icon" />
              <input
                type="text"
                placeholder="Ваше имя"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
              />
            </div>
          </div>
        </div>

        {!isHost && (
          <div className="room-code-section">
            <label className="input-label">
              <Users size={14} strokeWidth={2} />
              <span>Код комнаты</span>
            </label>
            <input
              type="text"
              placeholder="ABCD"
              value={room}
              onChange={(e) => setRoom(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && join()}
              className="input-field room-code"
              maxLength={6}
            />
          </div>
        )}

        {connectionError && (
          <button 
            className="btn-retry" 
            onClick={() => {
              setConnectionError(false);
              join();
            }}
          >
            🔄 Попробовать снова
          </button>
        )}
        <button
          className="btn-join"
          onClick={join}
          disabled={isLoading || connectionError}
        >
          {isLoading ? (
            <>
              <div className="btn-spinner" />
              <span>Подключение...</span>
            </>
          ) : (
            <>
              <span>{isHost ? "Создать комнату" : "Войти"}</span>
              <ArrowLeft size={18} strokeWidth={2} className="btn-arrow" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
