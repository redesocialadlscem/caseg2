import * as jose from 'jose';

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'caseg2-dev-secret-change-in-prod'
);

const ACCESS_TOKEN_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

export interface JwtPayload {
  userId: number;
  email: string;
  role: 'student' | 'admin';
  [key: string]: unknown;
}

export async function signAccessToken(payload: JwtPayload): Promise<string> {
  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRES_IN)
    .sign(SECRET);
}

export async function signRefreshToken(payload: JwtPayload): Promise<string> {
  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRES_IN)
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, SECRET);
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}
