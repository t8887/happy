import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity } from 'react-native';

const TYPE_CONFIG = {
  success: { bg: '#1DB954', icon: '✓' },
  error:   { bg: '#E53935', icon: '✕' },
  info:    { bg: '#6C63FF', icon: 'ℹ' },
};

export default function Toast({ message, type = 'info', onHide }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;

  const { bg, icon } = TYPE_CONFIG[type] ?? TYPE_CONFIG.info;

  useEffect(() => {
    // Slide up + fade in
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();

    // Fade out after 2.3s (auto-dismiss fires from context at 2.8s)
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 30, duration: 300, useNativeDriver: true }),
      ]).start();
    }, 2300);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[styles.container, { backgroundColor: bg, opacity, transform: [{ translateY }] }]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.message} numberOfLines={3}>{message}</Text>
      <TouchableOpacity onPress={onHide} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Text style={styles.close}>×</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 48,
    left: 20,
    right: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 9999,
  },
  icon: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
  },
  message: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  close: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 22,
    lineHeight: 22,
    marginLeft: 8,
  },
});
