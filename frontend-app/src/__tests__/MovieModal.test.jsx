import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MovieModal from '../components/MovieModal';
import * as auth from '../context/AuthContext';

jest.mock('../context/AuthContext');

describe('MovieModal Component & Explainable AI', () => {
  const sampleMovieWithExplanation = {
    id: 99,
    title: 'Interstellar (2014)',
    genre: 'Adventure|Drama|Sci-Fi',
    releaseYear: 2014,
    rating: 4.8,
    overview: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity survival.',
    explanation: {
      explanation: 'Shares core Sci-Fi and Adventure themes with Inception, and holds an 88% MovieLens positive community rating.',
      matched_genres: ['Sci-Fi', 'Adventure'],
      confidence: 'High',
      recommendation_method: '70% Content TF-IDF + 30% MovieLens Collaborative Hybrid',
      contributing_factors: [
        { factor: 'Genre Alignment', detail: 'Sci-Fi, Adventure' },
        { factor: 'Community Rating', detail: '4.8/5.0 average' },
      ],
    },
  };

  beforeEach(() => {
    auth.useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { username: 'testuser' },
    });
  });

  test('renders movie details correctly', () => {
    render(<MovieModal movie={sampleMovieWithExplanation} onClose={jest.fn()} />);

    expect(screen.getByText('Interstellar (2014)')).toBeInTheDocument();
    expect(screen.getByText(/A team of explorers/i)).toBeInTheDocument();
    expect(screen.getByText('2014')).toBeInTheDocument();
  });

  test('renders Explainable AI attribution section when explanation metadata is present', () => {
    render(<MovieModal movie={sampleMovieWithExplanation} onClose={jest.fn()} />);

    // Check Explainable AI badge / header
    expect(screen.getByText(/WHY RECOMMENDED FOR YOU/i)).toBeInTheDocument();
    expect(screen.getByText(/Shares core Sci-Fi and Adventure themes/i)).toBeInTheDocument();
    expect(screen.getByText(/High Confidence/i)).toBeInTheDocument();

    // Check matched genres
    expect(screen.getAllByText('Sci-Fi').length).toBeGreaterThan(0);
  expect(screen.getAllByText('Adventure').length).toBeGreaterThan(0);
  });

  test('calls onClose when close button is clicked', () => {
    const handleClose = jest.fn();
    render(<MovieModal movie={sampleMovieWithExplanation} onClose={handleClose} />);

    const closeBtn = screen.getByRole('button', { name: /✕|close/i });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalled();
  });
});
