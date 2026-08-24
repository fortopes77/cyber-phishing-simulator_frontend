// Default lifetime to assume when a token's expiry can't be determined
// (e.g. the mock token format, or a real JWT with no `exp` claim).
const DEFAULT_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Works out when a token expires, in epoch milliseconds.
 *
 * - Real JWTs (`header.payload.signature`) are decoded and their `exp`
 *   claim (seconds since epoch) is used.
 * - AuthService's mock tokens (`mock_token_{base64}_{timestamp}`) use the
 *   embedded issue timestamp plus DEFAULT_TOKEN_TTL_MS.
 * - Anything else falls back to "now + DEFAULT_TOKEN_TTL_MS" so the app
 *   still has a sane refresh point rather than never expiring.
 *
 * ASSUMPTION: the real backend issues standard JWTs with an `exp` claim.
 * Update this if it uses a different token format.
 */
export function decodeTokenExpiry(token: string | undefined | null): number {
  if (!token) {
    return Date.now() + DEFAULT_TOKEN_TTL_MS;
  }

  const jwtExpiry = decodeJwtExpiry(token);
  if (jwtExpiry != null) {
    return jwtExpiry;
  }

  const mockTokenExpiry = decodeMockTokenExpiry(token);
  if (mockTokenExpiry != null) {
    return mockTokenExpiry;
  }

  return Date.now() + DEFAULT_TOKEN_TTL_MS;
}

export function isTokenExpired(
  expiresAt: number | undefined | null,
  now: number = Date.now(),
): boolean {
  return expiresAt != null && now > expiresAt;
}

function decodeJwtExpiry(token: string): number | null {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }

  try {
    const payloadJson = atob(
      parts[1].replace(/-/g, '+').replace(/_/g, '/'),
    );
    const payload = JSON.parse(payloadJson);
    if (typeof payload.exp === 'number') {
      return payload.exp * 1000;
    }
  } catch {
    // Not a valid base64/JSON payload - fall through.
  }

  return null;
}

function decodeMockTokenExpiry(token: string): number | null {
  const match = /^mock_token_.+_(\d+)$/.exec(token);
  if (!match) {
    return null;
  }

  const issuedAt = Number(match[1]);
  if (Number.isNaN(issuedAt)) {
    return null;
  }

  return issuedAt + DEFAULT_TOKEN_TTL_MS;
}
