import { describe, it, expect } from '@jest/globals';

describe('Utility Functions', () => {
  describe('String validation', () => {
    it('validates email format correctly', () => {
      const validEmail = 'test@example.com';
      const invalidEmail = 'not-an-email';

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      expect(emailRegex.test(validEmail)).toBe(true);
      expect(emailRegex.test(invalidEmail)).toBe(false);
    });

    it('validates password minimum length', () => {
      const shortPassword = '12345';
      const validPassword = '123456';

      expect(shortPassword.length >= 6).toBe(false);
      expect(validPassword.length >= 6).toBe(true);
    });
  });

  describe('Data normalization', () => {
    it('extracts year from ISO date string', () => {
      const date = '2023-12-25';
      const year = date.slice(0, 4);

      expect(year).toBe('2023');
    });

    it('handles null dates gracefully', () => {
      const date = null;
      const year = date ? date.slice(0, 4) : null;

      expect(year).toBeNull();
    });
  });
});
