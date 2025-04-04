import { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';

interface AnalyticsData {
  sessionsCount: number;
  totalUsageTime: number;
  audioSourcesUsed: {
    [key: string]: {
      usageCount: number;
      totalVolumeChanges: number;
      totalPlayTime: number;
      lastUsed: string;
    }
  };
  lastSession: string;
}

const DEFAULT_ANALYTICS: AnalyticsData = {
  sessionsCount: 0,
  totalUsageTime: 0,
  audioSourcesUsed: {},
  lastSession: new Date().toISOString()
};

const AnalyticsContext = createContext<{
  data: AnalyticsData;
  trackEvent: (event: string, data?: any) => void;
  trackAudioSource: (sourceId: string, action: string, data?: any) => void;
}>({
  data: DEFAULT_ANALYTICS,
  trackEvent: () => {},
  trackAudioSource: () => {}
});

export const useAnalytics = () => useContext(AnalyticsContext);

export const AnalyticsProvider = ({ children }: { children: React.ReactNode }) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>(DEFAULT_ANALYTICS);
  const [sessionStartTime, setSessionStartTime] = useState<number>(Date.now());

  // Load saved analytics data
  useEffect(() => {
    loadAnalyticsData();
    trackSessionStart();

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        setSessionStartTime(Date.now());
      } else if (nextAppState === 'background') {
        updateSessionTime();
      }
    });

    return () => {
      subscription.remove();
      updateSessionTime();
    };
  }, []);

  const loadAnalyticsData = async () => {
    try {
      const saved = await AsyncStorage.getItem('analyticsData');
      if (saved) {
        setAnalyticsData(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const saveAnalyticsData = async (data: AnalyticsData) => {
    try {
      await AsyncStorage.setItem('analyticsData', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving analytics:', error);
    }
  };

  const trackSessionStart = () => {
    setAnalyticsData(prev => {
      const updated = {
        ...prev,
        sessionsCount: prev.sessionsCount + 1,
        lastSession: new Date().toISOString()
      };
      saveAnalyticsData(updated);
      return updated;
    });
  };

  const updateSessionTime = () => {
    const sessionDuration = (Date.now() - sessionStartTime) / 1000; // in seconds
    setAnalyticsData(prev => {
      const updated = {
        ...prev,
        totalUsageTime: prev.totalUsageTime + sessionDuration
      };
      saveAnalyticsData(updated);
      return updated;
    });
  };

  const trackEvent = (event: string, data?: any) => {
    // Here you could also send to a remote analytics service
    console.log('Event tracked:', event, data);
  };

  const trackAudioSource = (sourceId: string, action: string, data?: any) => {
    setAnalyticsData(prev => {
      const sourceData = prev.audioSourcesUsed[sourceId] || {
        usageCount: 0,
        totalVolumeChanges: 0,
        totalPlayTime: 0,
        lastUsed: new Date().toISOString()
      };

      const updated = {
        ...prev,
        audioSourcesUsed: {
          ...prev.audioSourcesUsed,
          [sourceId]: {
            ...sourceData,
            usageCount: sourceData.usageCount + 1,
            totalVolumeChanges: action === 'volume_change' 
              ? sourceData.totalVolumeChanges + 1 
              : sourceData.totalVolumeChanges,
            totalPlayTime: action === 'play' 
              ? sourceData.totalPlayTime + (data?.duration || 0)
              : sourceData.totalPlayTime,
            lastUsed: new Date().toISOString()
          }
        }
      };

      saveAnalyticsData(updated);
      return updated;
    });
  };

  return (
    <AnalyticsContext.Provider value={{ 
      data: analyticsData, 
      trackEvent,
      trackAudioSource 
    }}>
      {children}
    </AnalyticsContext.Provider>
  );
};