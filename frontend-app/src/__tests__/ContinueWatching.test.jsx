import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ContinueWatching from '../components/ContinueWatching';
import * as api from '../services/api';
import * as auth from '../context/AuthContext';

jest.mock('../services/api');
jest.mock('../context/AuthContext');

describe('ContinueWatching Component', () => {
  const mockItems = [
    {
      id: 1,
      filmId: 'bbb',
      filmTitle: 'Big Buck Bunny',
      positionSeconds: 150,
      durationSeconds: 600,
      progressPercentage: 25.0,
      completed: false,
      updatedAt: new Date().toISOString(),
    },
    {
      id: 2,
      filmId: 'sintel',
      filmTitle: 'Sintel',
      positionSeconds: 520,
      durationSeconds: 522,
      progressPercentage: 99.6,
      completed: true,
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    auth.useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { username: 'testuser' },
    });
    api.fetchPlaybackProgress.mockResolvedValue(mockItems);
  });

  test('renders in-progress and completed film cards with titles and progress bars', async () => {
    render(<ContinueWatching onPlayFilm={jest.fn()} onToast={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Big Buck Bunny')).toBeInTheDocument();
      expect(screen.getByText('Sintel')).toBeInTheDocument();
    });

    // Check timestamps and progress
    expect(screen.getByText('Resume from 02:30')).toBeInTheDocument();
    expect(screen.getByText(/COMPLETED/i)).toBeInTheDocument();
  });

  test('clicking resume triggers stream authorization and playback at saved position', async () => {
    const handlePlayFilm = jest.fn();
    api.authorizeLegalStream.mockResolvedValue({ filmId: 'bbb', playbackUrl: 'http://video.mp4' });

    render(<ContinueWatching onPlayFilm={handlePlayFilm} onToast={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Big Buck Bunny')).toBeInTheDocument();
    });

  const resumeBtn = screen.getByRole('button', {
  name: /Resume Watching/i,
});

fireEvent.click(resumeBtn);

    await waitFor(() => {
      expect(api.authorizeLegalStream).toHaveBeenCalledWith('bbb');
      expect(handlePlayFilm).toHaveBeenCalledWith(
        expect.objectContaining({
          filmId: 'bbb',
          initialPosition: 150,
        })
      );
    });
  });

  test('clicking start over plays from beginning (position 0)', async () => {
    const handlePlayFilm = jest.fn();
    api.authorizeLegalStream.mockResolvedValue({ filmId: 'bbb', playbackUrl: 'http://video.mp4' });

    render(<ContinueWatching onPlayFilm={handlePlayFilm} onToast={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Big Buck Bunny')).toBeInTheDocument();
    });

    const startOverBtns = screen.getAllByRole('button', {
  name: /Restart from beginning/i,
});

fireEvent.click(startOverBtns[0]);

    await waitFor(() => {
      expect(handlePlayFilm).toHaveBeenCalledWith(
        expect.objectContaining({
          initialPosition: 0,
        })
      );
    });
  });
});
