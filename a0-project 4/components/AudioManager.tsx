import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { AudioSourceCard } from './AudioSourceCard';
import { EmptyState } from './EmptyState';
import { NewAudioSourceModal } from './NewAudioSourceModal';
import { AudioSource, AudioOutput } from '../types';
import { requestAudioPermissions } from '../utils/permissions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { toast } from 'sonner-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAccessibility } from './AccessibilityManager';
import { useAnalytics } from './Analytics';

export const AudioManager = () => {
  const [audioSources, setAudioSources] = useState<AudioSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [newSource, setNewSource] = useState<AudioSource | null>(null);
  const [showNewSourceModal, setShowNewSourceModal] = useState(false);  const { config } = useAccessibility();
  const { trackAudioSource } = useAnalytics();  // Check for permissions on mount
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const hasExistingPermissions = await checkAudioPermissions();
        if (hasExistingPermissions) {
          setHasPermissions(true);
          return;
        }

        const result = await requestAudioPermissions();
        setHasPermissions(result);
        
        if (!result) {
          toast.error('Missing permissions', {
            description: 'Click the button below to grant permissions',
            icon: 'error',
            duration: 5000,
            action: {
              label: 'Grant Permissions',
              onClick: async () => {
                const granted = await requestAudioPermissions();
                setHasPermissions(granted);
              }
            }
          });
        }
      } catch (error) {
        console.error('Permission check failed:', error);
        setHasPermissions(false);
      }
    };
    
    checkPermissions();
  }, []);  const detectSources = useCallback(async () => {
    let pollingInterval = 15000; // Default 15 seconds
    
    try {
      // Try to get battery level for optimization
      const batteryLevel = await BatteryManager.getBatteryLevelAsync();
      const isCharging = await BatteryManager.isChargingAsync();
      
      // Adjust polling interval based on battery status
      if (batteryLevel < 0.15) { // Below 15%
        pollingInterval = 30000; // 30 seconds
      } else if (!isCharging) {
        pollingInterval = 20000; // 20 seconds
      }
    } catch (error) {
      console.log('Error in battery optimization:', error);
      // Fallback to default polling interval
    }
    try {
      if (!isLoading) setRefreshing(true);
      
      // Try to get cached sources first for instant UI display
      const cachedSources = await AsyncStorage.getItem('audioSources');
      if (cachedSources) {
        const parsedSources = JSON.parse(cachedSources);
        setAudioSources(parsedSources);
        if (!isLoading) setRefreshing(false);
      }
      
      // Mock data for testing - in real app, this would be actual detection
      const mockSources: AudioSource[] = [
        {
          id: '1',
          name: 'YouTube Music',
          isPlaying: true,
          volume: 0.8,
          output: 'speakers'
        },
        {
          id: '2',
          name: 'Chrome Browser',
          isPlaying: false,
          volume: 0.5,
          output: 'headphones'
        },
        {
          id: '3',
          name: 'Netflix',
          isPlaying: true,
          volume: 0.7,
          output: 'speakers'
        }
      ];
      
      // Check if we have a new audio source
      if (cachedSources) {
        const oldSources = JSON.parse(cachedSources);
        const newSourceItem = mockSources.find(src => 
          !oldSources.some((old: AudioSource) => old.id === src.id)
        );
        
        if (newSourceItem) {
          // Check if we should show the modal
          const dontShow = await AsyncStorage.getItem('dontShowNewSourceModal');
          if (dontShow !== 'true') {
            setNewSource(newSourceItem);
            setShowNewSourceModal(true);
          }
        }
      }
      
      setAudioSources(mockSources);
      
      // Cache the sources
      await AsyncStorage.setItem('audioSources', JSON.stringify(mockSources));
    } catch (error) {
      console.error('Error detecting audio sources:', error);
      toast.error('Error detecting audio sources', {
        icon: <MaterialIcons name="error" size={20} color="white" />
      });
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [isLoading]);

  useEffect(() => {
    if (hasPermissions) {
      detectSources();
    }
  }, [hasPermissions, detectSources]);

  // Handle volume changes with error handling
  const handleVolumeChange = useCallback((id: string, volume: number) => {    setAudioSources(prev => {
      trackAudioSource(id, 'volume_change', { volume });
      return prev.map(source =>
        source.id === id ? { ...source, volume } : source
      );
    });
    
    // In a production app, this would call the native module
    // Example:
    // try {
    //   await AudioControlModule.setVolume(id, volume);
    // } catch (error) {
    //   toast.error('Error changing volume');
    // }
  }, []);  const handleOutputChange = useCallback((
    id: string, 
    output: AudioOutput, 
    force: boolean = false,
    priority?: number
  ) => {
    // Check if there's already an active source using this output
    const existingSource = audioSources.find(
      source => source.output === output && source.isPlaying && source.id !== id
    );

    if (existingSource) {
      if (!force) {
        // Show warning toast with options
        toast.custom((t) => (
          <View style={styles.forceToast}>
            <Text style={styles.forceToastText}>
              {existingSource.name} is already playing through this output
            </Text>
            <View style={styles.forceActions}>
              <TouchableOpacity 
                style={[styles.forceButton, styles.forceButtonPriority]}
                onPress={() => {
                  handleOutputChange(id, output, true, 2); // High priority
                  toast.dismiss(t);
                }}
              >
                <MaterialIcons name="priority-high" size={16} color="white" />
                <Text style={styles.forceButtonText}>Set High Priority</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.forceButton}
                onPress={() => {
                  handleOutputChange(id, output, true);
                  toast.dismiss(t);
                }}
              >
                <MaterialIcons name="swap-horiz" size={16} color="white" />
                <Text style={styles.forceButtonText}>Force Change</Text>
              </TouchableOpacity>
            </View>
          </View>
        ));
        
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        } catch (error) {
          // Ignore haptic errors
        }
        
        return;
      }

      // Handle based on priority
      if (priority && existingSource.priority && priority <= existingSource.priority) {
        toast.error('Cannot override higher priority source', {
          description: `${existingSource.name} has higher priority`,
          icon: <MaterialIcons name="priority-high" size={20} color="white" />
        });
        return;
      }

      // Stop the existing source if forcing or has higher priority
      handlePlayPause(existingSource.id);
    }

    setAudioSources(prev =>
      prev.map(source =>
        source.id === id ? { ...source, output, priority: priority || 1 } : source
      )
    );
    
    // Save state
    AsyncStorage.setItem('audioSources', JSON.stringify(
      audioSources.map(source => 
        source.id === id ? { ...source, output, priority: priority || 1 } : source
      )
    )).catch(error => console.error('Error saving state:', error));
    
    // Show success toast with priority indication
    toast.success(
      priority ? `Output changed (Priority ${priority})` : 'Output changed',
      {
        icon: <MaterialIcons 
          name={output === 'speakers' ? 'speaker' : output === 'headphones' ? 'headset' : 'bluetooth-audio'} 
          size={20} 
          color="white" 
        />
      }
    );

    trackAudioSource(id, 'output_change', { output, priority });
  }, [audioSources, handlePlayPause, trackAudioSource]);  // Handle play/pause with error handling
  const handlePlayPause = useCallback((id: string) => {
    const sourceToToggle = audioSources.find(s => s.id === id);
    
    if (!sourceToToggle) return;
    
    // If trying to play, check if output is in use
    if (!sourceToToggle.isPlaying) {
      const existingSource = audioSources.find(
        source => source.output === sourceToToggle.output && source.isPlaying && source.id !== id
      );

      if (existingSource) {
        toast.error('Output in use', {
          description: `${existingSource.name} is already playing through ${sourceToToggle.output}`,
          icon: <MaterialIcons name="error" size={20} color="white" />
        });
        
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } catch (error) {
          // Ignore haptic errors
        }
        
        return;
      }
    }

    setAudioSources(prev => {
      const source = prev.find(s => s.id === id);
      if (source) {
        trackAudioSource(id, source.isPlaying ? 'pause' : 'play');
      }
      return prev.map(source =>
        source.id === id ? { ...source, isPlaying: !source.isPlaying } : source
      );
    });
    
    // Save state to AsyncStorage
    AsyncStorage.setItem('audioSources', JSON.stringify(
      audioSources.map(source => 
        source.id === id ? { ...source, isPlaying: !source.isPlaying } : source
      )
    )).catch(error => console.error('Error saving state:', error));
    
    // In a production app, this would call the native module
  }, [audioSources, trackAudioSource]);

  // Handle the modal dismiss
  const handleModalDismiss = useCallback(() => {
    setShowNewSourceModal(false);
  }, []);

  // Handle managing the new source
  const handleManageSource = useCallback(() => {
    setShowNewSourceModal(false);
    // Scroll to the new source (in real app)
    // Highlight the new source
  }, []);

  // Handle pull-to-refresh
  const onRefresh = useCallback(() => {
    if (hasPermissions) {
      detectSources();
    }
  }, [hasPermissions, detectSources]);

  if (!hasPermissions) {
    return <EmptyState message="Permissions required to detect audio sources" />;
  }

  if (isLoading && audioSources.length === 0) {
    return <EmptyState message="Detecting audio sources..." isLoading={true} />;
  }

  if (audioSources.length === 0) {
    return <EmptyState message="No active audio sources found" />;
  }

  return (
    <View style={[
      styles.container, 
      config.highContrast && styles.highContrastContainer
    ]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={config.highContrast ? "#FFFFFF" : "#4CAF50"}
            colors={[config.highContrast ? "#FFFFFF" : "#4CAF50"]}
          />
        }
        accessible={true}
        accessibilityLabel="Audio sources list"
        accessibilityHint="Pull down to refresh the list"
      >
        {audioSources.map(source => (
          <AudioSourceCard
            key={source.id}
            source={source}
            onVolumeChange={handleVolumeChange}
            onOutputChange={handleOutputChange}
            onPlayPause={handlePlayPause}
          />
        ))}
      </ScrollView>
      
      <NewAudioSourceModal
        visible={showNewSourceModal}
        source={newSource}
        onDismiss={handleModalDismiss}
        onManageSource={handleManageSource}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#161616',
  },
  highContrastContainer: {
    backgroundColor: '#000000',
  },
  scrollContent: {
    padding: 8,
  },
  forceToast: {
    backgroundColor: '#333',
    padding: 16,
    borderRadius: 8,
  },
  forceToastText: {
    color: 'white',
    marginBottom: 12,
  },
  forceActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  forceButton: {
    backgroundColor: '#E53935',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  forceButtonPriority: {
    backgroundColor: '#FF9800',
  },
  forceButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  outputIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  outputIndicatorText: {
    color: 'white',
    marginLeft: 4,
    fontSize: 12,
  },
  priorityBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF9800',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priorityText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});