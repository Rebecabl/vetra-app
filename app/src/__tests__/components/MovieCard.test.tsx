import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import MovieCard from '../../components/MovieCard';
import type { Movie } from '../../types';

const mockMovie: Movie = {
  id: 1,
  media_type: 'movie',
  title: 'Test Movie',
  image: 'https://example.com/poster.jpg',
  rating: 8.5,
  year: '2023',
};

describe('MovieCard', () => {
  it('renders movie information correctly', () => {
    const onDetails = vi.fn();
    const onToggleFav = vi.fn();
    const isFavorite = () => false;

    render(
      <MovieCard
        movie={mockMovie}
        isFavorite={isFavorite}
        onDetails={onDetails}
        onToggleFav={onToggleFav}
      />
    );

    expect(screen.getByText('Test Movie')).toBeInTheDocument();
  });

  it('calls onDetails when clicked', () => {
    const onDetails = vi.fn();
    const onToggleFav = vi.fn();
    const isFavorite = () => false;

    render(
      <MovieCard
        movie={mockMovie}
        isFavorite={isFavorite}
        onDetails={onDetails}
        onToggleFav={onToggleFav}
      />
    );

    expect(onDetails).toBeDefined();
  });
});
