import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import RatingStars from './components/RatingStars';
import SkeletonCard from './components/SkeletonCard';
import Toast from './components/Toast';

describe('RatingStars Component', () => {
  test('renders 5 stars with correct aria label', () => {
    render(<RatingStars rating={4} maxStars={5} />);
    const starContainer = screen.getByRole('img');
    expect(starContainer).toBeInTheDocument();
    expect(starContainer).toHaveAttribute('aria-label', 'Rating: 4 out of 5 stars');
  });

  test('interactive mode triggers onChange on star click', () => {
    const handleChange = jest.fn();
    render(<RatingStars rating={3} interactive={true} onChange={handleChange} />);
    const fourStarBtn = screen.getByLabelText('4 Star');
    expect(fourStarBtn).toBeInTheDocument();
    fireEvent.click(fourStarBtn);
    expect(handleChange).toHaveBeenCalledWith(4);
  });

  test('shows label text when showLabel is true', () => {
    render(<RatingStars rating={5} showLabel={true} />);
    expect(screen.getByText(/5 Stars — Masterpiece/i)).toBeInTheDocument();
  });
});

describe('SkeletonCard Component', () => {
  test('renders loading skeleton card placeholders', () => {
    const { container } = render(<SkeletonCard />);
    const shimmer = container.querySelector('.skeleton-shimmer');
expect(shimmer).toBeInTheDocument();
  });
});

describe('Toast Component', () => {
  test('renders toast notification with message and dismiss button', () => {
    const handleClose = jest.fn();
   render(
  <Toast
    toast={{
      message: 'Film added to Watchlist!',
      type: 'success',
    }}
    onClose={handleClose}
  />
);
    expect(screen.getByText('Film added to Watchlist!')).toBeInTheDocument();
    const closeBtn = screen.getByLabelText(/close notification/i);
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalled();
  });
});
