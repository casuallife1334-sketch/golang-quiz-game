const APP_BUILD_ID = import.meta.env.VITE_BUILD_ID || "dev";
const BUILD_KEY = "quiz-app-build-id";
const PREFIXES_TO_CLEAR = ["quiz-answer-draft:"];
const KEYS_TO_CLEAR = ["quiz-user-profile", "quiz-profile", "quiz-draft"];

function clearLegacyState() {
  if (typeof window === "undefined") return;

  try {
    for (const key of KEYS_TO_CLEAR) {
      localStorage.removeItem(key);
    }

    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) keys.push(key);
    }

    for (const key of keys) {
      if (PREFIXES_TO_CLEAR.some((prefix) => key.startsWith(prefix))) {
        localStorage.removeItem(key);
      }
    }
  } catch {
    // ignore storage failures
  }
}

if (typeof window !== "undefined") {
  try {
    const storedBuildId = localStorage.getItem(BUILD_KEY);
    if (storedBuildId !== APP_BUILD_ID) {
      clearLegacyState();
      localStorage.setItem(BUILD_KEY, APP_BUILD_ID);
    }
  } catch {
    // ignore storage failures
  }
}

