import { nanoid } from 'nanoid'

export function ensureUid(req, res, next) {
  const headerUid = req.headers['x-uid']
  if (headerUid && typeof headerUid === 'string') {
    req.uid = headerUid
    return next()
  }

  
  
  const cookieUid = req.cookies?.uid
  if (cookieUid) {
    req.uid = cookieUid
    return next()
  }

  const newUid = `anon_${nanoid(16)}`
  req.uid = newUid
  res.cookie('uid', newUid, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 * 365 // 1 ano
  })
  next()
}
