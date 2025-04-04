import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { AudioManager } from '../components/AudioManager';
import { toast } from 'sonner-native';
import FAQModal from '../components/FAQModal';
import * as Haptics from 'expo-haptics';
import { Logo, BrandFooter, BrandColors } from '../components/Branding';
import SettingsScreen from '../components/SettingsScreen';
import { useAccessibility } from '../components/AccessibilityManager';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [showFAQModal, setShowFAQModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { config } = useAccessibility();
  
  useEffect(() => {
    // Welcome message on first navigation to home screen
    // Skip animation if reduce motion is enabled
    const welcomeDelay = config.isReduceMotionEnabled ? 0 : 300;
    
    setTimeout(() => {
      try {
        toast('Welcome to SoundMaster!', {
          description: 'Manage all audio sources on your device',
          icon: <MaterialIcons name="surround-sound" size={20} color="white" />
        });
      } catch (error) {
        console.error('Toast error:', error);
      }
    }, welcomeDelay);
  }, [config.isReduceMotionEnabled]);

  const openFAQModal = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      // Ignore haptic errors on devices without haptic support
    }
    setShowFAQModal(true);
  };
  
  const openSettings = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      // Ignore haptic errors
    }
    setShowSettings(true);
  };

  if (showSettings) {
    return <SettingsScreen onBack={() => setShowSettings(false)} />;
  }

  return (
    <SafeAreaView style={[
      styles.container, 
      config.highContrast && styles.highContrastContainer
    ]}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <Logo />
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={openSettings}
            activeOpacity={0.7}
            accessible={true}
            accessibilityLabel="Open settings"
            accessibilityRole="button"
          >
            <View style={styles.iconButtonInner}>
              <MaterialIcons name="settings" size={22} color="white" />
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={openFAQModal}
            activeOpacity={0.7}
            accessible={true}
            accessibilityLabel="Get help"
            accessibilityRole="button"
          >
            <View style={styles.iconButtonInner}>
              <MaterialIcons name="help-outline" size={22} color="white" />
            </View>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.content}>
        <AudioManager />
      </View>
      
      <BrandFooter />
      
      <FAQModal 
        visible={showFAQModal}
        onClose={() => setShowFAQModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandColors.background,
  },
  highContrastContainer: {
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  content: {
    flex: 1,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 4,
  },
  iconButtonInner: {
    backgroundColor: `${BrandColors.primary}33`,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: `${BrandColors.primary}66`,
  }
});