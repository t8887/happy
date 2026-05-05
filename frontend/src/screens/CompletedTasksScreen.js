import React from 'react';
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { useCompletedTasks, useDeleteTask } from '../hooks/useTasks';
import { useToast } from '../context/ToastContext';

const TYPE_EMOJI = {
  task: '✅', habit: '🔁', workout: '💪',
  reading: '📚', meditation: '🧘', other: '⚡',
};

const formatDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    + ' · ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
};

export default function CompletedTasksScreen({ navigation }) {
  const { data: tasks = [], isLoading, refetch, isRefetching } = useCompletedTasks();
  const { mutate: deleteTask } = useDeleteTask();
  const { showToast } = useToast();

  const confirmDelete = (taskId, title) => {
    Alert.alert(
      'Delete Task',
      `Remove "${title}" permanently?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            deleteTask(taskId, {
              onSuccess: () => showToast('Task removed', 'info'),
              onError: () => showToast('Failed to delete task', 'error'),
            }),
        },
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <Text style={styles.emoji}>{TYPE_EMOJI[item.type] || '✅'}</Text>
        <View style={styles.cardInfo}>
          <Text style={styles.taskTitle}>{item.title}</Text>
          <Text style={styles.taskMeta}>
            {formatDate(item.completedAt)}
            {item.xpAwarded ? `  ·  +${item.xpAwarded} XP` : ''}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => confirmDelete(item._id, item.title)}
      >
        <Text style={styles.deleteBtnText}>🗑</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Completed Tasks</Text>
        <View style={{ width: 60 }} />
      </View>

      {isLoading ? (
        <ActivityIndicator color="#6C63FF" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          onRefresh={refetch}
          refreshing={isRefetching}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No completed tasks yet.</Text>
              <Text style={styles.emptySubText}>Complete a task to see it here!</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F1A' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: '#1A1A2E',
  },
  backBtn: { padding: 4 },
  backText: { color: '#6C63FF', fontSize: 15 },
  title: { color: '#fff', fontSize: 18, fontWeight: '700' },

  list: { padding: 16, paddingBottom: 40 },

  card: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1A1A2E', borderRadius: 14,
    padding: 14, marginBottom: 10,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  emoji: { fontSize: 22, marginRight: 12 },
  cardInfo: { flex: 1 },
  taskTitle: { color: '#fff', fontSize: 15, fontWeight: '600' },
  taskMeta: { color: '#555', fontSize: 12, marginTop: 3 },

  deleteBtn: { padding: 8 },
  deleteBtnText: { fontSize: 18 },

  empty: { alignItems: 'center', marginTop: 80 },
  emptyText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  emptySubText: { color: '#555', fontSize: 14, marginTop: 6 },
});
