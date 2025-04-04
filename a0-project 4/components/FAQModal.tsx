import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQModalProps {
  visible: boolean;
  onClose: () => void;
}

const FAQModal: React.FC<FAQModalProps> = ({ visible, onClose }) => {
  const [faqData, setFaqData] = useState<FAQItem[]>([]);

  useEffect(() => {
    const loadFAQData = async () => {
      try {
        // In production this would be loaded from a server
        // For now we'll use some basic defaults
        const defaultFAQ: FAQItem[] = [
          {
            question: "Basic Controls",
            answer: "Use the sliders to control volume and tap icons to switch outputs"
          },
          {
            question: "Audio Output Management",
            answer: "Switch between speakers, headphones, and Bluetooth devices easily with the output selector"
          },
          {
            question: "Multiple Sources",
            answer: "Control volume independently for different apps and audio sources"
          }
        ];
        setFaqData(defaultFAQ);
      } catch (error) {
        console.error('Error loading FAQ:', error);
        setFaqData([{
          question: "How to use?",
          answer: "Control your audio sources using the simple interface"
        }]);
      }
    };
    
    loadFAQData();
  }, []);

  const FAQItem: React.FC<{item: FAQItem, index: number}> = ({ item, index }) => {
    const expanded = useSharedValue(0);
    const rotateZ = useAnimatedStyle(() => {
      return {
        transform: [{ rotateZ: `${expanded.value * 180}deg` }]
      };
    });

    const contentHeight = useSharedValue(0);
    const contentStyle = useAnimatedStyle(() => {
      return {
        height: contentHeight.value * expanded.value,
        opacity: expanded.value,
      };
    });

    const toggleExpand = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      expanded.value = withTiming(expanded.value ? 0 : 1, { duration: 300 });
      contentHeight.value = 120; // Approximate height of content
    };

    return (
      <View style={[styles.faqItem, index === 0 && styles.firstItem]}>
        <Pressable 
          style={styles.faqQuestion} 
          onPress={toggleExpand}
          android_ripple={{ color: '#ffffff20', borderless: false }}
        >
          <Text style={styles.questionText}>{item.question}</Text>
          <Animated.View style={rotateZ}>
            <MaterialIcons name="expand-more" size={24} color="#4CAF50" />
          </Animated.View>
        </Pressable>
        
        <Animated.View style={[styles.faqAnswer, contentStyle]}>
          <Text style={styles.answerText}>{item.answer}</Text>
        </Animated.View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Frequently Asked Questions</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            {faqData.map((item, index) => (
              <FAQItem key={index} item={item} index={index} />
            ))}
          </ScrollView>
          
          <TouchableOpacity style={styles.doneButton} onPress={onClose}>
            <Text style={styles.doneButtonText}>Got it</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 16,
  },
  modalContainer: {
    width: '95%',
    maxHeight: '80%',
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    backgroundColor: '#2A2A2A',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'System',
  },
  closeButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  faqItem: {
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: '#2A2A2A',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
  },
  firstItem: {
    marginTop: 0,
  },
  faqQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    flex: 1,
    marginRight: 16,
    textAlign: 'left',
  },
  faqAnswer: {
    padding: 16,
    paddingTop: 0,
    overflow: 'hidden',
    backgroundColor: '#222',
  },
  answerText: {
    fontSize: 14,
    color: '#CCC',
    textAlign: 'left',
    lineHeight: 20,
  },
  doneButton: {
    backgroundColor: '#4CAF50',
    padding: 14,
    alignItems: 'center',
    margin: 16,
    borderRadius: 8,
  },
  doneButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  }
});

export default FAQModal;