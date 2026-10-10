import jwt from 'jsonwebtoken';

const secret = process.env.JWT_SECRET || 'development-only-secret';
export function issueToken(userId) { return jwt.sign({ sub: userId }, secret, { expiresIn: '1d' }); }
export function userIdFromRequest(request) {
  const header = request.headers.get('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  try {
    const payload = jwt.verify(token, secret);
    return typeof payload.sub === 'string' ? payload.sub : null;
  } catch { return null; }
}
