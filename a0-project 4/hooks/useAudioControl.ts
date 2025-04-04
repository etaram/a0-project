import { useEffect, useState } from 'react';
import { NativeEventEmitter, NativeModules } from 'react-native';

const { AudioControl } = NativeModules;

export interface AudioSource {
  id: string;
  name: string;
  isPlaying: boolean;
  volume: number;
  output: 'speaker' | 'headphone' | 'bluetooth';
}

export const useAudioControl = () => {
  const [audioSources, setAudioSources] = useState<AudioSource[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const eventEmitter = new NativeEventEmitter(AudioControl);
    
    const subscription = eventEmitter.addListener(
      'onNewAudioSourcesDetected',
      (newSources: AudioSource[]) => {
        setAudioSources(current => {
          const updated = [...current];
          newSources.forEach(source => {
            if (!updated.find(s => s.id === source.id)) {
              updated.push({
                ...source,
                volume: 1,
                output: 'speaker'
              });
            }
          });
          return updated;
        });
      }
    );

    return () => {
      subscription.remove();
    };
  }, []);

  const setVolume = async (sourceId: string, volume: number) => {
    try {
      await AudioControl.setVolume(sourceId, volume);
      setAudioSources(current =>
        current.map(source =>
          source.id === sourceId
            ? { ...source, volume }
            : source
        )
      );
    } catch (err) {
      setError('Failed to set volume');
    }
  };

  const routeAudio = async (sourceId: string, output: AudioSource['output']) => {
    try {
      await AudioControl.routeAudio(sourceId, output);
      setAudioSources(current =>
        current.map(source =>
          source.id === sourceId
            ? { ...source, output }
            : source
        )
      );
    } catch (err) {
      setError('Failed to route audio');
    }
  };

  const togglePlayback = async (sourceId: string) => {
    try {
      await AudioControl.playPause(sourceId);
      setAudioSources(current =>
        current.map(source =>
          source.id === sourceId
            ? { ...source, isPlaying: !source.isPlaying }
            : source
        )
      );
    } catch (err) {
      setError('Failed to toggle playback');
    }
  };

  return {
    audioSources,
    error,
    setVolume,
    routeAudio,
    togglePlayback
  };
};