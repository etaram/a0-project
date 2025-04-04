import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { toast } from 'sonner-native';
import { AudioSource } from '../types';
import * as Haptics from 'expo-haptics';
import { useAccessibility } from './AccessibilityManager';
import Animated, { 
  useAnimatedStyle, 
  withSpring, 
  useSharedValue,
  withTiming,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';

interface Props {
  source: AudioSource & { priority?: number };
  onVolumeChange: (id: string, volume: number) => void;
  onPlayPause: (id: string) => void;
  onOutputChange: (id: string, output: 'speakers' | 'headphones' | 'bluetooth', force?: boolean, priority?: number) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const AudioSourceCard: React.FC<Props> = ({ 
  source,
  onVolumeChange,
  onPlayPause,
  onOutputChange
}) => {
  const { config } = useAccessibility();  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const elevation = useSharedValue(1);

  // Animation values for statistics
  const statsHeight = useSharedValue(0);
  const statsOpacity = useSharedValue(0);
  const [showStats, setShowStats] = useState(false);

  const cardStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { rotate: `${rotation.value}deg` }
      ],
      elevation: elevation.value
    };
  });  const statsStyle = useAnimatedStyle(() => {
    return {
      height: statsHeight.value,
      opacity: statsOpacity.value,
      overflow: 'hidden'
    };
  });

  
  // Function to handle volume changes with haptic feedback and toast messages
  const handleVolumeChange = (value: number) => {
    // Update state immediately for better UX
    onVolumeChange(source.id, value);
    
    // Provide haptic feedback if enabled
    if (Math.abs(value - source.volume) > 0.1) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (error) {
        // Ignore haptic errors on devices without haptic support
      }
    }    
    // Show toast messages for important volume changes
    if (value === 0) {
      toast('Audio muted', {
        icon: <MaterialIcons name="volume-mute" size={20} color="white" />
      });
    } else if (value > 0.8 && source.volume <= 0.8) {
      toast('Warning - High volume!', {
        icon: <MaterialIcons name="volume-up" size={20} color="white" />
      });
    }
  };  // Handle play/pause with haptic feedback
  const handlePlayPause = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      // Ignore haptic errors
    }
    onPlayPause(source.id);
  };

  // Handle output change with haptic feedback and toast
  const handleOutputChange = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      // Ignore haptic errors
    }    
    // Determine the next output in the cycle: speakers -> headphones -> bluetooth -> speakers
    let nextOutput: 'speakers' | 'headphones' | 'bluetooth' = 'speakers';
    
    if (source.output === 'speakers') {
      nextOutput = 'headphones';
    } else if (source.output === 'headphones') {
      nextOutput = 'bluetooth';
    }
    
    onOutputChange(source.id, nextOutput);
    
    // Show toast with the new output device
    const outputName = 
      nextOutput === 'speakers' ? 'Speakers' : 
      nextOutput === 'headphones' ? 'Headphones' : 'Bluetooth';
      
    toast(`Routing audio to: ${outputName}`, {
      icon: <MaterialIcons 
        name={
          nextOutput === 'speakers' ? 'speaker' : 
          nextOutput === 'headphones' ? 'headset' : 'bluetooth-audio'
        } 
        size={20} 
        color="white" 
      />
    });
  };  // Get the appropriate icon for the current output
  const getOutputIcon = () => {
    switch (source.output) {
      case 'speakers':
        return 'speaker';
      case 'headphones':
        return 'headset';
      case 'bluetooth':
        return 'bluetooth-audio';
      default:
        return 'speaker';
    }
  };  // Get output name
  const getOutputName = () => {
    switch (source.output) {
      case 'speakers':
        return 'Speakers';
      case 'headphones':
        return 'Headphones';
      case 'bluetooth':
        return 'Bluetooth';
      default:
        return source.output;
    }
  };  // Apply high contrast if enabled in accessibility settings
  const getHighContrastStyles = () => {
    if (config.highContrast) {
      return {
        card: {
          backgroundColor: '#000000',
          borderColor: '#FFFFFF',
          borderLeftColor: '#FFFFFF',
        },
        text: {
          color: '#FFFFFF',
        },
        outputButton: {
          backgroundColor: '#000000',
          borderWidth: 1,
          borderColor: '#FFFFFF',
        },
        playButton: {
          backgroundColor: source.isPlaying ? '#FF0000' : '#00FF00',
        }
      };
    }
    return {};
  };  const highContrastStyles = getHighContrastStyles();
  
  const onPressIn = () => {
    scale.value = withSpring(0.98);
    elevation.value = withSpring(3);
  };

  const onPressOut = () => {
    scale.value = withSpring(1);
    elevation.value = withSpring(1);
  };

  const toggleStats = () => {
    setShowStats(!showStats);
    statsHeight.value = withSpring(showStats ? 0 : 100);
    statsOpacity.value = withTiming(showStats ? 0 : 1);
    rotation.value = withSpring(showStats ? 0 : 180);
  };

  // Get formatted time
  const getTimeString = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };  return (
    <AnimatedPressable 
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={[styles.cardContainer, cardStyle]}
      accessible={true}
      accessibilityLabel={`Audio source ${source.name}, ${source.isPlaying ? 'playing' : 'paused'}, volume ${Math.round(source.volume * 100)}%, output ${getOutputName()}`}
      accessibilityRole="adjustable"
    >
      <View style={styles.cardContent}>        <View style={styles.header}>
          <View style={styles.sourceInfo}>
            {source.appIcon ? (
              <Image source={{ uri: source.appIcon }} style={styles.appIcon} />
            ) : (
              <View style={styles.iconPlaceholder}>
                <MaterialIcons name="music-note" size={24} color="#FFF" />
              </View>
            )}
            <View style={styles.textContainer}>
              <Text style={[styles.name, highContrastStyles.text]}>{source.name}</Text>
              <Text style={styles.timestamp}>{getTimeString()}</Text>
            </View>
          </View>
          <Pressable 
            onPress={handleOutputChange}
            style={[styles.outputButton, highContrastStyles.outputButton]}
            android_ripple={{ color: '#666', borderless: false, radius: 20 }}
            accessible={true}
            accessibilityLabel={`Change output, current: ${getOutputName()}`}
            accessibilityRole="button"
          >            <Text style={[styles.outputText, highContrastStyles.text]}>{getOutputName()}</Text>
            <MaterialIcons 
              name={getOutputIcon()} 
              size={24} 
              color={config.highContrast ? '#FFFFFF' : '#FFF'} 
            />
          </Pressable>
        </View>        
        <View style={styles.controls}>
          <Pressable 
            onPress={handlePlayPause}
            style={[
              styles.playButton,
              source.isPlaying ? styles.playButtonActive : null,
              highContrastStyles.playButton
            ]}
            android_ripple={{ color: '#ffffff33', borderless: false, radius: 26 }}
            accessible={true}
            accessibilityLabel={source.isPlaying ? 'Pause audio' : 'Play audio'}
            accessibilityRole="button"
            accessibilityState={{ checked: source.isPlaying }}
          >            <MaterialIcons 
              name={source.isPlaying ? "pause" : "play-arrow"} 
              size={32} 
              color={config.highContrast ? '#000000' : '#FFF'} 
            />
          </Pressable>          
          <View 
            style={styles.volumeControl}
            accessible={true}
            accessibilityLabel={`Volume control, current value ${Math.round(source.volume * 100)}%`}
          >            <MaterialIcons 
              name={source.volume === 0 ? "volume-mute" : 
                    source.volume < 0.3 ? "volume-down" : "volume-up"} 
              size={24} 
              color={config.highContrast ? '#FFFFFF' : '#FFF'} 
            />
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              value={source.volume}
              onValueChange={handleVolumeChange}
              minimumTrackTintColor={config.highContrast ? '#FFFFFF' : "#4CAF50"}
              maximumTrackTintColor={config.highContrast ? '#777777' : "#4F4F4F"}
              thumbTintColor={config.highContrast ? '#FFFFFF' : "#4CAF50"}
              accessibilityRole="adjustable"
              accessibilityValue={{ min: 0, max: 100, now: Math.round(source.volume * 100) }}
            />            <Text style={[styles.volumeText, highContrastStyles.text]}>
              {Math.round(source.volume * 100)}%
            </Text>
          </View>
        </View>
      </View>      <Animated.View style={[styles.stats, statsStyle]}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <MaterialIcons name="schedule" size={16} color="#999" />
            <Text style={styles.statText}>Active: 2h 30m</Text>
          </View>
          <View style={styles.statItem}>
            <MaterialIcons name="equalizer" size={16} color="#999" />
            <Text style={styles.statText}>Avg Vol: {Math.round(source.volume * 100)}%</Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <MaterialIcons name="swap-horiz" size={16} color="#999" />
            <Text style={styles.statText}>Switches: 5</Text>
          </View>
          <View style={styles.statItem}>
            <MaterialIcons name="speed" size={16} color="#999" />
            <Text style={styles.statText}>Priority: High</Text>
          </View>
        </View>
      </Animated.View>
    </AnimatedPressable>
  );
};const styles = StyleSheet.create({
  cardContainer: {
    margin: 8,
    borderRadius: 16,
    backgroundColor: '#2A2A2A',
    overflow: 'hidden',
  },
  card: {
    padding: 20,
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#3C3C3C',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  cardContent: {
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },  sourceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  appIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  iconPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  outputButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#404040',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
  },
  outputText: {
    color: '#FFFFFF',
  },  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  playButton: {
    backgroundColor: '#4CAF50',
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonActive: {
    backgroundColor: '#ff5252',
  },
  volumeControl: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  volumeText: {
    color: '#FFFFFF',
    minWidth: 40,
    textAlign: 'right',
  },
  stats: {
    marginTop: 12,
    backgroundColor: '#222',
    borderRadius: 8,
    padding: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    color: '#999',
    fontSize: 12,
  },
});