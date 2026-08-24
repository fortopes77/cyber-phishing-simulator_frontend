import { decodeTokenExpiry, isTokenExpired } from './token.utils';

describe('token.utils', () => {
  describe('decodeTokenExpiry', () => {
    it('should return now + default TTL when no token is provided', () => {
      const before = Date.now();
      const expiry = decodeTokenExpiry(undefined);
      const after = Date.now();

      expect(expiry).toBeGreaterThanOrEqual(before + 14 * 60 * 1000);
      expect(expiry).toBeLessThanOrEqual(after + 15 * 60 * 1000);
    });

    it('should decode the exp claim from a real JWT', () => {
      const expSeconds = Math.floor(Date.now() / 1000) + 3600;
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({ sub: 'user1', exp: expSeconds }));
      const token = `${header}.${payload}.signature`;

      expect(decodeTokenExpiry(token)).toBe(expSeconds * 1000);
    });

    it('should fall back to a default TTL for a JWT with no exp claim', () => {
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({ sub: 'user1' }));
      const token = `${header}.${payload}.signature`;

      const before = Date.now();
      const expiry = decodeTokenExpiry(token);

      expect(expiry).toBeGreaterThan(before);
    });

    it('should derive expiry from the mock token format', () => {
      const issuedAt = Date.now();
      const token = `mock_token_dXNlcjp0cmFpbmVy_${issuedAt}`;

      expect(decodeTokenExpiry(token)).toBe(issuedAt + 15 * 60 * 1000);
    });

    it('should fall back to a default TTL for an unrecognised token format', () => {
      const before = Date.now();
      const expiry = decodeTokenExpiry('not-a-real-token');

      expect(expiry).toBeGreaterThan(before);
    });
  });

  describe('isTokenExpired', () => {
    it('should return false when there is no expiry set', () => {
      expect(isTokenExpired(undefined)).toBeFalse();
      expect(isTokenExpired(null)).toBeFalse();
    });

    it('should return true when now is after expiry', () => {
      expect(isTokenExpired(1000, 2000)).toBeTrue();
    });

    it('should return false when now is before expiry', () => {
      expect(isTokenExpired(2000, 1000)).toBeFalse();
    });
  });
});
