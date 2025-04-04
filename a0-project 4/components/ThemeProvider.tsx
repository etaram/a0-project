import React, { useState, useEffect } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext, LightTheme, DarkTheme } from './Branding';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [systemTheme, setSystemTheme] = useState(true);
  
  useEffect(() => {
    // Load saved theme preferences
    loadThemePreferences();
    
    // Listen for system theme changes
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (systemTheme) {
        setIsDarkMode(colorScheme === 'dark');
      }
    });

    return () => {
      subscription.remove();
    };
  }, [systemTheme]);

  const loadThemePreferences = async () => {
    try {
      const savedSystemTheme = await AsyncStorage.getItem('systemTheme');
      const savedTheme = await AsyncStorage.getItem('isDarkMode');
      
      if (savedSystemTheme !== null) {
        setSystemTheme(savedSystemTheme === 'true');
        if (savedSystemTheme === 'false' && savedTheme !== null) {
          setIsDarkMode(savedTheme === 'true');
        }
      }
    } catch (error) {
      console.error('Error loading theme preferences:', error);
    }
  };

  const toggleTheme = async () => {
    try {
      const newValue = !isDarkMode;
      setIsDarkMode(newValue);
      if (!systemTheme) {
        await AsyncStorage.setItem('isDarkMode', String(newValue));
      }
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const handleSetSystemTheme = async (value: boolean) => {
    try {
      setSystemTheme(value);
      await AsyncStorage.setItem('systemTheme', String(value));
      if (value) {
        // If enabling system theme, immediately sync with system
        setIsDarkMode(Appearance.getColorScheme() === 'dark');
      }
    } catch (error) {
      console.error('Error saving system theme preference:', error);
    }
  };

  return (
    <ThemeContext.Provider 
      value={{
        isDarkMode,
        toggleTheme,
        theme: isDarkMode ? DarkTheme : LightTheme,
        systemTheme,
        setSystemTheme: handleSetSystemTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};