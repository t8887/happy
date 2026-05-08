import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

const BANNER_H = 36;

export default function OfflineBanner() {
  const { isOnline } = useNetworkStatus();
  const translateY = useRef(new Animated.Value(-BANNER_H)).current;
  const insets     = useSafeAreaInsets();

  useEffect(() => {
    Animated.timing(translateY, {
      toValue:         isOnline ? -BANNER_H : 0,
      duration:        280,
      useNativeDriver: true,
    }).start();
  }, [isOnline]);

  // Don't mount DOM node when online for clean perf
  if (isOnline) return null;

  return (
    <Animated.View
      style={[
        styles.banner,
        { top: insets.top, transform: [{ translateY }] },
      ]}
    >
      <Text style={styles.text}>⚠ No internet · showing cached data</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position:        'absolute',
    left:            0,
    right:           0,
    height:          BANNER_H,
    backgroundColor: '#b45309',   // amber-700
    alignItems:      'center',
    justifyContent:  'center',
    zIndex:          9999,
    // Cast shadow downwards on iOS
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
    }),
    elevation: 8,
  },
  text: {
    color:      '#fef3c7',   // amber-100
    fontSize:   12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
