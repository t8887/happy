import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator,
  ScrollView, KeyboardAvoidingView, Platform, Animated, Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
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

const REPEAT_OPTIONS = [
  { key: 'none',     label: 'None' },
  { key: 'daily',    label: 'Daily' },
  { key: 'weekly',   label: 'Weekly' },
  { key: 'one-time', label: 'Once' },
];

export default function AddTaskScreen({ navigation }) {
  const [title, setTitle] = useState('');
  const [selectedType, setSelectedType] = useState('task');
  const [selectedRepeat, setSelectedRepeat] = useState('none');
  const [scheduledTime, setScheduledTime] = useState('');   // "HH:MM" string sent to API
  const [pickerDate, setPickerDate] = useState(new Date()); // Date object for the picker
  const [showPicker, setShowPicker] = useState(false);
  const { showToast } = useToast();

  const { data: tasks = [], isLoading } = useTasks();
  const { mutate: createTask, isPending: isCreating } = useCreateTask();
  const { mutate: completeTask } = useCompleteTask();
  const { mutate: deleteTask } = useDeleteTask();

  const pendingTasks = tasks.filter((t) => !t.isCompleted);


  const handleCreate = () => {
    if (!title.trim()) {
      showToast('Please enter a task title', 'error');
      return;
    }
    const timeInput = scheduledTime.trim();
    const timeValue = timeInput.length > 0 ? timeInput : null;

    createTask(
      { title: title.trim(), type: selectedType, repeatType: selectedRepeat, scheduledTime: timeValue },
      {
        onSuccess: () => {
          setTitle('');
          setSelectedRepeat('none');
          setScheduledTime('');
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

  const animateDone = (scale, onFinish) => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.85, duration: 80, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 3, useNativeDriver: true }),
    ]).start(onFinish);
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

          {/* Repeat selector */}
          <View>
            <Text style={styles.repeatLabel}>Repeat</Text>
            <View style={styles.repeatRow}>
              {REPEAT_OPTIONS.map((r) => (
                <TouchableOpacity
                  key={r.key}
                  style={[styles.repeatBtn, selectedRepeat === r.key && styles.repeatBtnActive]}
                  onPress={() => setSelectedRepeat(r.key)}
                >
                  <Text style={[styles.repeatBtnText, selectedRepeat === r.key && styles.repeatBtnTextActive]}>
                    {r.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Time reminder picker */}
          <View>
            <Text style={styles.repeatLabel}>Reminder time (optional)</Text>
            {Platform.OS === 'web' ? (
              <TextInput
                style={styles.timePickerBtn}
                value={scheduledTime}
                onChangeText={(val) => {
                  // Accept HH:MM format only
                  const clean = val.replace(/[^0-9:]/g, '').slice(0, 5);
                  setScheduledTime(clean);
                }}
                placeholder="HH:MM (e.g. 09:00)"
                placeholderTextColor="#888"
                maxLength={5}
              />
            ) : (
            <TouchableOpacity
              style={styles.timePickerBtn}
              onPress={() => setShowPicker(true)}
            >
              <Text style={styles.timePickerBtnText}>
                {scheduledTime ? `⏰  ${scheduledTime}` : 'Tap to set a time...'}
              </Text>
              {scheduledTime ? (
                <TouchableOpacity onPress={() => setScheduledTime('')}>
                  <Text style={styles.timeClearText}>×</Text>
                </TouchableOpacity>
              ) : null}
            </TouchableOpacity>
            )}
          </View>

          {/* iOS inline picker — shown inside a Modal */}
          {showPicker && Platform.OS === 'ios' && (
            <Modal transparent animationType="fade">
              <View style={styles.pickerOverlay}>
                <View style={styles.pickerCard}>
                  <DateTimePicker
                    value={pickerDate}
                    mode="time"
                    display="spinner"
                    themeVariant="dark"
                    onChange={(_, date) => { if (date) setPickerDate(date); }}
                  />
                  <TouchableOpacity
                    style={styles.pickerDoneBtn}
                    onPress={() => {
                      const h = String(pickerDate.getHours()).padStart(2, '0');
                      const m = String(pickerDate.getMinutes()).padStart(2, '0');
                      setScheduledTime(`${h}:${m}`);
                      setShowPicker(false);
                    }}
                  >
                    <Text style={styles.pickerDoneText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          )}

          {/* Android native picker */}
          {showPicker && Platform.OS === 'android' && (
            <DateTimePicker
              value={pickerDate}
              mode="time"
              display="default"
              onChange={(_, date) => {
                setShowPicker(false);
                if (date) {
                  setPickerDate(date);
                  const h = String(date.getHours()).padStart(2, '0');
                  const m = String(date.getMinutes()).padStart(2, '0');
                  setScheduledTime(`${h}:${m}`);
                }
              }}
            />
          )}

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
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>✨</Text>
              <Text style={styles.emptyCardTitle}>All clear!</Text>
              <Text style={styles.emptyCardSub}>Add a task above and start building your streak.</Text>
            </View>
          ) : (
            pendingTasks.map((task) => {
              const scale = new Animated.Value(1);
              return (
              <View key={task._id} style={styles.taskRow}>
                <View style={styles.taskTitleRow}>
                  <Text style={styles.taskTitle} numberOfLines={1}>{task.title}</Text>
                  {task.repeatType && task.repeatType !== 'none' && (
                    <Text style={styles.repeatBadge}>🔁</Text>
                  )}
                </View>
                <View style={styles.taskActions}>
                  <Animated.View style={{ transform: [{ scale }] }}>
                    <TouchableOpacity
                      style={styles.doneBtn}
                      onPress={() => animateDone(scale, () => handleComplete(task._id))}
                    >
                      <Text style={styles.doneBtnText}>Done</Text>
                    </TouchableOpacity>
                  </Animated.View>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteTask(task._id)}>
                    <Text style={styles.deleteBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
              );
            })
          )}
        </View>

        {/* Completed tasks — link to dedicated screen */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.completedLink}
            onPress={() => navigation.navigate('CompletedTasks')}
          >
            <Text style={styles.completedLinkText}>View Completed Tasks →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20,
  },
  back: { color: '#aaa', fontSize: 16 },
  heading: { color: '#fff', fontSize: 20, fontWeight: '700' },
  section: { marginHorizontal: 16, marginTop: 20, gap: 12 },
  input: {
    backgroundColor: '#1a1a2e', color: '#fff', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 15,
    borderWidth: 1, borderColor: '#2a2a3a',
  },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1, borderColor: '#2a2a3a', backgroundColor: '#1a1a2e',
  },
  typeBtnIcon: { fontSize: 14 },
  typeBtnText: { color: '#888', fontSize: 13 },
  btn: {
    backgroundColor: '#fff', borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
  },
  btnText: { color: '#000', fontWeight: '700', fontSize: 16 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  emptyCard: {
    alignItems: 'center', paddingVertical: 36, paddingHorizontal: 24,
    backgroundColor: '#1a1a2e', borderRadius: 20, marginTop: 8,
    borderWidth: 1, borderColor: '#2a2a3a',
  },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyCardTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptyCardSub: { color: '#888', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  taskRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#2a2a3a',
  },
  taskTitleRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  taskTitle: { flex: 1, color: '#fff', fontSize: 14 },
  repeatBadge: { fontSize: 13 },
  repeatLabel: { color: '#888', fontSize: 13, marginBottom: 8 },
  repeatRow: { flexDirection: 'row', gap: 8 },
  repeatBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: '#2a2a2a', backgroundColor: '#1a1a1a',
  },
  repeatBtnActive: { borderColor: '#6C63FF', backgroundColor: '#1a1a3a' },
  repeatBtnText: { color: '#888', fontSize: 13 },
  repeatBtnTextActive: { color: '#a78bfa', fontWeight: '700' },
  timePickerBtn: {
    backgroundColor: '#1a1a2e', borderRadius: 12, borderWidth: 1, borderColor: '#2a2a3a',
    paddingHorizontal: 16, paddingVertical: 13,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  timePickerBtnText: { color: '#aaa', fontSize: 15 },
  timeClearText: { color: '#f87171', fontSize: 18, fontWeight: '700', paddingHorizontal: 4 },
  pickerOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  pickerCard: {
    backgroundColor: '#1a1a2e', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingBottom: 32, paddingTop: 8,
  },
  pickerDoneBtn: {
    marginHorizontal: 24, marginTop: 8, backgroundColor: '#6C63FF',
    borderRadius: 12, paddingVertical: 13, alignItems: 'center',
  },
  pickerDoneText: { color: '#fff', fontWeight: '700', fontSize: 16 },
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
  completedLink: {
    padding: 14, borderRadius: 12,
    borderWidth: 1, borderColor: '#2a2a3a', alignItems: 'center',
  },
  completedLinkText: { color: '#6C63FF', fontWeight: '600', fontSize: 15 },
});
