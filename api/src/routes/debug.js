// api/routes/debug.js
import { Router } from 'express'

const r = Router()

r.get('/tmdb', async (req, res) => {
  try {
    const out = await fetch('https://api.themoviedb.org/3/trending/movie/day?language=pt-BR', {
      headers: { Authorization: `Bearer ${process.env.TMDB_TOKEN}` }
    })
    const data = await out.json()
    res.status(out.status).json({
      ok: out.ok,
      status: out.status,
      sample: Array.isArray(data?.results) ? data.results.slice(0, 3) : data
    })
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) })
  }
})

export default r
