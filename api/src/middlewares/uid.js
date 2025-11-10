import { nanoid } from 'nanoid'

export default function ensureUid(req, res, next) {
  const existing = req.cookies?.uid
  if (!existing) {
    const id = nanoid(16)
    res.cookie('uid', id, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 365, // 1 ano
    })
    req.uid = id
  } else {
    req.uid = existing
  }
  next()
}