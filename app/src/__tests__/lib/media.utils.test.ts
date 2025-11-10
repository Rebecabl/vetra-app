import { describe, it, expect } from 'vitest';
import { poster, backdrop, formatRuntime, extractYear, formatDate, formatCurrency } from '../../lib/media.utils';

describe('Media Utils', () => {
  describe('poster', () => {
    it('builds correct TMDB poster URL', () => {
      const path = '/test-poster.jpg';
      const url = poster(path);

      expect(url).toContain('image.tmdb.org');
      expect(url).toContain('w500');
      expect(url).toContain(path);
    });

    it('returns placeholder for null path', () => {
      const url = poster(null);

      expect(url).toContain('placeholder');
    });

    it('uses custom size when provided', () => {
      const path = '/test.jpg';
      const url = poster(path, 'w780');

      expect(url).toContain('w780');
    });
  });

  describe('backdrop', () => {
    it('builds correct backdrop URL', () => {
      const path = '/backdrop.jpg';
      const url = backdrop(path);

      expect(url).toContain('image.tmdb.org');
      expect(url).toContain('w1280');
    });
  });

  describe('formatRuntime', () => {
    it('formats minutes correctly', () => {
      expect(formatRuntime(90)).toBe('1h 30m');
      expect(formatRuntime(60)).toBe('1h');
      expect(formatRuntime(45)).toBe('45m');
      expect(formatRuntime(null)).toBe('—');
    });
  });

  describe('extractYear', () => {
    it('extracts year from date string', () => {
      expect(extractYear('2023-12-25')).toBe('2023');
      expect(extractYear(null)).toBeNull();
    });
  });

  describe('formatDate', () => {
    it('formats date correctly', () => {
      const formatted = formatDate('2023-12-25');
      expect(formatted).toBeTruthy();
      expect(formatted).not.toBe('—');
    });

    it('returns dash for null date', () => {
      expect(formatDate(null)).toBe('—');
    });
  });

  describe('formatCurrency', () => {
    it('formats USD currency', () => {
      const formatted = formatCurrency(1000000);
      expect(formatted).toContain('$');
      expect(formatted).toContain('1');
    });

    it('returns dash for null amount', () => {
      expect(formatCurrency(null)).toBe('—');
    });
  });
});
