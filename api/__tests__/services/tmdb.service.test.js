import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { normalizeMovie, searchMulti } from '../../src/services/tmdb.service.js';

global.fetch = jest.fn();

describe('TMDB Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.TMDB_V3_API_KEY = 'test-key';
  });

  describe('normalizeMovie', () => {
    it('normalizes movie data structure correctly', () => {
      const rawMovie = {
        id: 123,
        title: 'Test Movie',
        release_date: '2023-01-15',
        poster_path: '/poster.jpg',
        vote_average: 8.5,
        overview: 'Test overview',
      };

      const normalized = normalizeMovie(rawMovie);

      expect(normalized.id).toBe(123);
      expect(normalized.media).toBe('movie');
      expect(normalized.title).toBe('Test Movie');
      expect(normalized.year).toBe('2023');
      expect(normalized.poster_path).toBe('/poster.jpg');
    });

    it('handles TV shows with first_air_date', () => {
      const rawTv = {
        id: 456,
        name: 'Test Show',
        first_air_date: '2022-05-20',
        media_type: 'tv',
        poster_path: '/tv-poster.jpg',
      };

      const normalized = normalizeMovie(rawTv);

      expect(normalized.media).toBe('tv');
      expect(normalized.title).toBe('Test Show');
      expect(normalized.year).toBe('2022');
    });

    it('handles missing poster path gracefully', () => {
      const rawMovie = {
        id: 789,
        title: 'No Poster',
        poster_path: null,
      };

      const normalized = normalizeMovie(rawMovie);

      expect(normalized.poster_path).toBeNull();
    });
  });

  describe('searchMulti', () => {
    it('returns empty results for empty query', async () => {
      const result = await searchMulti('');

      expect(result.results).toEqual([]);
      expect(result.page).toBe(1);
    });

    it('handles API errors gracefully', async () => {
      global.fetch.mockRejectedValueOnce(new Error('API Error'));

      await expect(searchMulti('test')).rejects.toThrow();
    });
  });
});
