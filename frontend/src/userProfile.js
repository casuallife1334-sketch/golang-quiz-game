const STORAGE_KEY = "quiz-user-profile";

function createClientId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function getUserProfile() {
  if (typeof window === "undefined") return { name: "", avatar: "" };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { name: "", avatar: "" };
    const parsed = JSON.parse(raw);
    return {
      name: parsed.name || "",
      avatar: parsed.avatar || "",
      clientId: parsed.clientId || "",
      clientToken: parsed.clientToken || "",
    };
  } catch {
    return { name: "", avatar: "" };
  }
}

export function getClientId() {
  if (typeof window === "undefined") return "";
  const profile = getUserProfile();
  if (profile.clientId) return profile.clientId;

  const clientId = createClientId();
  saveUserProfile({ clientId });
  return clientId;
}

export function getClientToken() {
  if (typeof window === "undefined") return "";
  return getUserProfile().clientToken || "";
}

export function saveUserProfile(profile) {
  if (typeof window === "undefined") return;
  try {
    const current = getUserProfile();
    const next = {
      ...current,
      ...profile,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}
