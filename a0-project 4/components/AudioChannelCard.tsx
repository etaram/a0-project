import React from 'react';
import { View, StyleSheet, Text, Pressable } from 'react-native';
import { Slider } from '@rneui/themed';
import { MaterialIcons } from '@expo/vector-icons';

interface AudioChannelCardProps {
  title: string;
  subtitle: string;
  volume: number;
  onVolumeChange: (value: number) => void;
  isActive: boolean;
  onToggle: () => void;
  icon: keyof typeof MaterialIcons.glyphMap;
}

export default function AudioChannelCard({
  title,
  subtitle,
  volume,
  onVolumeChange,
  isActive,
  onToggle,
  icon,
}: AudioChannelCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <MaterialIcons name={icon} size={24} color="white" />
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        <Pressable onPress={onToggle}>
          <MaterialIcons 
            name={isActive ? "stop-circle" : "play-circle-fill"} 
            size={32} 
            color={isActive ? "#ff4d4d" : "#4CAF50"} 
          />
        </Pressable>
      </View>
      
      <View style={styles.volumeContainer}>
        <MaterialIcons 
          name={volume === 0 ? "volume-mute" : volume < 0.3 ? "volume-down" : "volume-up"} 
          size={24} 
          color="white" 
        />
        <Slider
          value={volume}
          onValueChange={onVolumeChange}
          minimumValue={0}
          maximumValue={1}
          step={0.01}
          style={styles.slider}
          thumbStyle={styles.thumb}
          thumbTintColor="#4CAF50"
          minimumTrackTintColor="#4CAF50"
          maximumTrackTintColor="#ffffff33"
        />
        <Text style={styles.volumeText}>{Math.round(volume * 100)}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#2c2c2c',
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 2,
  },
  volumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  thumb: {
    width: 20,
    height: 20,
  },
  volumeText: {
    color: 'white',
    fontSize: 14,
    minWidth: 45,
  },
});