import { Platform, PermissionsAndroid, Linking } from 'react-native';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { toast } from 'sonner-native';

// Define required permissions for Android
const REQUIRED_PERMISSIONS = [
  'android.permission.RECORD_AUDIO',
  'android.permission.MODIFY_AUDIO_SETTINGS',
  'android.permission.BLUETOOTH_CONNECT',
];

interface PermissionStatus {
  granted: boolean;
  missing: string[];
}

// Function to check if permissions have been granted already
export const checkAudioPermissions = async (): Promise<PermissionStatus> => {
  try {
    if (Platform.OS === 'android') {
      const missingPermissions: string[] = [];
      
      for (const permission of REQUIRED_PERMISSIONS) {
        try {
          const granted = await PermissionsAndroid.check(permission);
          if (!granted) {
            missingPermissions.push(permission);
          }
        } catch (error) {
          console.error(`Error checking permission ${permission}:`, error);
          missingPermissions.push(permission);
        }
      }
      
      return {
        granted: missingPermissions.length === 0,
        missing: missingPermissions
      };
    }
    
    // For iOS or other platforms, assume granted
    return {
      granted: true,
      missing: []
    };
    
  } catch (error) {
    console.error('Error checking permissions:', error);
    return {
      granted: false,
      missing: ['unknown']
    };
  }
};

// Function to request audio permissions
export const requestAudioPermissions = async (): Promise<PermissionStatus> => {
  try {
    // First check current status
    const currentStatus = await checkAudioPermissions();
    if (currentStatus.granted) {
      toast.success('All permissions already granted', {
        icon: 'check-circle'
      });
      return currentStatus;
    }

    if (Platform.OS === 'android') {
      const results = await Promise.all(
        REQUIRED_PERMISSIONS.map(async (permission) => {
          try {
            const granted = await PermissionsAndroid.request(permission, {
              title: 'SoundMaster Permissions',
              message: 'SoundMaster needs the following permissions to control audio on your device',
              buttonPositive: 'Grant',
              buttonNegative: 'Not Now'
            });
            return { permission, granted: granted === PermissionsAndroid.RESULTS.GRANTED };
          } catch (error) {
            console.error(`Error requesting permission ${permission}:`, error);
            return { permission, granted: false };
          }
        })
      );

      const deniedPermissions = results.filter(r => !r.granted).map(r => r.permission);
      
      if (deniedPermissions.length > 0) {
        toast.error('Missing required permissions', {
          description: 'Open settings to grant permissions',
          icon: 'error',
          action: {
            label: 'Open Settings',
            onClick: () => {
              Linking.openSettings();
            }
          }
        });
      } else {
        toast.success('All permissions granted successfully', {
          icon: 'check-circle'
        });
      }

      return {
        granted: deniedPermissions.length === 0,
        missing: deniedPermissions
      };
      
    }

    // For iOS or other platforms, assume granted
    return {
      granted: true,
      missing: []
    };
  } catch (error) {
    console.error('Error requesting permissions:', error);
    toast.error('Error requesting permissions', {
      description: error.message || 'Unknown error',
      icon: 'error'
    });
    return {
      granted: false,
      missing: ['error']
    };
  }
};