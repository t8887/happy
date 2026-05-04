import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useCreateTask, useTasks, useCompleteTask, useDeleteTask } from '../hooks/useTasks';
import { useToast } from '../context/ToastContext';

const TASK_TYPES = [
  { key: 'task',       icon: '✅', label: 'Task',       bg: '#1a1f2e', color: '#60a5fa' },
  { key: 'habit',      icon: '🔁', label: 'Habit',      bg: '#1e1a2e', color: '#a78bfa' },
  { key: 'workout',    icon: '💪', label: 'Workout',    bg: '#1f2a1a', color: '#86efac' },
  { key: 'reading',    icon: '📚', label: 'Reading',    bg: '#2a1f1a', color: '#fdba74' },
  { key: 'meditation', icon: '🧘', label: 'Meditation', bg: '#1a2a2a', color: '#67e8f9' },
  { key: 'other',      icon: '⚡', label: 'Other',      bg: '#2a2a1a', color: '#fde68a' },
];

export default function AddTaskScreen({ navigation }) {
  const [title, setTitle] = useState('');
  const [selectedType, setSelectedType] = useState('task');
  const { showToast } = useToast();

  const { data: tasks = [], isLoading } = useTasks();
  const { mutate: createTask, isPending: isCreating } = useCreateTask();
  const { mutate: completeTask } = useCompleteTask();
  const { mutate: deleteTask } = useDeleteTask();

  const pendingTasks = tasks.filter((t) => !t.isCompleted);
  const completedTasks = tasks.filter((t) => t.isCompleted).sort(
    (a, b) => new Date(b.completedAt) - new Date(a.completedAt)
  );

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

  const handleCreate = () => {
    if (!title.trim()) {
      showToast('Please enter a task title', 'error');
      return;
    }
    createTask(
      { title: title.trim(), type: selectedType },
      {
        onSuccess: () => {
          setTitle('');
          showToast('Task added!', 'success');
        },
        onError: (err) => showToast(err?.response?.data?.message || 'Failed to create task', 'error'),
      }
    );
  };

  const handleComplete = (taskId) => {
    completeTask(taskId, {
      onSuccess: (data) => showToast(`Task complete! +${data.xpAwarded} XP 🎉`, 'success'),
      onError: (err) => showToast(err?.response?.data?.message || 'Failed to complete task', 'error'),
    });
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.heading}>Add Task</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Input */}
        <View style={styles.section}>
          <TextInput
            style={styles.input}
            placeholder="What will you do?"
            placeholderTextColor="#555"
            value={title}
            onChangeText={setTitle}
          />

          {/* Type selector */}
          <View style={styles.typeGrid}>
            {TASK_TYPES.map((t) => {
              const isActive = selectedType === t.key;
              return (
                <TouchableOpacity
                  key={t.key}
                  style={[
                    styles.typeBtn,
                    isActive && { backgroundColor: t.bg, borderColor: t.color },
                  ]}
                  onPress={() => setSelectedType(t.key)}
                >
                  <Text style={styles.typeBtnIcon}>{t.icon}</Text>
                  <Text style={[styles.typeBtnText, isActive && { color: t.color, fontWeight: '700' }]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={styles.btn} onPress={handleCreate} disabled={isCreating}>
            {isCreating ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>Add Task</Text>}
          </TouchableOpacity>
        </View>

        {/* Pending tasks list */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pending ({pendingTasks.length})</Text>
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : pendingTasks.length === 0 ? (
            <Text style={styles.emptyText}>No pending tasks. Add one above!</Text>
          ) : (
            pendingTasks.map((task) => (
              <View key={task._id} style={styles.taskRow}>
                <Text style={styles.taskTitle} numberOfLines={1}>{task.title}</Text>
                <View style={styles.taskActions}>
                  <TouchableOpacity style={styles.doneBtn} onPress={() => handleComplete(task._id)}>
                    <Text style={styles.doneBtnText}>Done</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteTask(task._id)}>
                    <Text style={styles.deleteBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Completed tasks list */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Completed ({completedTasks.length})</Text>
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : completedTasks.length === 0 ? (
            <Text style={styles.emptyText}>No completed tasks yet. Start completing!</Text>
          ) : (
            completedTasks.map((task) => (
              <View key={task._id} style={styles.completedRow}>
                <View style={styles.completedIcon}>
                  <Text style={styles.completedEmoji}>{TYPE_EMOJI[task.type] || '⚡'}</Text>
                </View>
                <View style={styles.completedInfo}>
                  <Text style={styles.completedTitle} numberOfLines={1}>{task.title}</Text>
                  <Text style={styles.completedMeta}>
                    {task.type.charAt(0).toUpperCase() + task.type.slice(1)} · {formatDate(task.completedAt)}
                  </Text>
                </View>
                <View style={styles.xpBadge}>
                  <Text style={styles.xpText}>+{task.xpAwarded} XP</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
  },
  back: { color: '#aaa', fontSize: 16 },
  heading: { color: '#fff', fontSize: 20, fontWeight: '700' },
  section: { marginHorizontal: 16, marginTop: 20, gap: 12 },
  input: {
    backgroundColor: '#1a1a1a', color: '#fff', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 15,
    borderWidth: 1, borderColor: '#2a2a2a',
  },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1, borderColor: '#2a2a2a', backgroundColor: '#1a1a1a',
  },
  typeBtnIcon: { fontSize: 14 },
  typeBtnText: { color: '#888', fontSize: 13 },
  btn: {
    backgroundColor: '#fff', borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
  },
  btnText: { color: '#000', fontWeight: '700', fontSize: 16 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  emptyText: { color: '#555', fontSize: 14 },
  taskRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1a1a1a', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#2a2a2a',
  },
  taskTitle: { flex: 1, color: '#fff', fontSize: 14 },
  taskActions: { flexDirection: 'row', gap: 8 },
  doneBtn: { backgroundColor: '#1f3a1f', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  doneBtnText: { color: '#4ade80', fontWeight: '600', fontSize: 13 },
  deleteBtn: { backgroundColor: '#2a1a1a', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  deleteBtnText: { color: '#f87171', fontWeight: '600', fontSize: 13 },
  completedRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#111', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#1e2e1e', gap: 12,
  },
  completedIcon: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: '#1a2a1a', alignItems: 'center', justifyContent: 'center',
  },
  completedEmoji: { fontSize: 18 },
  completedInfo: { flex: 1 },
  completedTitle: { color: '#ccc', fontSize: 14, fontWeight: '600', marginBottom: 3 },
  completedMeta: { color: '#555', fontSize: 12 },
  xpBadge: {
    backgroundColor: '#1a3a1a', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  xpText: { color: '#4ade80', fontWeight: '700', fontSize: 12 },
});
