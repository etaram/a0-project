import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

// Logo component
export const Logo: React.FC<{ size?: number; showText?: boolean; style?: any }> = ({ 
  size = 40, 
  showText = true,
  style
}) => {
  return (
    <View style={[styles.logoContainer, style]}>
      <View style={[styles.logoIconContainer, { width: size, height: size }]}>
        <MaterialIcons name="volume-up" size={size * 0.6} color="#FFFFFF" />
        <View style={styles.controlDot} />
      </View>
      {showText && (    <Text style={styles.logoText}>SoundMaster</Text>
      )}
    </View>
  );
};

// Footer with brand info
export const BrandFooter: React.FC = () => {
  return (
    <View style={styles.footer}>    <Text style={styles.footerText}>SoundMaster © 2025</Text>
    <Text style={styles.footerSubtext}>Complete control of your audio world</Text>
    </View>
  );
};

// Light and Dark theme colors
export const LightTheme = {
  primary: '#4CAF50',
  primaryDark: '#388E3C',
  primaryLight: '#A5D6A7',
  secondary: '#2196F3',
  secondaryDark: '#1976D2',
  accent: '#FF5722',
  background: '#F5F5F5',
  cardBg: '#FFFFFF',
  cardBgLight: '#F8F8F8',
  text: '#212121',
  textSecondary: '#757575',
  border: '#E0E0E0',
  success: '#4CAF50',
  warning: '#FFC107',
  error: '#F44336',
};

export const DarkTheme = {
  primary: '#4CAF50',
  primaryDark: '#388E3C',
  primaryLight: '#A5D6A7',
  secondary: '#2196F3',
  secondaryDark: '#1976D2',
  accent: '#FF5722',
  background: '#121212',
  cardBg: '#1E1E1E',
  cardBgLight: '#2A2A2A',
  text: '#FFFFFF',
  textSecondary: '#AAAAAA',
  border: '#333333',
  success: '#4CAF50',
  warning: '#FFC107',
  error: '#F44336',
};

// Theme context and hook
export const ThemeContext = React.createContext({
  isDarkMode: true,
  toggleTheme: () => {},
  theme: DarkTheme,
  systemTheme: true,
  setSystemTheme: (value: boolean) => {},
});

export const useTheme = () => React.useContext(ThemeContext);

// Brand colors for use throughout the app
export const BrandColors = {
  ...DarkTheme
};

const styles = StyleSheet.create({
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoIconContainer: {
    backgroundColor: BrandColors.primary,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  controlDot: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 8,
    height: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  logoText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  footer: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  footerText: {
    fontSize: 14,
    color: BrandColors.textSecondary,
    fontWeight: 'bold',
  },
  footerSubtext: {
    fontSize: 12,
    color: BrandColors.textSecondary,
    marginTop: 2,
  },
});