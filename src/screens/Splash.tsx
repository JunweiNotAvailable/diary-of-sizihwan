import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, Animated, Easing } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppState } from '../contexts/AppContext';
import LottieView from 'lottie-react-native';
import { Config } from '../utils/Config';

const USER_STORAGE_KEY = Config.storage.user;

const SplashScreen = ({ navigation }: { navigation: any }) => {
  const props = useAppState();
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.9))[0];

  // Start animation when component mounts
  useEffect(() => {
    // Cross-fade and scale animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.5)),
      }),
    ]).start();

    // Check user after animation
    setTimeout(async () => {
      await checkUser();
    }, 2500);
  }, []);

  const checkUser = async () => {
    try {
      const currUserId = await AsyncStorage.getItem(USER_STORAGE_KEY);

      if (currUserId) {
        const res = await fetch(`${Config.api.url}/data?table=users&id=${currUserId}`);
        const { password, ...userData} = (await res.json()).data;
        props?.setUser(userData);
        navigation.replace('Main');
      } else {
        navigation.replace('Auth');
      }
    } catch (error) {
      console.error('Error checking user:', error);
      navigation.replace('Auth');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <Animated.View 
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <LottieView 
            style={styles.lottie} 
            source={require('../../assets/splash.json')} 
            autoPlay 
            loop 
          />
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  lottie: { 
    width: 150, 
    height: 150,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#3498db',
    marginTop: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  loadingText: {
    fontSize: 16,
    color: '#7f8c8d',
    letterSpacing: 1,
    fontWeight: '500',
  },
});

export default SplashScreen;
