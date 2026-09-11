/**
 * Centralized API client for communicating with the Luman Backend (MongoDB)
 */

export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

/**
 * Resolve current logged in user directly from browser cookies
 */
export function getCurrentUserClient(): { id?: string; _id?: string; email?: string; username?: string; selected_class?: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const cookies = document.cookie.split("; ");
    // Check lumen_user_id
    const idCookie = cookies.find((c) => c.startsWith("lumen_user_id="));
    let userId = idCookie ? decodeURIComponent(idCookie.split("=")[1]) : undefined;

    // Check lumen_user
    const userCookie = cookies.find((c) => c.startsWith("lumen_user="));
    if (userCookie) {
      const val = decodeURIComponent(userCookie.split("=").slice(1).join("="));
      const parsed = JSON.parse(val);
      if (parsed) {
        if (!userId) userId = parsed.id || parsed._id;
        return { ...parsed, id: userId, _id: userId };
      }
    }
    if (userId) {
      return { id: userId, _id: userId };
    }
  } catch (err) {
    console.warn("Failed to parse user cookie:", err);
  }
  return null;
}

export function getClientUserId(): string | undefined {
  const user = getCurrentUserClient();
  return user?.id || user?._id;
}

// -------------------------------------------------------------
// Flashcards API
// -------------------------------------------------------------

export interface Flashcard {
  id: number;
  question: string;
  answer: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  keyPoints: string[];
}

export interface FlashcardDeck {
  _id?: string;
  id?: string;
  title: string;
  summary: string;
  sourceType: string;
  totalCards: number;
  flashcards: Flashcard[];
  createdAt?: string;
  isFallback?: boolean;
}

export async function generateFlashcardsAPI(formData: FormData) {
  const response = await fetch(`${BACKEND_URL}/api/flashcards/generate`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || "Failed to generate flashcards");
  }

  return data;
}

export async function saveFlashcardDeckAPI(deck: {
  title: string;
  summary?: string;
  sourceType?: string;
  flashcards: Flashcard[];
  userId?: string;
}) {
  const effectiveUserId = deck.userId || getClientUserId();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (effectiveUserId) {
    headers["x-user-id"] = effectiveUserId;
  }

  const response = await fetch(`${BACKEND_URL}/api/flashcards/decks`, {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify({
      ...deck,
      userId: effectiveUserId,
    }),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || "Failed to save flashcard deck to MongoDB");
  }

  return data.deck;
}

export async function getSavedDecksAPI(userId?: string) {
  const effectiveUserId = userId || getClientUserId();
  const url = effectiveUserId
    ? `${BACKEND_URL}/api/flashcards/decks?userId=${encodeURIComponent(effectiveUserId)}`
    : `${BACKEND_URL}/api/flashcards/decks`;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (effectiveUserId) {
    headers["x-user-id"] = effectiveUserId;
  }

  const response = await fetch(url, {
    method: "GET",
    headers,
    credentials: "include",
    cache: "no-store",
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch saved decks");
  }

  return data.decks || [];
}

export async function getDeckByIdAPI(deckId: string) {
  const response = await fetch(`${BACKEND_URL}/api/flashcards/decks/${deckId}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  const data = await response.json();
  if (!response.ok || !data.deck) {
    throw new Error(data.error || "Flashcard deck not found");
  }

  return data.deck;
}

export async function deleteDeckAPI(deckId: string) {
  const response = await fetch(`${BACKEND_URL}/api/flashcards/decks/${deckId}`, {
    method: "DELETE",
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to delete deck");
  }

  return data;
}

// -------------------------------------------------------------
// Auth API (MongoDB)
// -------------------------------------------------------------

export async function loginAPI(email: string, password: string) {
  const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || "Invalid credentials");
  }

  return data;
}

export async function signupAPI(
  email: string,
  password: string,
  username: string,
  selected_class: string = "grinder"
) {
  const response = await fetch(`${BACKEND_URL}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, username, selected_class }),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || "Registration failed");
  }

  return data;
}

export async function getMeAPI(token?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (!response.ok) return null;
  const data = await response.json();
  return data.user || null;
}

export async function updateClassAPI(selectedClass: string, token?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${BACKEND_URL}/api/auth/class`, {
    method: "POST",
    headers,
    body: JSON.stringify({ selected_class: selectedClass }),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || "Failed to update class");
  }

  return data.user;
}

// -------------------------------------------------------------
// Tutor API (MongoDB)
// -------------------------------------------------------------

export async function saveTutorSessionAPI(sessionData: {
  userId?: string;
  title: string;
  sourceType: string;
  sourceContent?: string;
  curriculum: unknown;
}) {
  const effectiveUserId = sessionData.userId || getClientUserId();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (effectiveUserId) {
    headers["x-user-id"] = effectiveUserId;
  }

  const response = await fetch(`${BACKEND_URL}/api/tutor/sessions`, {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify({
      ...sessionData,
      userId: effectiveUserId,
    }),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || "Failed to save tutor session");
  }

  return data.session;
}

export async function getTutorSessionAPI(sessionId: string) {
  const response = await fetch(`${BACKEND_URL}/api/tutor/sessions/${sessionId}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  const data = await response.json();
  if (!response.ok || !data.session) {
    throw new Error(data.error || "Session not found");
  }

  return data.session;
}

// -------------------------------------------------------------
// Mind Map API (MongoDB)
// -------------------------------------------------------------

export interface MindMapNode {
  id: string;
  label: string;
  description: string;
  level: number;
  children: MindMapNode[];
}

export interface MindMapHierarchy {
  root: MindMapNode;
}

export interface SavedMindMap {
  _id?: string;
  id?: string;
  title: string;
  sourceName: string;
  hierarchy: MindMapHierarchy;
  flowData?: unknown;
  createdAt?: string;
}

export async function generateMindMapAPI(formData: FormData) {
  const response = await fetch(`${BACKEND_URL}/api/mindmap/generate`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || "Failed to generate mind map");
  }

  return data;
}

export async function saveMindMapAPI(mapData: {
  title: string;
  sourceName?: string;
  hierarchy: MindMapHierarchy;
  flowData?: unknown;
  userId?: string;
}) {
  const effectiveUserId = mapData.userId || getClientUserId();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (effectiveUserId) {
    headers["x-user-id"] = effectiveUserId;
  }

  const response = await fetch(`${BACKEND_URL}/api/mindmap/save`, {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify({
      ...mapData,
      userId: effectiveUserId,
    }),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || "Failed to save mind map to MongoDB");
  }

  return data.mindMap;
}

export async function getSavedMindMapsAPI(userId?: string) {
  const effectiveUserId = userId || getClientUserId();
  const url = effectiveUserId
    ? `${BACKEND_URL}/api/mindmap?userId=${encodeURIComponent(effectiveUserId)}`
    : `${BACKEND_URL}/api/mindmap`;

  const response = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    cache: "no-store",
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch saved mind maps");
  }

  return data.mindMaps || [];
}

export async function getMindMapByIdAPI(mapId: string) {
  const response = await fetch(`${BACKEND_URL}/api/mindmap/${mapId}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  const data = await response.json();
  if (!response.ok || !data.mindMap) {
    throw new Error(data.error || "Mind map not found");
  }

  return data.mindMap;
}

export async function deleteMindMapAPI(mapId: string) {
  const response = await fetch(`${BACKEND_URL}/api/mindmap/${mapId}`, {
    method: "DELETE",
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to delete mind map");
  }

  return data;
}

