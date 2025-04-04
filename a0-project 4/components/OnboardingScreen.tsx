import React, { useState, useRef } from 'react';
import { requestAudioPermissions } from '../utils/permissions';
import { Linking } from 'react-native';
import { toast } from 'sonner-native';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Image, FlatList } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  interpolate,
  Extrapolate 
} from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BrandColors } from './Branding';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  image: string;
  icon: keyof typeof MaterialIcons.glyphMap;
}

const slides: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Welcome to SoundMaster',
    description: 'Control all your audio sources from one place. Adjust volume, route audio, and more.',
    image: 'https://api.a0.dev/assets/image?text=Audio%20control%20dashboard%20with%20sliders%20and%20indicators&aspect=16:9',
    icon: 'volume-up',
  },
  {
    id: '2',
    title: 'Individual Source Control',
    description: 'Adjust volume for each app separately. Play, pause, and route audio to different outputs.',
    image: 'https://api.a0.dev/assets/image?text=Person%20adjusting%20audio%20settings%20on%20smartphone&aspect=16:9',
    icon: 'tune',
  },
  {
    id: '3',
    title: 'Multiple Output Support',
    description: 'Easily switch between speakers, headphones, and Bluetooth devices for each audio source.',
    image: 'https://api.a0.dev/assets/image?text=Multiple%20audio%20devices%20connected%20to%20a%20smartphone&aspect=16:9',
    icon: 'speaker-group',
  },
  {
    id: '4',
    title: 'Ready to Go!',
    description: 'Tap "Get Started" to begin enjoying full control over your audio experience.',
    image: 'https://api.a0.dev/assets/image?text=Person%20enjoying%20music%20with%20headphones%20smiling&aspect=16:9',
    icon: 'celebration',
  },
];

interface Props {
  onComplete: () => void;
}

const OnboardingScreen: React.FC<Props> = ({ onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const progress = useSharedValue(0);

  const goToNextSlide = () => {
    if (currentIndex < slides.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
      progress.value = withTiming((currentIndex + 1) / (slides.length - 1));
    }
  };

  const goToPrevSlide = () => {
    if (currentIndex > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      flatListRef.current?.scrollToIndex({ index: currentIndex - 1 });
      setCurrentIndex(currentIndex - 1);
      progress.value = withTiming((currentIndex - 1) / (slides.length - 1));
    }
  };  const handleComplete = async () => {
    try {
      // Request permissions before completing onboarding
      const permissionStatus = await requestAudioPermissions();
      
      if (permissionStatus.granted) {
        try {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
          // Ignore haptic errors
        }
        await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
        onComplete();
      } else {
        // If permissions not granted, show error toast but still allow continuing
        toast.error('Features will be limited', {
          description: 'Please grant permissions in settings to use all features',
          duration: 5000,
          action: {
            label: 'Open Settings',
            onClick: () => {
              Linking.openSettings();
            }
          }
        });
        await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
        onComplete();
      }
    } catch (error) {
      console.error('Error in onboarding completion:', error);
      onComplete(); // Still allow continuing even if there's an error
    }
  };

  const handleScroll = (event: any) => {
    const scrollX = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollX / width);
    if (index !== currentIndex) {
      setCurrentIndex(index);
      progress.value = index / (slides.length - 1);
    }
  };

  const progressBarStyle = useAnimatedStyle(() => {
    return {
      width: `${progress.value * 100}%`,
    };
  });

  const renderDot = (index: number) => {
    const dotAnimStyle = useAnimatedStyle(() => {
      const opacity = interpolate(
        progress.value,
        [
          (index - 1) / (slides.length - 1),
          index / (slides.length - 1),
          (index + 1) / (slides.length - 1),
        ],
        [0.5, 1, 0.5],
        Extrapolate.CLAMP
      );

      const scale = interpolate(
        progress.value,
        [
          (index - 1) / (slides.length - 1),
          index / (slides.length - 1),
          (index + 1) / (slides.length - 1),
        ],
        [1, 1.5, 1],
        Extrapolate.CLAMP
      );

      return {
        opacity,
        transform: [{ scale }],
        backgroundColor: index <= currentIndex ? BrandColors.primary : '#555',
      };
    });

    return (
      <TouchableOpacity
        key={index}
        onPress={() => {
          flatListRef.current?.scrollToIndex({ index });
          setCurrentIndex(index);
          progress.value = withTiming(index / (slides.length - 1));
        }}
        style={styles.dotContainer}
      >
        <Animated.View style={[styles.dot, dotAnimStyle]} />
      </TouchableOpacity>
    );
  };

  const renderSlide = ({ item }: { item: OnboardingSlide }) => (
    <View style={styles.slide}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.image }} style={styles.image} />
        <View style={styles.iconOverlay}>
          <MaterialIcons name={item.icon} size={40} color="white" />
        </View>
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.progressContainer}>
        <View style={styles.progressBackground}>
          <Animated.View style={[styles.progressFill, progressBarStyle]} />
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        keyExtractor={(item) => item.id}
      />

      <View style={styles.bottomContainer}>
        <View style={styles.dotsContainer}>
          {slides.map((_, index) => renderDot(index))}
        </View>

        <View style={styles.buttonsContainer}>
          {currentIndex > 0 ? (
            <TouchableOpacity onPress={goToPrevSlide} style={styles.button}>
              <MaterialIcons name="arrow-back" size={24} color="white" />
              <Text style={styles.buttonText}>Back</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 100 }} />
          )}

          {currentIndex < slides.length - 1 ? (
            <TouchableOpacity onPress={goToNextSlide} style={[styles.button, styles.primaryButton]}>
              <Text style={styles.buttonText}>Next</Text>
              <MaterialIcons name="arrow-forward" size={24} color="white" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleComplete} style={[styles.button, styles.primaryButton]}>
              <Text style={styles.buttonText}>Get Started</Text>
              <MaterialIcons name="check-circle" size={24} color="white" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandColors.background,
  },
  progressContainer: {
    paddingHorizontal: 20,
    marginVertical: 20,
  },
  progressBackground: {
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: BrandColors.primary,
  },
  slide: {
    width,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  imageContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    height: height * 0.4,
    borderRadius: 20,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  iconOverlay: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'rgba(76, 175, 80, 0.8)',
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'flex-start',
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#AAA',
    textAlign: 'left',
    lineHeight: 24,
  },
  bottomContainer: {
    padding: 20,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  dotContainer: {
    padding: 5, // Add some padding for better touch area
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#333',
    minWidth: 100,
    justifyContent: 'center',
    gap: 8,
  },
  primaryButton: {
    backgroundColor: BrandColors.primary,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OnboardingScreen;