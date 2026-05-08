import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, StyleSheet, Image,
  TouchableOpacity, RefreshControl, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFeed, useStreak } from '../hooks/useFeed';
import { useTasks, useCompleteTask } from '../hooks/useTasks';
import FeedCard from '../components/FeedCard';
import { SkeletonFeedScreen } from '../components/SkeletonLoaders';
import useAuthStore from '../store/authStore';

const ACCENT = '#6C63FF';

const TYPE_COLORS = {
  fitness: '#f97316',
  study: '#3b82f6',
  mindfulness: '#8b5cf6',
  nutrition: '#22c55e',
  social: '#ec4899',
  creative: '#f59e0b',
};

// ─── FadeInView — slide-up + fade entrance with configurable delay ──────────────
function FadeInView({ children, delay = 0, style }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,   { toValue: 1, duration: 400, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 400, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}

// ─── AnimatedEmptyState ──────────────────────────────────────────────────────────
function AnimatedEmptyState() {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.12, duration: 1600, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1,    duration: 1600, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.emptyWrap, { opacity }]}>
      <View style={styles.emptyRing}>
        <Animated.Text style={[styles.emptyEmoji, { transform: [{ scale }] }]}>🌱</Animated.Text>
      </View>
      <Text style={styles.emptyText}>Nothing here yet</Text>
      <Text style={styles.emptySubText}>
        {'Every streak starts with a single task.\nComplete one and watch your feed grow!'}
      </Text>
    </Animated.View>
  );
}

