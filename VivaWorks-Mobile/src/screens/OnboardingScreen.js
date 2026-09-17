// src/screens/OnboardingScreen.js

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import Button from '../components/Button';

const { width } = Dimensions.get('window');

const onboardingData = [
  {
    id: '1',
    image: require('../assets/images/onboarding1.png'),
    title: 'Find Opportunities\nThat Match Your Skills',
    description:
      'Discover remote and on-site jobs, connect with amazing clients, and grow your career on VivaWorks.',
  },
  {
    id: '2',
    image: require('../assets/images/onboarding2.png'),
    title: 'Connect & Collaborate\nWith Great People',
    description:
      'Join a growing community of freelancers, creators and businesses building the future of work.',
  },
  {
    id: '3',
    image: require('../assets/images/onboarding3.png'),
    title: 'Build Your Future\nWith VivaWorks',
    description:
      'Get better opportunities, earn more, and achieve your goals with our powerful platform.',
  },
];

const OnboardingScreen = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  const isLast = currentIndex === onboardingData.length - 1;

  const handleNext = () => {
    if (!isLast) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      navigation.navigate('Login');
    }
  };

  const handleSkip = () => {
    navigation.navigate('Login');
  };

  const renderItem = ({ item }) => (
    <View style={[styles.slide, { width }]}>
      <View style={styles.imageCard}>
        <Image
          source={item.image}
          style={styles.image}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>{item.description}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Skip Button */}
      {!isLast && (
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={onboardingData}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(
            event.nativeEvent.contentOffset.x / width
          );
          setCurrentIndex(index);
        }}
        keyExtractor={(item) => item.id}
      />

      {/* Dots */}
      <View style={styles.dotsContainer}>
        {onboardingData.map((item, index) => (
          <View
            key={item.id}
            style={[styles.dot, index === currentIndex && styles.activeDot]}
          />
        ))}
      </View>

      {/* Button */}
      <View style={styles.footer}>
        <Button
          title={isLast ? 'Get Started' : 'Next'}
          onPress={handleNext}
          variant="primary"
          size="large"
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  skipButton: {
    position: 'absolute',
    top: SIZES.md,
    right: SIZES.lg,
    zIndex: 10,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
  },
  skipText: {
    ...FONTS.body1,
    color: COLORS.textSecondary,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    paddingTop: SIZES.xxl || 48,
    paddingHorizontal: SIZES.xl,
  },
  imageCard: {
    width: width * 0.82,
    height: width * 0.82,
    borderRadius: 32,
    backgroundColor: COLORS.primaryLight || '#E8F5EF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.xxl || 40,
    overflow: 'hidden',
  },
  image: {
    width: '88%',
    height: '88%',
  },
  title: {
    ...FONTS.h3,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SIZES.md,
    lineHeight: 32,
  },
  description: {
    ...FONTS.body1,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: SIZES.lg,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.gray300,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 24,
    backgroundColor: COLORS.primary,
  },
  footer: {
    paddingHorizontal: SIZES.lg,
    paddingBottom: SIZES.xl,
  },
});

export default OnboardingScreen;
