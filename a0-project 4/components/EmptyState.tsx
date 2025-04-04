import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import * as Permissions from 'expo-permissions';
import { requestAudioPermissions } from '../utils/permissions';
import { Toast } from 'sonner-native';

interface Props {
  message: string;
  isLoading?: boolean;
}

export const EmptyState: React.FC<Props> = ({ message, isLoading = false }) => {  const isPermissionMessage = message.includes('permission');  const handleRetry = async () => {
    try {
      const granted = await requestAudioPermissions();
      if (granted) {
        toast.success('Permissions granted', {
          description: 'Audio sources can now be detected',
          icon: <MaterialIcons name="check-circle" size={20} color="white" />
        });
      } else {        toast.error('Permissions Required', {
          description: 'Please grant permissions in settings',
          icon: <MaterialIcons name="error" size={20} color="white" />,
          action: {
            label: 'Open Settings',
            onClick: () => {
              if (Platform.OS === 'android') {
                Linking.openSettings();
              } else {
                Linking.openURL('app-settings:');
              }
            }
          }
        });
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      toast.error('שגיאה בבקשת ההרשאות', {
        description: error.message,
        icon: <MaterialIcons name="error" size={20} color="white" />
      });
    }
  };

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator size="large" color="#4CAF50" />
      ) : (
        <View style={styles.iconContainer}>
          <MaterialIcons 
            name={isPermissionMessage ? "security" : "audio-file"} 
            size={64} 
            color="#666" 
          />
        </View>
      )}
      
      <Text style={styles.message}>{message}</Text>
      
      {isPermissionMessage && (
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={handleRetry}
        >          <Text style={styles.retryText}>Request Permissions Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1C1C1C',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  message: {
    marginVertical: 16,
    fontSize: 18,
    color: '#AAA',
    textAlign: 'center',
    lineHeight: 24,
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
  },
  retryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  }
});