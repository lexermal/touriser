export const LAST_TRIP_KEY = "touriser:lastTrip";
export const tripCacheKey = (id: string) => `touriser:trip:${id}`;
export const optionsKey = (id: string) => `touriser:options:${id}`;
export const NOTIFY_KEY = "touriser:notify";

// localStorage can throw (private mode, blocked storage); the app must keep working without it.
export const safeStorage = {
  get(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string) {
    try {
      localStorage.setItem(key, value);
    } catch {}
  },
  remove(key: string) {
    try {
      localStorage.removeItem(key);
    } catch {}
  },
};
