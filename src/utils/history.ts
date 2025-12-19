import { HistoryItem } from '../types';

const API_BASE = '/api';

export const saveToHistory = async (item: Omit<HistoryItem, 'id' | 'timestamp'>, userId: string) => {
  const newItem: HistoryItem = {
    ...item,
    id: Math.random().toString(36).substr(2, 9),
    timestamp: Date.now(),
  };

  try {
    await fetch(`${API_BASE}/history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newItem, user_id: userId }),
    });
  } catch (e) {
    console.error("Failed to save history to DB", e);
  }
};

export const fetchHistoryFromServer = async (userId: string, role?: string): Promise<HistoryItem[]> => {
  try {
    const queryString = role === 'admin' 
        ? `all=true` 
        : `user_id=${userId}`;

    const response = await fetch(`${API_BASE}/history?${queryString}`);
    if (!response.ok) throw new Error("Network response was not ok");
    
    const data = await response.json();
    
    if (!Array.isArray(data)) return [];

    return data.map((d: any) => ({
      id: d.id,
      user_name: d.user_name || undefined,
      type: d.type,
      original: d.original_text || d.original, 
      result: d.result_text || d.result,
      timestamp: Number(d.timestamp)
    }));
  } catch (e) {
    console.error("Backend unavailable", e);
    return [];
  }
};

export const clearHistoryFromServer = async (userId: string) => {
  try {
    await fetch(`${API_BASE}/history?user_id=${userId}`, { method: 'DELETE' });
  } catch (e) {
    console.error("Failed to clear remote history.");
  }
};

// Helper for HashConverter to check history client-side for immediate verification
// In a full DB architecture, verify would likely be a server-side call too, 
// but we'll fetch all history for the user and search in memory for responsiveness.
export const findOriginalByHash = async (hash: string, userId: string): Promise<string | null> => {
    if (!hash) return null;
    const items = await fetchHistoryFromServer(userId);
    const item = items.find(h => h.result && h.result.toLowerCase() === hash.trim().toLowerCase());
    return item ? item.original : null;
};
