import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, StyleSheet, Pressable, Animated, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AudioSource } from '../types';
import * as Haptics from 'expo-haptics';
import { useAccessibility } from './AccessibilityManager';
import { BrandColors } from './Branding';

interface Props {
  source: AudioSource | null;
  visible: boolean;
  onDismiss: () => void;
  onManageSource: () => void;
}

export const NewAudioSourceModal: React.FC<Props> = ({
  source,
  visible,
  onDismiss,
  onManageSource
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const [dontShowAgain, setDontShowAgain] = React.useState(false);
  const { config } = useAccessibility();

  // Animate modal in when visible changes
  useEffect(() => {
    if (visible) {
      // Play haptic feedback when modal appears
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (error) {
        // Ignore haptic errors
      }
      
      // Start animations if reduce motion is not enabled
      if (!config.isReduceMotionEnabled) {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          })
        ]).start();
      } else {
        // Just show the modal without animations
        fadeAnim.setValue(1);
        scaleAnim.setValue(1);
      }
    }
  }, [visible, fadeAnim, scaleAnim, config.isReduceMotionEnabled]);

  // Handle dismissing the modal
  const handleDismiss = async () => {
    // Save preference if user checked "don't show again"
    if (dontShowAgain) {
      try {
        await AsyncStorage.setItem('dontShowNewSourceModal', 'true');
      } catch (error) {
        console.error('Error saving preference:', error);
      }
    }
    
    // Play light haptic feedback
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      // Ignore haptic errors
    }
    
    // Animate out if reduce motion is not enabled
    if (!config.isReduceMotionEnabled) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start(() => onDismiss());
    } else {
      // Just hide the modal without animations
      onDismiss();
    }
  };

  // Handle manage source button
  const handleManageSource = () => {
    // Play medium haptic feedback
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      // Ignore haptic errors
    }
    
    // Animate out if reduce motion is not enabled
    if (!config.isReduceMotionEnabled) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start(() => onManageSource());
    } else {
      // Just call the manage function without animations
      onManageSource();
    }
  };

  // Toggle don't show again
  const toggleDontShowAgain = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      // Ignore haptic errors
    }
    setDontShowAgain(!dontShowAgain);
  };

  if (!source) return null;

  // Get appropriate icon based on source name
  const getSourceIcon = () => {
    const name = source.name.toLowerCase();
    
    if (name.includes('spotify')) return 'music-note';
    if (name.includes('youtube')) return 'smart-display';
    if (name.includes('netflix') || name.includes('movie')) return 'movie';
    if (name.includes('chrome') || name.includes('firefox') || name.includes('browser')) return 'public';
    if (name.includes('zoom') || name.includes('teams') || name.includes('meet')) return 'videocam';
    if (name.includes('game')) return 'sports-esports';
    
    return 'play-circle-outline';
  };

  // Apply high contrast if enabled in accessibility settings
  const getHighContrastStyles = () => {
    if (config.highContrast) {
      return {
        modalView: {
          backgroundColor: '#000000',
          borderColor: '#FFFFFF',
        },
        text: {
          color: '#FFFFFF',
        },
        iconContainer: {
          backgroundColor: '#FFFFFF',
        },
        iconColor: '#000000',
        sourceName: {
          color: '#FFFFFF',
        },
        checkbox: {
          color: '#FFFFFF',
        },
        buttonManage: {
          backgroundColor: '#FFFFFF',
        },
        buttonManageText: {
          color: '#000000',
        },
        buttonDismiss: {
          backgroundColor: '#666666',
          borderColor: '#FFFFFF',
        },
        buttonDismissText: {
          color: '#FFFFFF',
        },
      };
    }
    return {};
  };

  const highContrastStyles = getHighContrastStyles();

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={visible}
      statusBarTranslucent={true}
      onRequestClose={handleDismiss}
    >
      <Animated.View 
        style={[
          styles.centeredView,
          {
            opacity: fadeAnim,
          }
        ]}
      >
        <Animated.View 
          style={[
            styles.modalView,
            highContrastStyles.modalView,
            {
              transform: [{ scale: scaleAnim }]
            }
          ]}
          accessible={true}
          accessibilityLabel="New audio source detected"
          accessibilityRole="alert"
        >
          <View style={styles.header}>
            <View style={[styles.iconContainer, highContrastStyles.iconContainer]}>
              <MaterialIcons 
                name={getSourceIcon()} 
                size={32} 
                color={highContrastStyles.iconColor || "white"} 
              />
            </View>
            <Text style={[styles.title, highContrastStyles.text]}>New Audio Source Detected!</Text>
          </View>
          
          <View style={styles.content}>
            <Text 
              style={[styles.sourceName, highContrastStyles.sourceName]}
              accessible={true}
              accessibilityLabel={`Source name: ${source.name}`}
            >
              {source.name}
            </Text>
            <Text 
              style={[styles.description, highContrastStyles.text]}
              accessible={true}
              accessibilityLabel="Would you like to manage control of this source?"
            >
              Would you like to manage control of this source?
            </Text>
          </View>

          <Pressable
            style={styles.checkboxContainer}
            onPress={toggleDontShowAgain}
            android_ripple={{ color: '#ffffff33', borderless: false, radius: 20 }}
            accessible={true}
            accessibilityLabel={`Don't show again, ${dontShowAgain ? 'checked' : 'unchecked'}`}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: dontShowAgain }}
          >
            <MaterialIcons
              name={dontShowAgain ? "check-box" : "check-box-outline-blank"}
              size={24}
              color={highContrastStyles.checkbox?.color || BrandColors.primary}
            />
            <Text style={[styles.checkboxText, highContrastStyles.text]}>Don't show again</Text>
          </Pressable>

          <View style={styles.actions}>
            <Pressable
              style={[styles.button, styles.buttonManage, highContrastStyles.buttonManage]}
              onPress={handleManageSource}
              android_ripple={{ color: '#ffffff33', borderless: false, radius: 20 }}
              accessible={true}
              accessibilityLabel="Manage Source"
              accessibilityRole="button"
            >
              <Text style={[styles.buttonText, highContrastStyles.buttonManageText]}>Manage Source</Text>
              <MaterialIcons 
                name="settings" 
                size={20} 
                color={highContrastStyles.buttonManageText?.color || "#FFFFFF"} 
              />
            </Pressable>
            
            <Pressable
              style={[styles.button, styles.buttonDismiss, highContrastStyles.buttonDismiss]}
              onPress={handleDismiss}
              android_ripple={{ color: '#333333', borderless: false, radius: 20 }}
              accessible={true}
              accessibilityLabel="Close"
              accessibilityRole="button"
            >
              <Text style={[
                styles.buttonText, 
                styles.buttonTextDismiss, 
                highContrastStyles.buttonDismissText
              ]}>Close</Text>
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const { width } = Dimensions.get('window');
const modalWidth = width * 0.85;

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalView: {
    width: modalWidth,
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10
    },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 24,
    borderWidth: 1,
    borderColor: '#333',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  content: {
    marginBottom: 24,
  },
  sourceName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
    lineHeight: 22,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  checkboxText: {
    color: '#FFFFFF',
    opacity: 0.8,
    fontSize: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    minWidth: 120,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  buttonManage: {
    backgroundColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
  },
  buttonDismiss: {
    backgroundColor: 'rgba(80,80,80,0.3)',
    borderWidth: 1,
    borderColor: '#555',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextDismiss: {
    color: '#AAA',
  },
});