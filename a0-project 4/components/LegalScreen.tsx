import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BrandColors } from './Branding';
import * as Haptics from 'expo-haptics';

interface LegalScreenProps {
  onComplete: () => void;
}

const LegalScreen: React.FC<LegalScreenProps> = ({ onComplete }) => {
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  const handleComplete = async () => {
    if (privacyAccepted && termsAccepted) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      try {
        await AsyncStorage.setItem('hasAcceptedLegal', 'true');
      } catch (error) {
        console.error('Error saving legal acceptance status:', error);
      }
      onComplete();
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Terms & Privacy</Text>
      </View>
      
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="description" size={24} color={BrandColors.primary} />
            <Text style={styles.sectionTitle}>Terms of Service</Text>
          </View>
          <Text style={styles.legalText}>
            By using SoundMaster application ("Service"), you are agreeing to be bound by these terms of service. The Service is owned and operated by SoundMaster Inc.
            {"\n\n"}
            <Text style={styles.subHeader}>1. Use of Service</Text>
            {"\n"}
            SoundMaster grants you a personal, non-transferable, non-exclusive license to use the Service on your devices according to these Terms.
            {"\n\n"}
            <Text style={styles.subHeader}>2. Restrictions</Text>
            {"\n"}
            You agree not to, and will not permit others to license, sell, rent, lease, assign, distribute, transmit, host, outsource, disclose or otherwise commercially exploit the Service.
            {"\n\n"}
            <Text style={styles.subHeader}>3. Changes to Service</Text>
            {"\n"}
            SoundMaster reserves the right to modify, suspend or discontinue, temporarily or permanently, the Service with or without notice and without liability to you.
            {"\n\n"}
            <Text style={styles.subHeader}>4. Termination</Text>
            {"\n"}
            SoundMaster may, in its sole discretion, at any time and for any or no reason, suspend or terminate your license to the Service without prior notice or liability.
          </Text>
          
          <View style={styles.acceptContainer}>
            <Text style={styles.acceptText}>I accept the Terms of Service</Text>
            <Switch
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={termsAccepted ? BrandColors.primary : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
              onValueChange={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setTermsAccepted(!termsAccepted);
              }}
              value={termsAccepted}
              accessible={true}
              accessibilityLabel="Accept terms of service"
              accessibilityRole="switch"
            />
          </View>
        </View>
        
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="security" size={24} color={BrandColors.primary} />
            <Text style={styles.sectionTitle}>Privacy Policy</Text>
          </View>
          <Text style={styles.legalText}>
            This Privacy Policy describes how SoundMaster Inc. collects, uses, and discloses your information when you use our application.
            {"\n\n"}
            <Text style={styles.subHeader}>1. Information We Collect</Text>
            {"\n"}
            We collect information that you provide directly to us, such as when you create an account, use our service, or communicate with us.
            {"\n\n"}
            <Text style={styles.subHeader}>2. How We Use Your Information</Text>
            {"\n"}
            We use the information we collect to provide, maintain, and improve our Service, develop new features, and protect SoundMaster and our users.
            {"\n\n"}
            <Text style={styles.subHeader}>3. Audio Data</Text>
            {"\n"}
            SoundMaster accesses information about audio sources running on your device to provide core functionality. We do not record or store actual audio content.
            {"\n\n"}
            <Text style={styles.subHeader}>4. Data Storage</Text>
            {"\n"}
            All user preferences and settings are stored locally on your device. We do not transmit this data to our servers.
          </Text>
          
          <View style={styles.acceptContainer}>
            <Text style={styles.acceptText}>I accept the Privacy Policy</Text>
            <Switch
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={privacyAccepted ? BrandColors.primary : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
              onValueChange={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setPrivacyAccepted(!privacyAccepted);
              }}
              value={privacyAccepted}
              accessible={true}
              accessibilityLabel="Accept privacy policy"
              accessibilityRole="switch"
            />
          </View>
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            (!privacyAccepted || !termsAccepted) && styles.disabledButton
          ]}
          onPress={handleComplete}
          disabled={!privacyAccepted || !termsAccepted}
          accessible={true}
          accessibilityLabel="Continue button"
          accessibilityHint="Continue to the application after accepting terms"
          accessibilityRole="button"
        >
          <Text style={styles.continueButtonText}>
            {privacyAccepted && termsAccepted ? 'Continue' : 'Please Accept Terms & Privacy'}
          </Text>
          {privacyAccepted && termsAccepted && (
            <MaterialIcons name="arrow-forward" size={24} color="white" />
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandColors.background,
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#222',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 8,
  },
  legalText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#CCC',
    marginBottom: 16,
  },
  subHeader: {
    fontWeight: 'bold',
    color: '#DDD',
  },
  acceptContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderTopColor: '#444',
  },
  acceptText: {
    fontSize: 16,
    color: 'white',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  continueButton: {
    backgroundColor: BrandColors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  disabledButton: {
    backgroundColor: '#555',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LegalScreen;