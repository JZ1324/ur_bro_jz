export function readSaved<T>(key: string, fallback: T, valid: (value: unknown) => value is T): T {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(`garden:${key}`) ?? 'null');
    return valid(value) ? value : fallback;
  } catch { return fallback; }
}

export function save(key: string, value: unknown) {
  try { localStorage.setItem(`garden:${key}`, JSON.stringify(value)); return true; }
  catch { return false; /* Garden also works with storage disabled. */ }
}
