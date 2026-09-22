import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTransportConfig } from '../services/transportConfig';
import { getErrorMessage } from '../utils/errorHandler';

export default function SplashScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    // Start animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();

    // Check transport configuration & auth status while animating
    const checkAuth = async () => {
      try {
        const transportConfig = await getTransportConfig();
        const user = await AsyncStorage.getItem('user');
        const token = await AsyncStorage.getItem('token');

        setTimeout(() => {
          if (!transportConfig) {
            // First time setup - prompt user to scan QR or select company
            navigation.replace('CompanySetup');
          } else if (user || token) {
            navigation.replace('Home');
          } else {
            navigation.replace('Login');
          }
        }, 1800);
      } catch (error) {
        setTimeout(() => {
          navigation.replace('CompanySetup');
        }, 1800);
      }
    };

    checkAuth();
  }, [fadeAnim, scaleAnim, navigation]);


  return (
    <View style={styles.container}>
      <Animated.Image 
        source={require('../../assets/garuda-logo.png')} 
        style={[
          styles.logo, 
          { 
            opacity: fadeAnim, 
            transform: [{ scale: scaleAnim }] 
          }
        ]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 250,
    height: 250,
    maxWidth: '70%',
    maxHeight: '70%',
  }
});
