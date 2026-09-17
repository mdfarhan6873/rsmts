import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated } from 'react-native';

const SplashScreen = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.stagger(150, [
          Animated.sequence([
            Animated.timing(dot1, { toValue: -15, duration: 250, useNativeDriver: true }),
            Animated.timing(dot1, { toValue: 0, duration: 250, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(dot2, { toValue: -15, duration: 250, useNativeDriver: true }),
            Animated.timing(dot2, { toValue: 0, duration: 250, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(dot3, { toValue: -15, duration: 250, useNativeDriver: true }),
            Animated.timing(dot3, { toValue: 0, duration: 250, useNativeDriver: true }),
          ]),
        ]),
        Animated.delay(300),
      ]).start(({ finished }) => {
        if (finished) animate();
      });
    };
    animate();
  }, [dot1, dot2, dot3]);

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/logo_bg_removed.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <View style={styles.dotsContainer}>
        <Animated.View style={[styles.dot, { transform: [{ translateY: dot1 }] }]} />
        <Animated.View style={[styles.dot, { transform: [{ translateY: dot2 }] }]} />
        <Animated.View style={[styles.dot, { transform: [{ translateY: dot3 }] }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 230,
    height: 230,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 90,
    flexDirection: 'row',
    gap: 16,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#1a233a',
  },
});

export default SplashScreen;