import React from 'react';
import {
  View, Text, FlatList, StyleSheet, Image,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFeed, useStreak } from '../hooks/useFeed';
import FeedCard from '../components/FeedCard';
import useAuthStore from '../store/authStore';

export default function FeedScreen({ navigation }) {
  const { data, isLoading, isError, refetch, isRefetching } = useFeed();
  const { data: streak, refetch: refetchStreak } = useStreak();
  const { clearAuth, user } = useAuthStore();

  const summary = data?.summary;
  const feed = data?.feed || [];

  const handleRefresh = () => {
    refetch();
    refetchStreak();
  };

  // Streak flame label: changes based on streak count
  const streakCount = streak?.current ?? summary?.streak ?? 0;
  const streakIcon = () => {
    if (streakCount === 0) return '😴';
    if (streakCount < 3)  return '🔥';
    if (streakCount < 7)  return '🔥🔥';
    return                       '🔥🔥🔥';
  };
  const xp = streak?.xp ?? summary?.xp ?? 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Hey, {summary?.username || user?.username} 👋</Text>
          <Text style={styles.subGreeting}>Keep the streak alive!</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')} activeOpacity={0.8}>
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatarBtn} />
          ) : (
            <View style={styles.avatarBtn}>
              <Text style={styles.avatarBtnText}>
                {(user?.username || '?').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* XP + Streak card */}
      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statIcon}>⚡</Text>
          <Text style={styles.statNumber}>{xp.toLocaleString()}</Text>
          <Text style={styles.statLabel}>TOTAL XP</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statIcon}>{streakIcon()}</Text>
          <Text style={styles.statNumber}>{streakCount}</Text>
          <Text style={styles.statLabel}>{streakCount === 1 ? 'DAY STREAK' : 'DAY STREAK'}</Text>
        </View>
      </View>

      {/* Feed */}
      {isLoading ? (
        <ActivityIndicator color="#fff" style={{ marginTop: 40 }} />
      ) : isError ? (
        <Text style={styles.errorText}>Failed to load feed. Pull to refresh.</Text>
      ) : (
        <FlatList
          data={feed}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <FeedCard item={item} />}
          contentContainerStyle={{ paddingBottom: 100, paddingTop: 8 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} tintColor="#fff" />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🌱</Text>
              <Text style={styles.emptyText}>Nothing here yet</Text>
              <Text style={styles.emptySubText}>Every streak starts with a single task. Complete one and watch your feed grow!</Text>
            </View>
          }
        />
      )}

      {/* FAB Row */}
      <View style={styles.fabRow}>
        <TouchableOpacity style={styles.fabSecondary} onPress={() => navigation.navigate('PendingTasks')}>
          <Text style={styles.fabSecondaryText}>📋 Tasks</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddTask')}>
          <Text style={styles.fabText}>+ Add Task</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  headerLeft: { flex: 1, marginRight: 12 },
  greeting: { color: '#fff', fontSize: 22, fontWeight: '700', letterSpacing: 0.3 },
  subGreeting: { color: '#555', fontSize: 13, marginTop: 3 },
  logout: { color: '#555', fontSize: 14 },
  avatarBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#6C63FF', justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#6C63FF55',
    overflow: 'hidden',
  },
  avatarBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  // ── Stats card ────────────────────────────────────────────────────────────
  statsCard: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2a2a3a',
    overflow: 'hidden',
    // subtle shadow on Android
    elevation: 4,
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  statItem: {
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 2,
  },
  statIcon: { fontSize: 22, marginBottom: 4 },
  statNumber: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  statLabel: {
    color: '#555',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: 1.2,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#2a2a3a',
    marginVertical: 16,
  },
  // ─────────────────────────────────────────────────────────────────────────
  errorText: { color: '#f87171', textAlign: 'center', marginTop: 40, fontSize: 14 },
  empty: {
    alignItems: 'center', marginTop: 72, marginHorizontal: 32,
    backgroundColor: '#1a1a2e', borderRadius: 20, padding: 32,
    borderWidth: 1, borderColor: '#2a2a3a',
  },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyText: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 10 },
  emptySubText: { color: '#888', fontSize: 14, lineHeight: 22, textAlign: 'center' },
  fabRow: {
    position: 'absolute', bottom: 32, left: 24, right: 24,
    flexDirection: 'row', gap: 10,
  },
  fab: {
    flex: 2, backgroundColor: '#fff', borderRadius: 16,
    paddingVertical: 17, alignItems: 'center',
  },
  fabText: { color: '#000', fontWeight: '700', fontSize: 16 },
  fabSecondary: {
    flex: 1, backgroundColor: '#1a1a2e', borderRadius: 16,
    paddingVertical: 17, alignItems: 'center',
    borderWidth: 1, borderColor: '#6C63FF44',
  },
  fabSecondaryText: { color: '#6C63FF', fontWeight: '700', fontSize: 14 },
});
