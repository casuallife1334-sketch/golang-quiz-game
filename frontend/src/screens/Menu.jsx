import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Gamepad2,
  Users,
  Palette,
  Sparkles,
  Zap,
  Trophy,
  Crown,
  ChevronDown,
  Check
} from "lucide-react";
import "../styles/menu.css";
import logoImage from "../styles/123313.png";

export default function Menu() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("quiz-theme") || "dark";
  });
  const [showThemeSelector, setShowThemeSelector] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("quiz-theme", theme);
  }, [theme]);

  const themes = [
    { id: "dark", name: "Dark", color: "#6366f1", gradient: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" },
    { id: "cyber", name: "Cyber", color: "#22d3ee", gradient: "linear-gradient(135deg, #22d3ee 0%, #3b82f6 100%)" },
    { id: "noir", name: "Noir", color: "#fbbf24", gradient: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)" },
    { id: "rose", name: "Rose", color: "#fb7185", gradient: "linear-gradient(135deg, #fb7185 0%, #e879f9 100%)" }
  ];

  const currentTheme = themes.find(t => t.id === theme) || themes[0];

  return (
    <div className="menu">
      {/* Theme selector - top right corner */}
      <div className="theme-selector-modern theme-selector-corner">
        <button
          className="theme-selector-btn"
          onClick={() => setShowThemeSelector(!showThemeSelector)}
        >
          <Palette size={18} strokeWidth={2} />
          <span>Тема: {currentTheme.name}</span>
          <ChevronDown
            size={16}
            className={`theme-selector-arrow ${showThemeSelector ? "rotated" : ""}`}
            strokeWidth={2}
          />
        </button>

        <div className={`theme-selector-dropdown ${showThemeSelector ? "open" : ""}`}>
          {themes.map((t) => (
            <button
              key={t.id}
              className={`theme-option ${theme === t.id ? "active" : ""}`}
              onClick={() => {
                setTheme(t.id);
                setShowThemeSelector(false);
              }}
            >
              <div
                className="theme-color-indicator"
                style={{ background: t.gradient }}
              />
              <span className="theme-option-name">{t.name}</span>
              {theme === t.id && (
                <Check size={16} strokeWidth={2.5} className="theme-check-icon" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Animated background elements */}
      <div className="menu-bg-gradient" />
      <div className="menu-bg-grid" />
      <div className="menu-bg-orb menu-bg-orb-1" />
      <div className="menu-bg-orb menu-bg-orb-2" />
      <div className="menu-bg-orb menu-bg-orb-3" />

      {/* Floating particles */}
      <div className="menu-particles">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="menu-particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 10}s`
            }}
          />
        ))}
      </div>

      <div className="menu-container">
        {/* Logo with icon */}
        <div className="menu-logo-section">
          <div className="menu-logo-wrapper">
            <div className="menu-logo-glow" />
            <img 
              src={logoImage} 
              alt="Логотип" 
              className="menu-logo-image"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <Gamepad2 className="menu-logo-icon" size={64} strokeWidth={1.5} style={{display: 'none'}} />
          </div>
          <h1 className="menu-title">
            <span className="title-gradient">ИграТон</span>
          </h1>
          <p className="menu-subtitle">
            Создавай викторины • Играй с друзьями • Побеждай
          </p>
        </div>

        {/* Main action buttons */}
        <div className="menu-buttons">
          <button
            className="menu-btn menu-btn-primary"
            onClick={() => navigate("/join/host")}
          >
            <div className="menu-btn-bg" />
            <div className="menu-btn-content">
              <div className="menu-btn-icon-wrapper">
                <Crown size={24} strokeWidth={2} />
              </div>
              <span className="menu-btn-text">Создать игру</span>
              <Sparkles size={18} strokeWidth={2} className="menu-btn-sparkle" />
            </div>
          </button>

          <button
            className="menu-btn menu-btn-secondary"
            onClick={() => navigate("/join/player")}
          >
            <div className="menu-btn-bg" />
            <div className="menu-btn-content">
              <div className="menu-btn-icon-wrapper">
                <Users size={24} strokeWidth={2} />
              </div>
              <span className="menu-btn-text">Присоединиться</span>
            </div>
          </button>
        </div>

        {/* Features with icons */}
        <div className="menu-features">
          <div className="menu-feature-item">
            <Zap size={16} strokeWidth={2} />
            <span>Быстрая игра</span>
          </div>
          <div className="menu-feature-item">
            <Trophy size={16} strokeWidth={2} />
            <span>Соревнования</span>
          </div>
          <div className="menu-feature-item">
            <Users size={16} strokeWidth={2} />
            <span>До 100 игроков</span>
          </div>
        </div>
      </div>
    </div>
  );
}
