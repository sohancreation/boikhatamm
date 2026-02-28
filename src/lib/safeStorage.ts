type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const memory = new Map<string, string>();

export const safeStorage: StorageLike = {
  getItem(key: string) {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {
      // Ignore and use in-memory fallback.
    }
    return memory.has(key) ? memory.get(key)! : null;
  },
  setItem(key: string, value: string) {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch {
      // Ignore and use in-memory fallback.
    }
    memory.set(key, value);
  },
  removeItem(key: string) {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // Ignore and use in-memory fallback.
    }
    memory.delete(key);
  },
};
