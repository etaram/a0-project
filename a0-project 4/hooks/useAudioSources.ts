import { useState, useEffect } from 'react';

interface AudioSource {
  id: string;
  name: string;
  volume: number;
  isPlaying: boolean;
  output: string;
}

export const useAudioSources = () => {
  const [audioSources, setAudioSources] = useState<AudioSource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading audio sources
    const timer = setTimeout(() => {
      setAudioSources([
        {
          id: '1',
          name: 'Spotify',
          volume: 0.8,
          isPlaying: true,
          output: 'Speakers'
        },
        {
          id: '2',
          name: 'Chrome',
          volume: 0.5,
          isPlaying: false,
          output: 'Headphones'
        }
      ]);
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return { audioSources, loading };
};