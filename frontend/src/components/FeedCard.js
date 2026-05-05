import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';

const TYPE_META = {
  task:       { icon: '✅', label: 'Task',       bg: '#1a1f2e', color: '#60a5fa' },
  habit:      { icon: '🔁', label: 'Habit',      bg: '#1e1a2e', color: '#a78bfa' },
  workout:    { icon: '💪', label: 'Workout',    bg: '#1f2a1a', color: '#86efac' },
  reading:    { icon: '📚', label: 'Reading',    bg: '#2a1f1a', color: '#fdba74' },
  meditation: { icon: '🧘', label: 'Meditation', bg: '#1a2a2a', color: '#67e8f9' },
  other:      { icon: '⚡', label: 'Other',      bg: '#2a2a1a', color: '#fde68a' },
};

// Returns "just now", "5 min ago", "2 hours ago", "3 days ago", etc.
const timeAgo = (dateStr) => {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000); // seconds
  if (diff < 60)                        return 'just now';
  if (diff < 3600)                      return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400)                     return `${Math.floor(diff / 3600)} hr ago`;
  if (diff < 86400 * 7)                 return `${Math.floor(diff / 86400)} days ago`;
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function FeedCard({ item }) {
  const meta = TYPE_META[item.type] || TYPE_META.other;

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.card, { opacity, transform: [{ translateY }] }]}>
      <View style={styles.row}>
        {/* Icon */}
        <Text style={styles.icon}>{meta.icon}</Text>

        {/* Title + meta row */}
        <View style={styles.content}>
          <Text style={styles.title}>{item.title}</Text>
          <View style={styles.metaRow}>
            {/* Colored type badge */}
            <View style={[styles.badge, { backgroundColor: meta.bg }]}>
              <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text>
            </View>
            <Text style={styles.time}>{timeAgo(item.completedAt)}</Text>
          </View>
        </View>

        {/* XP badge */}
        <View style={styles.xpBadge}>
          <Text style={styles.xpText}>+{item.xpAwarded} XP</Text>
        </View>
      </View>
      {!!item.taskImage && (
        <Image source={{ uri: item.taskImage }} style={styles.taskImage} />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: '#2a2a3a',
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  icon: { fontSize: 24, marginRight: 12 },
  content: { flex: 1 },
  title: { color: '#fff', fontSize: 15, fontWeight: '600', marginBottom: 6, lineHeight: 22 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 11, fontWeight: '600' },
  time: { color: '#888', fontSize: 12 },
  xpBadge: {
    backgroundColor: '#1f3a1f',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  xpText: { color: '#4ade80', fontSize: 12, fontWeight: '700' },
  taskImage: {
    width: '100%', height: 150, borderRadius: 10, marginTop: 10,
  },
});
