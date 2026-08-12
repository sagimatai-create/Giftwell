// Gives each recipient's browser a stable anonymous id, so their cart and
// budget stay theirs across visits without needing to log in.
export function getAnonId() {
  if (typeof window === "undefined") return null;
  const KEY = "giftwell_anon_id";
  let id = window.localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(KEY, id);
  }
  return id;
}
