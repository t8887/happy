import React from 'react';
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
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
  const streakLabel = () => {
    const n = streak?.current ?? summary?.streak ?? 0;
    if (n === 0) return '😴 No streak';
    if (n < 3)   return `🔥 ${n} Day Streak`;
    if (n < 7)   return `🔥🔥 ${n} Day Streak`;
    return             `🔥🔥🔥 ${n} Day Streak`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hey, {summary?.username || user?.username} 👋</Text>
          <Text style={styles.subGreeting}>Keep the streak alive!</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <View style={styles.avatarBtn}>
            <Text style={styles.avatarBtnText}>
              {(user?.username || '?').charAt(0).toUpperCase()}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* XP + Streak summary */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>⚡ {streak?.xp ?? summary?.xp ?? 0}</Text>
          <Text style={styles.statLabel}>Total XP</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{streakLabel()}</Text>
          <Text style={styles.statLabel}>Current Streak</Text>
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

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddTask')}>
        <Text style={styles.fabText}>+ Add Task</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20,
  },
  greeting: { color: '#fff', fontSize: 22, fontWeight: '700', letterSpacing: 0.3 },
  subGreeting: { color: '#888', fontSize: 13, marginTop: 3 },
  logout: { color: '#555', fontSize: 14 },
  statsRow: {
    flexDirection: 'row', marginHorizontal: 16, marginBottom: 16,
    backgroundColor: '#1a1a2e', borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: '#2a2a3a',
  },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { color: '#fff', fontSize: 20, fontWeight: '700' },
  statLabel: { color: '#888', fontSize: 12, marginTop: 4 },
  statDivider: { width: 1, backgroundColor: '#2a2a3a', marginHorizontal: 8 },
  errorText: { color: '#f87171', textAlign: 'center', marginTop: 40, fontSize: 14 },
  empty: {
    alignItems: 'center', marginTop: 72, marginHorizontal: 32,
    backgroundColor: '#1a1a2e', borderRadius: 20, padding: 32,
    borderWidth: 1, borderColor: '#2a2a3a',
  },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyText: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 10 },
  emptySubText: { color: '#888', fontSize: 14, lineHeight: 22, textAlign: 'center' },
  fab: {
    position: 'absolute', bottom: 32, left: 24, right: 24,
    backgroundColor: '#fff', borderRadius: 16,
    paddingVertical: 17, alignItems: 'center',
  },
  fabText: { color: '#000', fontWeight: '700', fontSize: 16 },
  avatarBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#6C63FF', justifyContent: 'center', alignItems: 'center',
  },
  avatarBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
