export interface AudioSource {
  id: string;
  name: string;
  isPlaying: boolean;
  volume: number;
  output: 'speakers' | 'headphones' | 'bluetooth';
  packageName?: string;
  appIcon?: string;
}

export type AudioOutput = 'speakers' | 'headphones' | 'bluetooth';