export type SharedItem = {
  id: number;
  media_type: "movie" | "tv";
  title: string;
  image?: string;
};

function b64urlEncodeUtf8(str: string) {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  const b64 = btoa(bin);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function b64urlDecodeUtf8(str: string) {
  const pad = str.length % 4 === 0 ? "" : "=".repeat(4 - (str.length % 4));
  const b64 = (str.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export function encodeFavorites(items: SharedItem[]) {
  const payload = { v: 1 as const, items };
  return b64urlEncodeUtf8(JSON.stringify(payload));
}

export function decodeFavorites(code: string): SharedItem[] {
  try {
    const raw = b64urlDecodeUtf8(code);
    const obj = JSON.parse(raw) as unknown;

    if (
      obj &&
      typeof obj === "object" &&
      (obj as any).v === 1 &&
      Array.isArray((obj as any).items)
    ) {
      const items = (obj as any).items.filter((it: any) =>
        it &&
        typeof it.id === "number" &&
        (it.media_type === "movie" || it.media_type === "tv") &&
        typeof it.title === "string"
      );
      return items;
    }
  } catch {}
  return [];
}

export function buildShareUrl(items: SharedItem[]) {
  const code = encodeFavorites(items);
  return `${window.location.origin}/#/f/${code}`;
}

export function parseSharedFromHash(): SharedItem[] | null {
  const m = window.location.hash.match(/^#\/f\/([A-Za-z0-9\-_]+)$/);
  if (!m) return null;
  return decodeFavorites(m[1]);
}
