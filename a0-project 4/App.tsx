import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet, StatusBar, I18nManager, View, AppState, Platform } from 'react-native';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Toaster } from 'sonner-native';

import { checkAudioPermissions, requestAudioPermissions } from './utils/permissions';
import HomeScreen from "./screens/HomeScreen";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BrandSplashScreen } from './components/SplashScreen';
import { BrandColors } from './components/Branding';
import { AccessibilityProvider } from './components/AccessibilityManager';
import { AnalyticsProvider } from './components/Analytics';
import OnboardingScreen from './components/OnboardingScreen';
import LegalScreen from './components/LegalScreen';
import { ThemeProvider } from './components/ThemeProvider';

// Disable RTL layout for English
I18nManager.forceRTL(false);
I18nManager.allowRTL(false);

const Stack = createNativeStackNavigator();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showLegal, setShowLegal] = useState(false);  useEffect(() => {
    async function prepare() {
      try {
        // Check for first launch to show onboarding if needed
        const hasLaunched = await AsyncStorage.getItem('hasLaunched');
        const hasCompletedOnboarding = await AsyncStorage.getItem('hasCompletedOnboarding');
        const hasAcceptedLegal = await AsyncStorage.getItem('hasAcceptedLegal');
        
        if (hasLaunched !== 'true') {
          // First launch - do onboarding setup
          await AsyncStorage.setItem('hasLaunched', 'true');
          setShowOnboarding(true);
        } else if (hasCompletedOnboarding !== 'true') {
          setShowOnboarding(true);
        } else if (hasAcceptedLegal !== 'true') {
          setShowLegal(true);
        }
        
        // Check for permissions
        const hasPermissions = await checkAudioPermissions();
        
        if (!hasPermissions) {
          // Will trigger permission request on component mount
          await requestAudioPermissions();
        }
        
        // Check for previous crash data
        const lastCrashData = await AsyncStorage.getItem('lastCrashData');
        if (lastCrashData) {
          // Log crash for analytics but don't show to user in production
          console.log('Recovered from previous crash:', JSON.parse(lastCrashData));
          await AsyncStorage.removeItem('lastCrashData');
        }
      } catch (e) {
        console.warn('Error preparing app:', e);
      } finally {
        setAppIsReady(true);
      }
    }

    // Set up global error handler
    const errorHandler = (error: Error, isFatal?: boolean) => {
      if (isFatal) {
        // Save crash info for next launch
        const crashData = {
          message: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        };
        AsyncStorage.setItem('lastCrashData', JSON.stringify(crashData))
          .catch(e => console.error('Failed to save crash data', e));
          
        // In production, you'd want to report this to a crash reporting service
      }
    };

    // Set up error handler (this is a simplified example)
    if (ErrorUtils) {    if (typeof ErrorUtils !== 'undefined') {
      ErrorUtils.setGlobalHandler(errorHandler);
    }
    }

    prepare();
    
    return () => {
      // Clean up error handler if needed
      if (ErrorUtils) {
        ErrorUtils.setGlobalHandler(null);
      }
    };
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setShowLegal(true);
  };

  const handleLegalComplete = () => {
    setShowLegal(false);
  };

  if (!appIsReady) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: BrandColors.background }} />
      </SafeAreaProvider>
    );
  }

  if (showSplash) {
    return (
      <SafeAreaProvider>
        <BrandSplashScreen onFinish={handleSplashComplete} />
      </SafeAreaProvider>
    );
  }

  if (showOnboarding) {
    return (
      <SafeAreaProvider>
        <OnboardingScreen onComplete={handleOnboardingComplete} />
      </SafeAreaProvider>
    );
  }

  if (showLegal) {
    return (
      <SafeAreaProvider>
        <LegalScreen onComplete={handleLegalComplete} />
      </SafeAreaProvider>
    );
  }    return (
      <SafeAreaProvider>
        <ThemeProvider>
          <AnalyticsProvider>
            <AccessibilityProvider>
              <View style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor={BrandColors.background} />
                <Toaster richColors duration={3000} />
                <NavigationContainer>
                  <Stack.Navigator screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="Home" component={HomeScreen} />
                  </Stack.Navigator>
                </NavigationContainer>
              </View>
            </AccessibilityProvider>
          </AnalyticsProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandColors.background,
  }
});