// Persistence. Progress and settings live in localStorage; every access is guarded
// because storage can be unavailable (private mode, blocked site data).
const SAVE_KEY = 'rfr-save-v1';
const SETTINGS_KEY = 'rfr-settings-v1';

export const DEFAULT_SETTINGS = {
  music: 0.7,
  sfx: 0.8,
  reduceFlash: false,
  shake: 1, // 0, 0.5, 1
  battleMode: 'wait', // 'wait' pauses ATB while choosing, 'active' does not
  textSpeed: 2, // 1 slow, 2 normal, 3 fast
};

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(s) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

export function hasSave() {
  try { return !!localStorage.getItem(SAVE_KEY); } catch { return false; }
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function saveGame(state) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...state, savedAt: Date.now() }));
    return true;
  } catch { return false; }
}

export function saveSummary() {
  const s = loadGame();
  if (!s) return null;
  return { chapter: s.chapterName || '', map: s.mapName || '', time: s.playtime || 0, leader: s.party?.[0] };
}
