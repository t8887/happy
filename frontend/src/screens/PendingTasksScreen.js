import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Image, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useTasks, useUpdateTask, useCompleteTask, useDeleteTask } from '../hooks/useTasks';
import { useToast } from '../context/ToastContext';
import { getAssetForType } from '../constants/motivationAssets';

const TYPES = ['task', 'habit', 'workout', 'reading', 'meditation', 'other'];
const REPEATS = ['none', 'daily', 'weekly'];

function EditForm({ task, onSave, onCancel, saving }) {
  const [title, setTitle] = useState(task.title);
  const [type, setType] = useState(task.type || 'task');
  const [repeatType, setRepeatType] = useState(task.repeatType || 'none');
  const [image, setImage] = useState(task.image || null);

  const pickImage = async () => {
    Alert.alert('Task Photo', 'Choose a source', [
      {
        text: 'Camera', onPress: async () => {
          const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true, aspect: [4, 3], quality: 0.5, base64: true,
          });
          if (!result.canceled && result.assets[0].base64) {
            setImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
          }
        },
      },
      {
        text: 'Gallery', onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true, aspect: [4, 3], quality: 0.5, base64: true,
          });
          if (!result.canceled && result.assets[0].base64) {
            setImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
          }
        },
      },
      { text: 'Remove', style: 'destructive', onPress: () => setImage(null) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <View style={styles.editForm}>
      <TextInput
        style={styles.editInput}
        value={title}
        onChangeText={setTitle}
        placeholder="Task title"
        placeholderTextColor="#666"
        maxLength={200}
      />
      <View style={styles.chipRow}>
        {TYPES.map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.chip, type === t && styles.chipActive]}
            onPress={() => setType(t)}
          >
            <Text style={[styles.chipText, type === t && styles.chipTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.chipRow}>
        {REPEATS.map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.chip, repeatType === r && styles.chipActive]}
            onPress={() => setRepeatType(r)}
          >
            <Text style={[styles.chipText, repeatType === r && styles.chipTextActive]}>
              {r === 'none' ? 'no repeat' : r}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage}>
        {image
          ? <Image source={{ uri: image }} style={styles.imagePreview} />
          : <Text style={styles.imagePickerText}>📷  Add Photo (optional)</Text>
        }
      </TouchableOpacity>
      <View style={styles.editActions}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.saveBtn}
          disabled={saving || !title.trim()}
          onPress={() => onSave({ title, type, repeatType, image: image || '' })}
        >
          {saving
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.saveBtnText}>Save</Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Animated empty state
function AnimatedEmptyState() {
  const scale   = useRef(new Animated.Value(1)).current;
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
        <Animated.Text style={{ fontSize: 44, transform: [{ scale }] }}>✨</Animated.Text>
      </View>
      <Text style={styles.emptyText}>All clear!</Text>
      <Text style={styles.emptySub}>{'You have no pending tasks.\nAdd one to get started.'}</Text>
    </Animated.View>
  );
}

