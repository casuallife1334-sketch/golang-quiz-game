const themes = [
  { id: "dark", label: "Dark" },
  { id: "cyber", label: "Cyber" },
  { id: "noir", label: "Noir" }
];

export default function ThemeToggle({ theme, setTheme }) {
  return (
    <div className="theme-toggle">
      {themes.map((t) => (
        <button
          key={t.id}
          type="button"
          className={`theme-toggle-btn ${theme === t.id ? "active" : ""}`}
          onClick={() => setTheme(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
