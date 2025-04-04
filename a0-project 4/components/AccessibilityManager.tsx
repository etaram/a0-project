import React, { createContext, useContext, useState, useEffect } from 'react';
import { AccessibilityInfo, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Accessibility configuration interface
interface AccessibilityConfig {
  isScreenReaderEnabled: boolean;
  isReduceMotionEnabled: boolean;
  isHighContrastEnabled: boolean;
  fontScale: number;
  reduceTransparency: boolean;
  highContrast: boolean;
}

// Default accessibility configuration
const defaultConfig: AccessibilityConfig = {
  isScreenReaderEnabled: false,
  isReduceMotionEnabled: false,
  isHighContrastEnabled: false,
  fontScale: 1,
  reduceTransparency: false,
  highContrast: false,
};

// Context for accessibility features
const AccessibilityContext = createContext<{
  config: AccessibilityConfig;
  updateConfig: (newConfig: Partial<AccessibilityConfig>) => void;
}>({
  config: defaultConfig,
  updateConfig: () => {},
});

// Custom hook to use accessibility context
export const useAccessibility = () => useContext(AccessibilityContext);

// Provider component
export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<AccessibilityConfig>(defaultConfig);

  // Load saved accessibility preferences
  const loadAccessibilityPreferences = async () => {
    try {
      const savedConfig = await AsyncStorage.getItem('accessibilityConfig');
      if (savedConfig) {
        setConfig(prev => ({ ...prev, ...JSON.parse(savedConfig) }));
      }
    } catch (error) {
      console.error('Error loading accessibility preferences:', error);
    }
  };

  // Save accessibility preferences
  const saveAccessibilityPreferences = async (newConfig: AccessibilityConfig) => {
    try {
      await AsyncStorage.setItem('accessibilityConfig', JSON.stringify(newConfig));
    } catch (error) {
      console.error('Error saving accessibility preferences:', error);
    }
  };

  // Update configuration
  const updateConfig = (newConfig: Partial<AccessibilityConfig>) => {
    setConfig(prev => {
      const updated = { ...prev, ...newConfig };
      saveAccessibilityPreferences(updated);
      return updated;
    });
  };

  // Update from system settings
  useEffect(() => {
    // Initial check
    const checkSystemSettings = async () => {
      const screenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
      const reduceMotionEnabled = await AccessibilityInfo.isReduceMotionEnabled();
      
      // Get system font scale (iOS and Android API 26+)
      const fontScale = await AccessibilityInfo.getRecommendedFontSizeMultiplier() || 1;

      updateConfig({
        isScreenReaderEnabled: screenReaderEnabled,
        isReduceMotionEnabled: reduceMotionEnabled,
        fontScale: fontScale > 0 ? fontScale : 1,
      });
    };

    checkSystemSettings();

    // Listen for changes
    const screenReaderListener = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      isScreenReaderEnabled => {
        updateConfig({ isScreenReaderEnabled });
      }
    );

    const reduceMotionListener = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      isReduceMotionEnabled => {
        updateConfig({ isReduceMotionEnabled });
      }
    );

    // Listen for app state changes to refresh settings
    const appStateSubscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        checkSystemSettings();
      }
    });

    return () => {
      screenReaderListener.remove();
      reduceMotionListener.remove();
      appStateSubscription.remove();
    };
  }, []);

  return (
    <AccessibilityContext.Provider value={{ config, updateConfig }}>
      {children}
    </AccessibilityContext.Provider>
  );
};

// Helper function to get accessible component props
export const getAccessibleProps = (label: string, hint?: string, role?: string) => {
  return {
    accessible: true,
    accessibilityLabel: label,
    accessibilityHint: hint,
    accessibilityRole: role as any,
  };
};