export default function PendingTasksScreen() {
  const { data: tasks, isLoading } = useTasks();
  const { mutateAsync: updateTask } = useUpdateTask();
  const { mutate: completeTask } = useCompleteTask();
  const { mutate: deleteTask } = useDeleteTask();
  const { showToast } = useToast();
  const [editingId, setEditingId] = useState(null);
  const [savingId, setSavingId] = useState(null);

  const handleSave = async (taskId, updates) => {
    setSavingId(taskId);
    try {
      await updateTask({ taskId, updates });
      showToast('Task updated!', 'success');
      setEditingId(null);
    } catch {
      showToast('Failed to update task', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = (taskId) => {
    Alert.alert('Delete Task', 'Are you sure you want to delete this task?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: () => {
          deleteTask(taskId);
          showToast('Task deleted', 'info');
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#6C63FF" size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {(!tasks || tasks.length === 0) ? (
        <AnimatedEmptyState />
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          renderItem={({ item, index }) => (
            <TaskCard
              item={item}
              index={index}
              asset={getAssetForType(item.type)}
              isEditing={editingId === item._id}
              saving={savingId === item._id}
              onComplete={() => completeTask(item._id)}
              onEdit={() => setEditingId(item._id)}
              onDelete={() => handleDelete(item._id)}
              onSave={(updates) => handleSave(item._id, updates)}
              onCancelEdit={() => setEditingId(null)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

function TaskCard({ item, index, asset, isEditing, saving, onComplete, onEdit, onDelete, onSave, onCancelEdit }) {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;
  const scale      = useRef(new Animated.Value(1)).current;
  const { image: AnimalSvg, accent } = asset;

  // Staggered entry — each card waits index × 60ms before fading in
  useEffect(() => {
    const delay = (index || 0) * 60;
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 300, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 300, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  // Play shrink+fade exit animation, then fire the actual mutation
  const handleComplete = () => {
    Animated.parallel([
      Animated.timing(scale,   { toValue: 0.92, duration: 180, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0,    duration: 220, useNativeDriver: true }),
    ]).start(() => onComplete());
  };

  return (
    <Animated.View style={[styles.card, { borderColor: accent + '30', opacity, transform: [{ translateY }, { scale }] }]}>
      {/* Left accent bar */}
      <View style={[styles.accentBar, { backgroundColor: accent }]} />

      <View style={styles.cardInner}>
        {isEditing ? (
          <EditForm task={item} saving={saving} onSave={onSave} onCancel={onCancelEdit} />
        ) : (
          <>
            {/* Top section: text left, SVG thumbnail right */}
            <View style={styles.topRow}>
              <View style={styles.topLeft}>
                {/* Badges */}
                <View style={styles.badges}>
                  <View style={[styles.typeBadge, { backgroundColor: accent + '18', borderColor: accent + '40' }]}>
                    <Text style={[styles.typeBadgeText, { color: accent }]}>
                      {(item.type || 'task').toUpperCase()}
                    </Text>
                  </View>
                  {item.repeatType && item.repeatType !== 'none' && (
                    <View style={styles.repeatBadge}>
                      <Text style={styles.repeatBadgeText}>🔁 {item.repeatType}</Text>
                    </View>
                  )}
                  {!!item.scheduledTime && (
                    <View style={styles.timeBadge}>
                      <Text style={styles.timeBadgeText}>🕐 {item.scheduledTime}</Text>
                    </View>
                  )}
                </View>
                {/* Title */}
                <Text style={styles.taskTitle} numberOfLines={3}>{item.title}</Text>
              </View>

              {/* Animal SVG thumbnail */}
              <View style={[styles.thumbnailBox, { backgroundColor: accent + '12', borderColor: accent + '25' }]}>
                <AnimalSvg width={60} height={60} />
              </View>
            </View>

            {/* Task photo (if user attached one) */}
            {!!item.image && (
              <Image source={{ uri: item.image }} style={styles.taskImage} />
            )}

            {/* Action row */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.completeBtn, { backgroundColor: accent + '18', borderColor: accent + '44' }]}
                onPress={handleComplete}
              >
                <Text style={[styles.completeBtnText, { color: accent }]}>✓  Complete</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.editBtn} onPress={onEdit}>
                <Text style={styles.editBtnText}>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
                <Text style={styles.deleteBtnText}>🗑</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  centered: { flex: 1, backgroundColor: '#0f0f1a', alignItems: 'center', justifyContent: 'center' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingTop: 80 },
  emptyRing: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#1a1a2e', borderWidth: 1, borderColor: '#6C63FF33',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  emptyText: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptySub: { color: '#666', fontSize: 14, textAlign: 'center', lineHeight: 22 },

  card: {
    backgroundColor: '#141420',
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  accentBar: { width: 4 },
  cardInner: { flex: 1, padding: 14 },

  // Top section: text left + SVG thumbnail right
  topRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, gap: 12 },
  topLeft: { flex: 1 },
  thumbnailBox: {
    width: 76, height: 76, borderRadius: 16, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },

  badges: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 8 },
  typeBadge: {
    borderRadius: 8, borderWidth: 1,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  typeBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  repeatBadge: {
    backgroundColor: '#ffffff0d', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  repeatBadgeText: { color: '#888', fontSize: 10 },
  timeBadge: {
    backgroundColor: '#ffffff0d', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  timeBadgeText: { color: '#888', fontSize: 10 },
  taskTitle: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 12, lineHeight: 22 },
  actionRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  completeBtn: {
    flex: 1, borderRadius: 10, borderWidth: 1,
    paddingVertical: 9, alignItems: 'center',
  },
  completeBtnText: { fontWeight: '700', fontSize: 13 },
  editBtn: {
    backgroundColor: '#ffffff0d', borderRadius: 10,
    paddingVertical: 9, paddingHorizontal: 14,
  },
  editBtnText: { fontSize: 16 },
  deleteBtn: {
    backgroundColor: '#2a1a1a', borderRadius: 10,
    paddingVertical: 9, paddingHorizontal: 14,
    borderWidth: 1, borderColor: '#5a2a2a',
  },
  deleteBtnText: { fontSize: 16 },

  // Edit form
  editForm: { gap: 10 },
  editInput: {
    backgroundColor: '#0f0f1a', color: '#fff', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 15,
    borderWidth: 1, borderColor: '#333',
  },
  chipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: '#0f0f1a', borderWidth: 1, borderColor: '#333',
  },
  chipActive: { backgroundColor: '#6C63FF', borderColor: '#6C63FF' },
  chipText: { color: '#888', fontSize: 13 },
  chipTextActive: { color: '#fff', fontWeight: '700' },
  editActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  cancelBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    backgroundColor: '#1a1a2e', borderWidth: 1, borderColor: '#333',
    alignItems: 'center',
  },
  cancelBtnText: { color: '#888', fontWeight: '600' },
  saveBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    backgroundColor: '#6C63FF', alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: '700' },
  taskImage: {
    width: '100%', height: 130, borderRadius: 10, marginBottom: 10,
  },
  imagePickerBtn: {
    backgroundColor: '#0f0f1a', borderRadius: 10, borderWidth: 1,
    borderColor: '#333', paddingVertical: 12, alignItems: 'center',
    justifyContent: 'center', overflow: 'hidden',
  },
  imagePickerText: { color: '#888', fontSize: 13 },
  imagePreview: { width: '100%', height: 120, borderRadius: 10 },
});