// ─── GreetingSection — memo: re-renders only when username/streak/avatar change
const GreetingSection = React.memo(function GreetingSection({ username, streakCount, navigation, avatar }) {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good Morning' :
    hour < 17 ? 'Good Afternoon' :
                'Good Evening';
  const greetingEmoji = hour < 12 ? '\u2600\uFE0F' : hour < 17 ? '\uD83D\uDC4B' : '\uD83C\uDF19';

  const streakMsg =
    streakCount === 0 ? 'Start your streak today!' :
    streakCount === 1 ? 'Day 1 \u2014 keep it going!' :
    streakCount < 7  ? `Keep your ${streakCount}-day streak alive \uD83D\uDD25` :
                       `${streakCount} days on fire \uD83D\uDD25\uD83D\uDD25`;

  return (
    <View style={styles.greetingSection}>
      <View style={styles.greetingLeft}>
        <Text style={styles.greetingTime}>{greeting} {greetingEmoji}</Text>
        <Text style={styles.greetingName}>{username}</Text>
        <Text style={styles.greetingStreak}>{streakMsg}</Text>
      </View>
      <TouchableOpacity onPress={() => navigation.navigate('Profile')} activeOpacity={0.8}>
        {avatar ? (
          <Image source={{ uri: avatar }} style={styles.avatarBtn} />
        ) : (
          <View style={styles.avatarBtn}>
            <Text style={styles.avatarBtnText}>
              {(username || '?').charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
});

// ─── FocusCard — memo: re-renders only when counts or nextReminder change
const FocusCard = React.memo(function FocusCard({ pendingCount, nextReminder, overdueCount, navigation }) {
  const hasUrgent = overdueCount > 0;

  const nextReminderText = nextReminder
    ? new Date(nextReminder).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <View style={[styles.focusCard, hasUrgent && styles.focusCardUrgent]}>
      <View style={styles.focusCardHeader}>
        <Text style={styles.focusCardLabel}>TODAY'S FOCUS</Text>
        {hasUrgent && (
          <View style={styles.urgentPill}>
            <Text style={styles.urgentPillText}>{overdueCount} overdue</Text>
          </View>
        )}
      </View>

      <View style={styles.focusCardRow}>
        <View style={styles.focusStatBlock}>
          <Text style={styles.focusStatNumber}>{pendingCount}</Text>
          <Text style={styles.focusStatLabel}>tasks left</Text>
        </View>
        <View style={styles.focusDivider} />
        <View style={styles.focusStatBlock}>
          <Text style={styles.focusStatNumber}>{nextReminderText || '\u2013'}</Text>
          <Text style={styles.focusStatLabel}>{nextReminderText ? 'next reminder' : 'no reminders'}</Text>
        </View>
      </View>

      {pendingCount === 0 ? (
        <Text style={styles.focusAllDone}>All tasks done! Great work today.</Text>
      ) : (
        <TouchableOpacity
          style={styles.focusCardBtn}
          onPress={() => navigation.navigate('PendingTasks')}
          activeOpacity={0.8}
        >
          <Text style={styles.focusCardBtnText}>View tasks  \u2192</Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

// ─── CompactStatsRow — memo: only updates when xp or streak changes
const CompactStatsRow = React.memo(function CompactStatsRow({ xp, streakCount }) {
  const streakEmoji = streakCount === 0 ? '\uD83D\uDE34' : streakCount < 7 ? '\uD83D\uDD25' : '\uD83D\uDD25\uD83D\uDD25';
  return (
    <View style={styles.compactStats}>
      <View style={styles.compactPill}>
        <Text style={styles.compactPillEmoji}>⚡</Text>
        <Text style={styles.compactPillValue}>{xp.toLocaleString()}</Text>
        <Text style={styles.compactPillLabel}> XP</Text>
      </View>
      <View style={styles.compactPill}>
        <Text style={styles.compactPillEmoji}>{streakEmoji}</Text>
        <Text style={styles.compactPillValue}>{streakCount}</Text>
        <Text style={styles.compactPillLabel}> {streakCount === 1 ? 'day' : 'days'}</Text>
      </View>
    </View>
  );
});

// ─── PendingTaskCard — memo with custom comparator: skips re-render if same task
const PendingTaskCard = React.memo(function PendingTaskCard({ task, onComplete }) {
  const accent = TYPE_COLORS[task.type] || ACCENT;
  const isOverdue = task.scheduledTime && new Date(task.scheduledTime) < new Date();

  return (
    <View style={[styles.ptCard, { borderTopColor: accent }]}>
      {isOverdue && (
        <View style={styles.ptOverdueBadge}>
          <Text style={styles.ptOverdueBadgeText}>OVERDUE</Text>
        </View>
      )}
      <View style={[styles.ptTypeDot, { backgroundColor: accent }]} />
      <Text style={styles.ptTitle} numberOfLines={3}>{task.title}</Text>
      {task.scheduledTime ? (
        <Text style={styles.ptTime}>
          {new Date(task.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      ) : null}
      <TouchableOpacity
        style={[styles.ptBtn, { borderColor: accent + '80' }]}
        onPress={() => onComplete(task._id)}
        activeOpacity={0.7}
      >
        <Text style={[styles.ptBtnText, { color: accent }]}>Done</Text>
      </TouchableOpacity>
    </View>
  );
}, (prev, next) => prev.task._id === next.task._id && prev.task.isCompleted === next.task.isCompleted);

// ─── PendingTasksSection — memo: skips re-render if task list ref is stable
const PendingTasksSection = React.memo(function PendingTasksSection({ tasks, navigation, onComplete }) {
  if (!tasks) return null;
  const pending = tasks.filter(t => !t.isCompleted).slice(0, 6);
  if (pending.length === 0) return null;

  const renderCard = ({ item }) => <PendingTaskCard task={item} onComplete={onComplete} />;

  return (
    <View style={styles.ptSection}>
      <View style={styles.ptSectionRow}>
        <Text style={styles.ptSectionTitle}>Pending Tasks</Text>
        <TouchableOpacity onPress={() => navigation.navigate('PendingTasks')} activeOpacity={0.7}>
          <Text style={styles.ptSeeAll}>See all →</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={pending}
        keyExtractor={(item) => item._id}
        renderItem={renderCard}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 4, gap: 10 }}
      />
    </View>
  );
});

// ─── FeedSectionHeader — memo
const FeedSectionHeader = React.memo(function FeedSectionHeader({ count }) {
  return (
    <View style={styles.feedDivider}>
      <Text style={styles.feedDividerText}>Completed Feed</Text>
      {count > 0 && (
        <View style={styles.feedDividerBadge}>
          <Text style={styles.feedDividerBadgeText}>{count}</Text>
        </View>
      )}
    </View>
  );
});

// ─── DashboardHeader — memo: all props are primitive or stable refs
const DashboardHeader = React.memo(function DashboardHeader({ username, avatar, streakCount, xp, pendingCount, nextReminder, overdueCount, tasks, feed, navigation, onComplete }) {
  return (
    <View>
      <FadeInView delay={0}>
        <GreetingSection
          username={username}
          streakCount={streakCount}
          navigation={navigation}
          avatar={avatar}
        />
      </FadeInView>
      <FadeInView delay={80}>
        <FocusCard
          pendingCount={pendingCount}
          nextReminder={nextReminder}
          overdueCount={overdueCount}
          navigation={navigation}
        />
      </FadeInView>
      <FadeInView delay={160}>
        <CompactStatsRow xp={xp} streakCount={streakCount} />
      </FadeInView>
      <FadeInView delay={240}>
        <PendingTasksSection tasks={tasks} navigation={navigation} onComplete={onComplete} />
      </FadeInView>
      <FadeInView delay={320}>
        <FeedSectionHeader count={feed} />
      </FadeInView>
    </View>
  );
});

// ─── Main Screen ────────────────────────────────────────────────────────────────────
export default function FeedScreen({ navigation }) {
  const { data, isLoading, isError, refetch, isRefetching } = useFeed();
  const { data: streak, refetch: refetchStreak } = useStreak();
  const { data: tasks } = useTasks();
  const { mutate: completeTask } = useCompleteTask();
  const { user } = useAuthStore();

  const summary = data?.summary;
  const feed = data?.feed || [];
  const streakCount = streak?.current ?? summary?.streak ?? 0;
  const xp = streak?.xp ?? summary?.xp ?? 0;

  // Derived pending task stats
  const { pendingCount, nextReminder, overdueCount } = useMemo(() => {
    if (!tasks) return { pendingCount: 0, nextReminder: null, overdueCount: 0 };
    const now = new Date();
    const pending = tasks.filter(t => !t.isCompleted);
    const withTime = pending
      .filter(t => t.scheduledTime)
      .sort((a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime));
    return {
      pendingCount: pending.length,
      nextReminder: withTime.find(t => new Date(t.scheduledTime) >= now)?.scheduledTime ?? null,
      overdueCount: withTime.filter(t => new Date(t.scheduledTime) < now).length,
    };
  }, [tasks]);

  const handleRefresh = useCallback(() => {
    refetch();
    refetchStreak();
  }, [refetch, refetchStreak]);

  const handleComplete = useCallback((id) => completeTask(id), [completeTask]);

  // FAB spring animation
  const fabScale = useRef(new Animated.Value(1)).current;
  const onFabPressIn  = () => Animated.spring(fabScale, { toValue: 0.88, useNativeDriver: true, speed: 40, bounciness: 10 }).start();
  const onFabPressOut = () => Animated.spring(fabScale, { toValue: 1,    useNativeDriver: true, speed: 20, bounciness: 14 }).start();

  // Stable renderItem — won't cause FlatList to re-render the whole list
  const renderFeedItem = useCallback(
    ({ item, index }) => <FeedCard item={item} index={index} />,
    []
  );

  const username = summary?.username || user?.username;
  const avatar = user?.avatar;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {isLoading ? (
        <SkeletonFeedScreen />
      ) : (
        <FlatList
          data={feed}
          keyExtractor={(item) => item._id}
          renderItem={renderFeedItem}
          ListHeaderComponent={
            <DashboardHeader
              username={username}
              avatar={avatar}
              streakCount={streakCount}
              xp={xp}
              pendingCount={pendingCount}
              nextReminder={nextReminder}
              overdueCount={overdueCount}
              tasks={tasks}
              feed={feed.length}
              navigation={navigation}
              onComplete={handleComplete}
            />
          }
          ListEmptyComponent={<AnimatedEmptyState />}
          contentContainerStyle={{ paddingBottom: 110 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} tintColor={ACCENT} />
          }
          initialNumToRender={5}
          windowSize={5}
          removeClippedSubviews
          maxToRenderPerBatch={5}
        />
      )}
      {isError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>Feed failed to load. Pull to refresh.</Text>
        </View>
      )}

      {/* Tasks pill — bottom left */}
      <TouchableOpacity
        style={styles.tasksPill}
        onPress={() => navigation.navigate('PendingTasks')}
        activeOpacity={0.8}
      >
        <Text style={styles.tasksPillIcon}>✓</Text>
        <Text style={styles.tasksPillText}>Tasks</Text>
        {pendingCount > 0 && (
          <View style={styles.tasksBadge}>
            <Text style={styles.tasksBadgeText}>{pendingCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Circular FAB — bottom right */}
      <Animated.View style={[styles.fabWrap, { transform: [{ scale: fabScale }] }]}>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('AddTask')}
          onPressIn={onFabPressIn}
          onPressOut={onFabPressOut}
          activeOpacity={1}
        >
          {/* Two View bars — immune to font-metric offset on Android/iOS */}
          <View style={styles.fabBarH} />
          <View style={styles.fabBarV} />
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },

  // ─ Greeting ──────────────────────────────────────────────────────────────────────
  greetingSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 20,
  },
  greetingLeft: { flex: 1, marginRight: 16 },
  greetingTime: { color: '#777', fontSize: 13, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 },
  greetingName: { color: '#fff', fontSize: 26, fontWeight: '800', letterSpacing: -0.5, marginBottom: 6 },
  greetingStreak: { color: ACCENT, fontSize: 13, fontWeight: '600', letterSpacing: 0.1 },
  avatarBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: ACCENT, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: ACCENT + '70', overflow: 'hidden',
  },
  avatarBtnText: { color: '#fff', fontWeight: '800', fontSize: 18 },

  // ─ Focus Card ──────────────────────────────────────────────────────────────────
  focusCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#13132b',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: ACCENT + '40',
    padding: 20,
    elevation: 4,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  focusCardUrgent: {
    borderColor: '#f87171' + '60',
    shadowColor: '#f87171',
  },
  focusCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  focusCardLabel: { color: '#666', fontSize: 11, fontWeight: '700', letterSpacing: 1.4 },
  urgentPill: {
    backgroundColor: '#f8717122',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f8717155',
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  urgentPillText: { color: '#f87171', fontSize: 11, fontWeight: '700' },
  focusCardRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  focusStatBlock: { flex: 1, alignItems: 'center' },
  focusStatNumber: { color: '#fff', fontSize: 34, fontWeight: '800', letterSpacing: -1.5 },
  focusStatLabel: { color: '#666', fontSize: 12, fontWeight: '500', marginTop: 3 },
  focusDivider: { width: 1, height: 40, backgroundColor: '#2a2a3a', marginHorizontal: 8 },
  focusAllDone: { color: '#22c55e', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  focusCardBtn: {
    backgroundColor: ACCENT + '20',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ACCENT + '50',
    paddingVertical: 10,
    alignItems: 'center',
  },
  focusCardBtnText: { color: ACCENT, fontSize: 14, fontWeight: '700' },

  // ─ Compact Stats ─────────────────────────────────────────────────────────────
  compactStats: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 16,
  },
  compactPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2a2a3a',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 4,
  },
  compactPillEmoji: { fontSize: 16 },
  compactPillValue: { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: -0.5 },
  compactPillLabel: { color: '#666', fontSize: 13, fontWeight: '500' },

  // ─ Pending Tasks Section ───────────────────────────────────────────────────────
  ptSection: { marginBottom: 16 },
  ptSectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  ptSectionTitle: { color: '#fff', fontSize: 17, fontWeight: '700', letterSpacing: 0.1 },
  ptSeeAll: { color: ACCENT, fontSize: 13, fontWeight: '600' },
  ptCard: {
    width: 160,
    backgroundColor: '#13132b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2a2a3a',
    borderTopWidth: 3,
    padding: 14,
    justifyContent: 'space-between',
    minHeight: 140,
  },
  ptOverdueBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f8717122',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 6,
  },
  ptOverdueBadgeText: { color: '#f87171', fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  ptTypeDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 8 },
  ptTitle: { color: '#e8e8f0', fontSize: 13, fontWeight: '600', lineHeight: 18, flex: 1, marginBottom: 6 },
  ptTime: { color: '#666', fontSize: 11, fontWeight: '500', marginBottom: 8 },
  ptBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 7,
    alignItems: 'center',
  },
  ptBtnText: { fontSize: 12, fontWeight: '700' },

  // ─ Feed section header ─────────────────────────────────────────────────────────
  feedDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#1e1e2e',
    marginTop: 4,
  },
  feedDividerText: { color: '#555', fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },
  feedDividerBadge: {
    backgroundColor: '#2a2a3a',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  feedDividerBadgeText: { color: '#666', fontSize: 11, fontWeight: '700' },

  // ─ Empty state ──────────────────────────────────────────────────────────────────
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyRing: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#1a1a2e',
    borderWidth: 1, borderColor: ACCENT + '33',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  emptyEmoji: { fontSize: 44, marginBottom: 16 },
  emptyText: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 10 },
  emptySubText: { color: '#888', fontSize: 14, lineHeight: 22, textAlign: 'center' },

  // ─ Error banner ──────────────────────────────────────────────────────────────
  errorBanner: {
    position: 'absolute',
    bottom: 100,
    left: 24, right: 24,
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#f87171' + '44',
    alignItems: 'center',
  },
  errorBannerText: {
    color: '#f87171',
    textAlign: 'center',
    fontSize: 13,
  },

  // ─ Circular FAB + Tasks pill ──────────────────────────────────────────────────
  fabWrap: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    borderRadius: 32,
    // Purple glow — matches app accent
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 14,
    elevation: 12,
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  // Two absolutely-centred bars form a perfect + cross
  fabBarH: {
    position: 'absolute',
    width: 24,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: '#fff',
  },
  fabBarV: {
    position: 'absolute',
    width: 2.5,
    height: 24,
    borderRadius: 2,
    backgroundColor: '#fff',
  },

  tasksPill: {
    position: 'absolute',
    bottom: 42,
    left: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#1e1b3a',        // solid — clearly distinct from #0f0f1a bg
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: ACCENT + 'cc',        // 80% opacity purple ring
    paddingVertical: 13,
    paddingHorizontal: 20,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  tasksPillIcon: {
    color: ACCENT,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 18,
    includeFontPadding: false,
  },
  tasksPillText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  tasksBadge: {
    backgroundColor: ACCENT,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  tasksBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
});
