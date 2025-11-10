import { z } from "zod";
import { createList, getList, addItem, removeItem } from "../models/listStore.js";

export async function createListCtrl(req, res, next) {
  try {
    const body = z.object({ name: z.string().min(1).max(60).optional() }).parse(req.body || {});
    const out = await createList({ name: body.name || "Meus Favoritos" });
    res.status(201).json(out);
  } catch (e) { next(e); }
}

export async function getListCtrl(req, res, next) {
  try {
    const list = await getList(req.params.slug);
    if (!list) return res.status(404).json({ message: "Lista não encontrada" });
    res.json(list);
  } catch (e) { next(e); }
}

export async function addItemCtrl(req, res, next) {
  try {
    const Body = z.object({
      tmdb_id: z.number(),
      media_type: z.enum(["movie", "tv"]),
      title: z.string().min(1),
      poster_path: z.string().nullable().optional(),
      vote_average: z.number().nullable().optional(),
      release_year: z.string().nullable().optional(),
      overview: z.string().nullable().optional(),
    });
    const item = Body.parse(req.body || {});
    const list = await addItem(req.params.slug, item);
    if (!list) return res.status(404).json({ message: "Lista não encontrada" });
    res.status(201).json(list);
  } catch (e) { next(e); }
}

export async function removeItemCtrl(req, res, next) {
  try {
    const tmdbId = Number(req.params.tmdbId);
    const list = await removeItem(req.params.slug, tmdbId);
    if (!list) return res.status(404).json({ message: "Lista não encontrada" });
    res.json(list);
  } catch (e) { next(e); }
}

export async function shareLinkCtrl(req, res, next) {
  try {
    const list = await getList(req.params.slug);
    if (!list) return res.status(404).json({ message: "Lista não encontrada" });
    const base = process.env.SHARE_BASE_URL || "http://localhost:5173";
    res.json({ shareLink: `${base}/l/${list.slug}` });
  } catch (e) { next(e); }
}
