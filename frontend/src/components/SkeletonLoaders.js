import React, { useEffect, useRef, memo } from 'react';
import { View, StyleSheet, Animated, ScrollView } from 'react-native';

// ─── Pulsing base box ─────────────────────────────────────────────────────────
function SkeletonBox({ style }) {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.75, duration: 850, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 850, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return <Animated.View style={[styles.box, style, { opacity }]} />;
}

// ─── FeedCard skeleton — mirrors real card layout exactly ─────────────────────
export const FeedCardSkeleton = memo(function FeedCardSkeleton() {
  return (
    <View style={styles.card}>
      {/* Header row: title + XP pill */}
      <View style={styles.cardHeader}>
        <View style={{ flex: 1, gap: 8 }}>
          <SkeletonBox style={{ height: 16, width: '80%', borderRadius: 8 }} />
          <SkeletonBox style={{ height: 12, width: '50%', borderRadius: 6 }} />
        </View>
        <SkeletonBox style={{ height: 28, width: 54, borderRadius: 12 }} />
      </View>

      {/* Illustration panel */}
      <SkeletonBox
        style={{ height: 200, marginHorizontal: 16, borderRadius: 20, marginBottom: 16 }}
      />

      {/* Quote lines */}
      <View style={{ paddingHorizontal: 20, paddingBottom: 16, gap: 8 }}>
        <SkeletonBox style={{ height: 12, width: '95%', borderRadius: 6 }} />
        <SkeletonBox style={{ height: 12, width: '80%', borderRadius: 6 }} />
        <SkeletonBox style={{ height: 10, width: '40%', borderRadius: 5, marginTop: 4 }} />
      </View>

      {/* Footer row: type badge + timestamp */}
      <View style={styles.cardFooter}>
        <SkeletonBox style={{ height: 24, width: 72, borderRadius: 8 }} />
        <SkeletonBox style={{ height: 13, width: 60, borderRadius: 6 }} />
      </View>
    </View>
  );
});

// ─── Dashboard header skeleton — mirrors GreetingSection → FocusCard → StatsRow → PendingTasks ─
export const DashboardSkeleton = memo(function DashboardSkeleton() {
  return (
    <View style={{ paddingBottom: 8 }}>
      {/* GreetingSection */}
      <View style={styles.greetingRow}>
        <View style={{ flex: 1, gap: 10 }}>
          <SkeletonBox style={{ height: 13, width: 110, borderRadius: 6 }} />
          <SkeletonBox style={{ height: 22, width: 200, borderRadius: 10 }} />
          <SkeletonBox style={{ height: 12, width: 165, borderRadius: 6 }} />
        </View>
        {/* Avatar circle */}
        <SkeletonBox style={{ width: 48, height: 48, borderRadius: 24 }} />
      </View>

      {/* FocusCard */}
      <SkeletonBox
        style={{ height: 100, marginHorizontal: 16, borderRadius: 20, marginBottom: 12 }}
      />

      {/* CompactStatsRow — two pills */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 16 }}>
        <SkeletonBox style={{ flex: 1, height: 44, borderRadius: 22 }} />
        <SkeletonBox style={{ flex: 1, height: 44, borderRadius: 22 }} />
      </View>

      {/* PendingTasksSection label */}
      <View style={{ paddingHorizontal: 20, marginBottom: 10 }}>
        <SkeletonBox style={{ height: 13, width: 130, borderRadius: 6 }} />
      </View>

      {/* PendingTasksSection horizontal cards */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 20 }}>
        <SkeletonBox style={{ width: 200, height: 90, borderRadius: 16 }} />
        <SkeletonBox style={{ width: 200, height: 90, borderRadius: 16 }} />
      </View>

      {/* Section divider line */}
      <SkeletonBox style={{ height: 1, marginHorizontal: 16, borderRadius: 1, marginBottom: 8 }} />
    </View>
  );
});

// ─── Full screen skeleton: dashboard + 3 feed cards ──────────────────────────
export function SkeletonFeedScreen() {
  return (
    <ScrollView
      scrollEnabled={false}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <DashboardSkeleton />
      <FeedCardSkeleton />
      <FeedCardSkeleton />
      <FeedCardSkeleton />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: '#2a2a3a',
  },
  card: {
    backgroundColor: '#111118',
    borderRadius: 24,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#2a2a3a',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
    gap: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a3a',
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 18,
    gap: 12,
  },
});
