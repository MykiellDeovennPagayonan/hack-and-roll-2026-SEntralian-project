export function getStoredResult(key: string): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(key);
}

export function setStoredResult(key: string, value: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(key, value);
}

export function clearStoredResult(key: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(key);
}

export function getStoredImage(key: string): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(`${key}_image`);
}

export function setStoredImage(key: string, base64: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(`${key}_image`, base64);
}

export function clearStoredImage(key: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(`${key}_image`);
}
