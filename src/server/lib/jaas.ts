import * as jose from 'jose';

interface JaasTokenOptions {
  room: string;
  name: string;
  email?: string;
  userId?: string;
  moderator: boolean;
}

/**
 * Gera um JWT do JaaS (Jitsi as a Service, 8x8.vc) para autenticar o usuário
 * na sala. O poder de MODERADOR vem da claim `context.user.moderator`.
 *
 * Retorna null quando as credenciais do JaaS não estão configuradas — nesse
 * caso o frontend entra sem token (comportamento atual), evitando quebrar a aula.
 *
 * Variáveis de ambiente necessárias (painel 8x8 > API Keys):
 *   JAAS_APP_ID       — ex.: vpaas-magic-cookie-xxxxxxxx
 *   JAAS_API_KEY      — o "kid" da API Key (vpaas-magic-cookie-xxxx/yyyy)
 *   JAAS_PRIVATE_KEY  — a chave privada RSA (PEM PKCS8)
 */
export async function generateJaasToken(
  opts: JaasTokenOptions,
): Promise<{ token: string; appId: string } | null> {
  const appId = process.env.JAAS_APP_ID;
  const apiKey = process.env.JAAS_API_KEY; // usado como "kid" no header
  const rawKey = process.env.JAAS_PRIVATE_KEY;

  if (!appId || !apiKey || !rawKey) return null;

  // No .env a chave pode estar com \n literais numa única linha
  const pem = rawKey.includes('\\n') ? rawKey.replace(/\\n/g, '\n') : rawKey;

  let privateKey: jose.CryptoKey;
  try {
    privateKey = await jose.importPKCS8(pem, 'RS256');
  } catch {
    // Chave malformada — não derruba a aula, apenas não emite token
    return null;
  }

  const now = Math.floor(Date.now() / 1000);

  const token = await new jose.SignJWT({
    aud: 'jitsi',
    iss: 'chat',
    sub: appId,
    room: opts.room || '*',
    context: {
      user: {
        id: opts.userId || '',
        name: opts.name,
        email: opts.email || '',
        avatar: '',
        moderator: opts.moderator,
      },
      features: {
        livestreaming: opts.moderator,
        recording: opts.moderator,
        transcription: opts.moderator,
        'outbound-call': false,
      },
    },
  })
    .setProtectedHeader({ alg: 'RS256', kid: apiKey, typ: 'JWT' })
    .setIssuedAt(now)
    .setNotBefore(now - 10)
    .setExpirationTime('4h')
    .sign(privateKey);

  return { token, appId };
}
