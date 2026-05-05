import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTasks, useUpdateTask, useCompleteTask, useDeleteTask } from '../hooks/useTasks';
import { useToast } from '../context/ToastContext';

const TYPES = ['task', 'habit', 'goal'];
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
    <View style={styles.container}>
      {(!tasks || tasks.length === 0) ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyEmoji}>✨</Text>
          <Text style={styles.emptyText}>All clear!</Text>
          <Text style={styles.emptySub}>You have no pending tasks. Add one to get started.</Text>
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              {editingId === item._id ? (
                <EditForm
                  task={item}
                  saving={savingId === item._id}
                  onSave={(updates) => handleSave(item._id, updates)}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <>
                  <View style={styles.taskHeader}>
                    <View style={styles.badges}>
                      <View style={styles.typeBadge}>
                        <Text style={styles.typeBadgeText}>{item.type}</Text>
                      </View>
                      {item.repeatType && item.repeatType !== 'none' && (
                        <View style={styles.repeatBadge}>
                          <Text style={styles.repeatBadgeText}>🔁 {item.repeatType}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <Text style={styles.taskTitle}>{item.title}</Text>
                  {!!item.image && (
                    <Image source={{ uri: item.image }} style={styles.taskImage} />
                  )}
                  <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.completeBtn} onPress={() => completeTask(item._id)}>
                      <Text style={styles.completeBtnText}>✓ Complete</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.editBtn} onPress={() => setEditingId(item._id)}>
                      <Text style={styles.editBtnText}>✏️ Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item._id)}>
                      <Text style={styles.deleteBtnText}>🗑</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  centered: { flex: 1, backgroundColor: '#0f0f1a', alignItems: 'center', justifyContent: 'center' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptySub: { color: '#666', fontSize: 14, textAlign: 'center', lineHeight: 20 },

  card: {
    backgroundColor: '#1a1a2e', borderRadius: 14,
    padding: 14, marginBottom: 12,
  },
  taskHeader: { flexDirection: 'row', marginBottom: 6 },
  badges: { flexDirection: 'row', gap: 6 },
  typeBadge: {
    backgroundColor: '#6C63FF22', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  typeBadgeText: { color: '#6C63FF', fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  repeatBadge: {
    backgroundColor: '#ffffff11', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  repeatBadgeText: { color: '#aaa', fontSize: 11 },
  taskTitle: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 12 },
  actionRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  completeBtn: {
    flex: 1, backgroundColor: '#1a3a1a', borderRadius: 10,
    paddingVertical: 8, alignItems: 'center',
    borderWidth: 1, borderColor: '#2a5a2a',
  },
  completeBtnText: { color: '#4caf50', fontWeight: '700', fontSize: 13 },
  editBtn: {
    flex: 1, backgroundColor: '#1a1a3e', borderRadius: 10,
    paddingVertical: 8, alignItems: 'center',
    borderWidth: 1, borderColor: '#6C63FF44',
  },
  editBtnText: { color: '#6C63FF', fontWeight: '700', fontSize: 13 },
  deleteBtn: {
    backgroundColor: '#2a1a1a', borderRadius: 10,
    paddingVertical: 8, paddingHorizontal: 14,
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
