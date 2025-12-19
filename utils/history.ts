
import { HistoryItem } from '../types';

const API_URL = 'api.php';

export const saveToHistory = async (item: Omit<HistoryItem, 'id' | 'timestamp'>, userId: string) => {
  const newItem: HistoryItem = {
    ...item,
    id: Math.random().toString(36).substr(2, 9),
    timestamp: Date.now(),
  };
  
  // Save locally first for offline support and immediate UI update
  const localHistory = getLocalHistory();
  const updatedHistory = [newItem, ...localHistory].slice(0, 50);
  localStorage.setItem('securepass_history_log', JSON.stringify(updatedHistory));

  // Sync with Backend
  try {
    await fetch(`${API_URL}?action=save_history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newItem, user_id: userId }),
    });
  } catch (e) {
    console.warn("DB Sync failed, kept in local storage only.");
  }
};

export const getLocalHistory = (): HistoryItem[] => {
  const data = localStorage.getItem('securepass_history_log');
  if (!data) return [];
  try { return JSON.parse(data); } catch { return []; }
};

export const findOriginalByHash = (hash: string): string | null => {
  if (!hash) return null;
  const history = getLocalHistory();
  // Case insensitive check
  const item = history.find(h => 
    h.result && h.result.toLowerCase() === hash.trim().toLowerCase()
  );
  return item ? item.original : null;
};

export const fetchHistoryFromServer = async (userId: string, role?: string): Promise<HistoryItem[]> => {
  try {
    const queryString = role === 'admin' 
        ? `action=get_history&all=true` 
        : `action=get_history&user_id=${userId}`;

    const response = await fetch(`${API_URL}?${queryString}`);
    if (!response.ok) throw new Error("Network response was not ok");
    
    const data = await response.json();
    
    if (!Array.isArray(data)) return getLocalHistory();

    // Map DB snake_case to TS interface
    return data.map((d: any) => ({
      id: d.id,
      user_name: d.user_name || undefined, // Only present if admin query with JOIN
      type: d.type,
      // Map 'original_text' from DB to 'original' in Interface
      original: d.original_text || d.original, 
      // Map 'result_text' from DB to 'result' in Interface
      result: d.result_text || d.result,
      timestamp: Number(d.timestamp)
    }));
  } catch (e) {
    console.warn("Backend unavailable, using local history.", e);
    return getLocalHistory();
  }
};

export const clearHistoryFromServer = async (userId: string) => {
  localStorage.removeItem('securepass_history_log');
  try {
    await fetch(`${API_URL}?action=clear_history&user_id=${userId}`, { method: 'DELETE' });
  } catch (e) {
    console.error("Failed to clear remote history.");
  }
};
