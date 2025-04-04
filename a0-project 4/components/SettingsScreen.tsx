import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Switch, 
  TouchableOpacity, 
  Platform,
  Linking,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { BrandColors, useTheme } from './Branding';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAccessibility } from './AccessibilityManager';
import { toast } from 'sonner-native';

interface SettingsProps {
  onBack: () => void;
}

const SettingsScreen: React.FC<SettingsProps> = ({ onBack }) => {
  const { config, updateConfig } = useAccessibility();
  const [settings, setSettings] = useState({
    autoDetectSources: true,
    notifications: true,
    hapticFeedback: true,
    backgroundRefresh: true,
    dataCollection: false,
    autoManageNewSources: false,
    reduceMotion: config.isReduceMotionEnabled,
    highContrast: config.highContrast,
  });

  // Load settings from storage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await AsyncStorage.getItem('userSettings');
        if (savedSettings) {
          setSettings(prev => ({ ...prev, ...JSON.parse(savedSettings) }));
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
    
    loadSettings();
  }, []);

  // Save settings to storage when they change
  const updateSetting = async (key: string, value: boolean) => {
    try {
      Haptics.selectionAsync();
      
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      
      await AsyncStorage.setItem('userSettings', JSON.stringify(newSettings));
      
      // Update accessibility configuration if needed
      if (key === 'reduceMotion') {
        updateConfig({ isReduceMotionEnabled: value });
      } else if (key === 'highContrast') {
        updateConfig({ highContrast: value });
      }
      
      // Show confirmation toast
      toast.success('Setting updated', {
        icon: <MaterialIcons name="check-circle" size={20} color="white" />,
      });
    } catch (error) {
      console.error('Error saving setting:', error);
      toast.error('Failed to save setting', {
        icon: <MaterialIcons name="error" size={20} color="white" />,
      });
    }
  };

  const resetAllSettings = async () => {
    Alert.alert(
      'Reset All Settings',
      'Are you sure you want to reset all settings to their default values?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          onPress: async () => {
            try {
              // Default settings
              const defaultSettings = {
                autoDetectSources: true,
                notifications: true,
                hapticFeedback: true,
                backgroundRefresh: true,
                dataCollection: false,
                autoManageNewSources: false,
                reduceMotion: false,
                highContrast: false,
              };
              
              setSettings(defaultSettings);
              await AsyncStorage.setItem('userSettings', JSON.stringify(defaultSettings));
              
              // Update accessibility config
              updateConfig({
                isReduceMotionEnabled: false,
                highContrast: false,
              });
              
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              toast.success('Settings reset successfully', {
                icon: <MaterialIcons name="refresh" size={20} color="white" />,
              });
            } catch (error) {
              console.error('Error resetting settings:', error);
              toast.error('Failed to reset settings', {
                icon: <MaterialIcons name="error" size={20} color="white" />,
              });
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={onBack}
          style={styles.backButton}
          accessible={true}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.rightPlaceholder} />
      </View>

      <ScrollView style={styles.content}>
        <SectionHeader title="General" icon="settings" />
        
        <SettingItem
          title="Auto-detect audio sources"
          description="Automatically detect new audio sources"
          value={settings.autoDetectSources}
          onChange={(value) => updateSetting('autoDetectSources', value)}
        />
        
        <SettingItem
          title="Notifications"
          description="Show notifications for new audio sources"
          value={settings.notifications}
          onChange={(value) => updateSetting('notifications', value)}
        />
        
        <SettingItem
          title="Haptic feedback"
          description="Play haptic feedback when interacting with controls"
          value={settings.hapticFeedback}
          onChange={(value) => updateSetting('hapticFeedback', value)}
        />
        
        <SettingItem
          title="Background refresh"
          description="Allow the app to refresh audio sources in the background"
          value={settings.backgroundRefresh}
          onChange={(value) => updateSetting('backgroundRefresh', value)}
        />

        <SectionHeader title="Accessibility" icon="accessibility" />
        
        <SettingItem
          title="Reduce motion"
          description="Minimize animations throughout the app"
          value={settings.reduceMotion}
          onChange={(value) => updateSetting('reduceMotion', value)}
        />
        
        <SettingItem
          title="High contrast"
          description="Increase contrast for better visibility"
          value={settings.highContrast}
          onChange={(value) => updateSetting('highContrast', value)}
        />

        <SectionHeader title="Privacy" icon="security" />
        
        <SettingItem
          title="Anonymous data collection"
          description="Help improve the app by sending anonymous usage data"
          value={settings.dataCollection}
          onChange={(value) => updateSetting('dataCollection', value)}
        />
        
        <SectionHeader title="Advanced" icon="code" />
        
        <SettingItem
          title="Auto-manage new sources"
          description="Automatically take control of new audio sources"
          value={settings.autoManageNewSources}
          onChange={(value) => updateSetting('autoManageNewSources', value)}
        />

        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={styles.resetButton}
            onPress={resetAllSettings}
            accessible={true}
            accessibilityLabel="Reset all settings"
            accessibilityRole="button"
          >
            <MaterialIcons name="refresh" size={20} color="white" />
            <Text style={styles.buttonText}>Reset All Settings</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.helpButton}
            onPress={() => Linking.openURL('https://soundmaster-app.com/help')}
            accessible={true}
            accessibilityLabel="Get help"
            accessibilityRole="button"
          >
            <MaterialIcons name="help-outline" size={20} color="white" />
            <Text style={styles.buttonText}>Help</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

interface SectionHeaderProps {
  title: string;
  icon: keyof typeof MaterialIcons.glyphMap;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, icon }) => (
  <View style={styles.sectionHeader}>
    <MaterialIcons name={icon} size={22} color={BrandColors.primary} />
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

interface SettingItemProps {
  title: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

const SettingItem: React.FC<SettingItemProps> = ({ 
  title, 
  description, 
  value, 
  onChange 
}) => (
  <View 
    style={styles.settingItem}
    accessible={true}
    accessibilityLabel={`${title}, ${description}, ${value ? 'enabled' : 'disabled'}`}
    accessibilityRole="switch"
    accessibilityState={{ checked: value }}
  >
    <View style={styles.settingInfo}>
      <Text style={styles.settingTitle}>{title}</Text>
      <Text style={styles.settingDescription}>{description}</Text>
    </View>
    <Switch
      trackColor={{ false: '#3e3e3e', true: `${BrandColors.primary}80` }}
      thumbColor={value ? BrandColors.primary : '#f4f3f4'}
      ios_backgroundColor="#3e3e3e"
      onValueChange={onChange}
      value={value}
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandColors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  backButton: {
    padding: 8,
  },
  rightPlaceholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: BrandColors.primary,
    marginLeft: 10,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    color: 'white',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#999',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  resetButton: {
    backgroundColor: '#555',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginRight: 10,
  },
  helpButton: {
    backgroundColor: BrandColors.secondary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginLeft: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  versionText: {
    color: '#777',
    fontSize: 14,
  },
});

export default SettingsScreen;