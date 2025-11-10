import { getFirestore } from "../config/firebase.config.js";
import { nanoid } from "nanoid";

const coll = () => getFirestore().collection("favorite_lists");

export async function createList({ name = "Meus Favoritos" } = {}) {
  const slug = nanoid(10).toLowerCase();
  const now = new Date();
  const doc = {
    slug,
    name,
    items: [],
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
  await coll().doc(slug).set(doc, { merge: false });
  return { slug, name };
}

export async function getList(slug) {
  const snap = await coll().doc(slug).get();
  return snap.exists ? snap.data() : null;
}

export async function addItem(slug, item) {
  const ref = coll().doc(slug);
  const snap = await ref.get();
  if (!snap.exists) return null;

  const list = snap.data();
  const exists = (list.items || []).some(i => i.tmdb_id === item.tmdb_id);
  if (!exists) list.items = [...(list.items || []), item];

  list.updatedAt = new Date().toISOString();
  await ref.set(list, { merge: true });
  return list;
}

export async function removeItem(slug, tmdbId) {
  const ref = coll().doc(slug);
  const snap = await ref.get();
  if (!snap.exists) return null;

  const list = snap.data();
  list.items = (list.items || []).filter(i => i.tmdb_id !== tmdbId);
  list.updatedAt = new Date().toISOString();
  await ref.set(list, { merge: true });
  return list;
}
