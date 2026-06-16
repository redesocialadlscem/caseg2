import * as jose from 'jose';

/**
 * Carrega um segredo do ambiente. Faz fail-fast (derruba o boot) se um segredo
 * obrigatório estiver ausente — nunca usamos fallback hardcoded, que permitiria
 * forjar tokens em produção.
 */
function loadSecret(name: string, required: boolean): Uint8Array | null {
  const val = process.env[name];
  if (!val || val.trim().length === 0) {
    if (required) {
      throw new Error(
        `[jwt] Variável de ambiente ${name} ausente. Defina um segredo forte antes de iniciar o servidor.`,
      );
    }
    return null;
  }
  if (val.length < 16) {
    console.warn(`[jwt] ${name} tem menos de 16 caracteres — use um segredo mais forte.`);
  }
  return new TextEncoder().encode(val);
}

const ACCESS_SECRET = loadSecret('JWT_SECRET', true)!;
// Refresh tem segredo próprio; se não definido, cai no de acesso (com aviso).
const REFRESH_SECRET = loadSecret('JWT_REFRESH_SECRET', false) ?? ACCESS_SECRET;
if (!process.env.JWT_REFRESH_SECRET) {
  console.warn('[jwt] JWT_REFRESH_SECRET não definido — usando JWT_SECRET para refresh tokens.');
}

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
    .sign(ACCESS_SECRET);
}

export async function signRefreshToken(payload: JwtPayload): Promise<string> {
  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRES_IN)
    .sign(REFRESH_SECRET);
}

async function verifyWith(token: string, secret: Uint8Array): Promise<JwtPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, secret);
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}

export function verifyAccessToken(token: string): Promise<JwtPayload | null> {
  return verifyWith(token, ACCESS_SECRET);
}

export function verifyRefreshToken(token: string): Promise<JwtPayload | null> {
  return verifyWith(token, REFRESH_SECRET);
}

/** @deprecated use verifyAccessToken — mantido para compatibilidade. */
export const verifyToken = verifyAccessToken;
