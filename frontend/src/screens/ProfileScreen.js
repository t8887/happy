import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, Image, Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useProfile, useUpdateProfile } from '../hooks/useProfile';
import { useToast } from '../context/ToastContext';
import useAuthStore from '../store/authStore';

export default function ProfileScreen({ navigation }) {
  const { data: profile, isLoading } = useProfile();
  const { mutate: updateProfile, isPending } = useUpdateProfile();
  const { showToast } = useToast();
  const { clearAuth } = useAuthStore();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');

  const startEdit = () => {
    setName(profile?.name || '');
    setBio(profile?.bio || '');
    setAvatar(profile?.avatar || '');
    setEditing(true);
  };

  const pickImage = async (source) => {
    let result;
    const options = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.4,
      base64: true,
    };

    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') { showToast('Camera permission denied', 'error'); return; }
      result = await ImagePicker.launchCameraAsync(options);
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') { showToast('Gallery permission denied', 'error'); return; }
      result = await ImagePicker.launchImageLibraryAsync(options);
    }

    if (!result.canceled && result.assets?.[0]?.base64) {
      const base64 = result.assets[0].base64;
      const mimeType = result.assets[0].mimeType || 'image/jpeg';
      setAvatar(`data:${mimeType};base64,${base64}`);
    }
  };

  const showPickerOptions = () => {
    Alert.alert('Profile Picture', 'Choose a source', [
      { text: 'Camera', onPress: () => pickImage('camera') },
      { text: 'Gallery', onPress: () => pickImage('gallery') },
      { text: 'Remove Photo', style: 'destructive', onPress: () => setAvatar('') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const cancelEdit = () => setEditing(false);

  const saveEdit = () => {
    if (name.trim().length === 0) {
      showToast('Name cannot be empty', 'error');
      return;
    }
    updateProfile(
      { name: name.trim(), bio: bio.trim(), avatar: avatar.trim() },
      {
        onSuccess: () => {
          showToast('Profile updated!', 'success');
          setEditing(false);
        },
        onError: () => showToast('Failed to update profile', 'error'),
      }
    );
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  const initials = (profile?.name || profile?.username || '?')
    .charAt(0)
    .toUpperCase();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Profile</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Avatar */}
        <View style={styles.avatarWrap}>
          {(editing ? avatar : profile?.avatar) ? (
            <Image
              source={{ uri: editing ? avatar : profile.avatar }}
              style={styles.avatarImage}
            />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          )}
          {editing ? (
            <TouchableOpacity style={styles.changePhotoBtn} onPress={showPickerOptions}>
              <Text style={styles.changePhotoText}>Change Photo</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.username}>@{profile?.username}</Text>
          )}
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{profile?.xp ?? profile?.xp ?? 0}</Text>
            <Text style={styles.statLabel}>Total XP</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{profile?.streak ?? 0}</Text>
            <Text style={styles.statLabel}>Streak 🔥</Text>
          </View>
        </View>

        {/* Edit form / Display */}
        {editing ? (
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Display Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor="#888"
              maxLength={40}
            />
            <Text style={styles.fieldLabel}>Bio</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={bio}
              onChangeText={setBio}
              placeholder="Short bio (max 160 chars)"
              placeholderTextColor="#888"
              multiline
              maxLength={160}
            />
            <View style={styles.editActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={cancelEdit}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveEdit} disabled={isPending}>
                {isPending
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.saveText}>Save</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Display Name</Text>
            <Text style={styles.fieldValue}>{profile?.name || '—'}</Text>
            <Text style={styles.fieldLabel}>Bio</Text>
            <Text style={styles.fieldValue}>{profile?.bio || '—'}</Text>
            <TouchableOpacity style={styles.editBtn} onPress={startEdit}>
              <Text style={styles.editBtnText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={clearAuth}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* Dev tool */}
        <TouchableOpacity
          style={styles.devBtn}
          onPress={() => navigation.navigate('NotificationTest')}
        >
          <Text style={styles.devBtnText}>🔔 Test Notifications</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F1A' },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F0F1A' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 28,
  },
  backBtn: { padding: 4 },
  backText: { color: '#6C63FF', fontSize: 15 },
  title: { color: '#fff', fontSize: 18, fontWeight: '700' },

  avatarWrap: { alignItems: 'center', marginBottom: 24 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#6C63FF', justifyContent: 'center', alignItems: 'center',
    marginBottom: 10,
  },
  avatarImage: {
    width: 80, height: 80, borderRadius: 40,
    marginBottom: 10,
  },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '700' },
  username: { color: '#aaa', fontSize: 14 },
  changePhotoBtn: {
    marginTop: 8, paddingVertical: 6, paddingHorizontal: 16,
    backgroundColor: '#1a1a2e', borderRadius: 20,
    borderWidth: 1, borderColor: '#6C63FF',
  },
  changePhotoText: { color: '#6C63FF', fontSize: 13, fontWeight: '600' },

  statsRow: {
    flexDirection: 'row', backgroundColor: '#1A1A2E',
    borderRadius: 16, padding: 20, marginBottom: 24,
    alignItems: 'center', justifyContent: 'space-around',
  },
  statBox: { alignItems: 'center', flex: 1 },
  statValue: { color: '#fff', fontSize: 26, fontWeight: '800' },
  statLabel: { color: '#888', fontSize: 12, marginTop: 4 },
  statDivider: { width: 1, height: 36, backgroundColor: '#333' },

  card: {
    backgroundColor: '#1A1A2E', borderRadius: 16,
    padding: 20, marginBottom: 20,
  },
  fieldLabel: { color: '#888', fontSize: 12, marginBottom: 4, marginTop: 12 },
  fieldValue: { color: '#fff', fontSize: 15 },

  input: {
    backgroundColor: '#0F0F1A', borderWidth: 1, borderColor: '#333',
    borderRadius: 10, padding: 12, color: '#fff', fontSize: 15, marginBottom: 4,
  },
  bioInput: { height: 80, textAlignVertical: 'top' },

  editActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  cancelBtn: {
    flex: 1, padding: 12, borderRadius: 10,
    borderWidth: 1, borderColor: '#444', alignItems: 'center',
  },
  cancelText: { color: '#aaa', fontWeight: '600' },
  saveBtn: {
    flex: 1, padding: 12, borderRadius: 10,
    backgroundColor: '#6C63FF', alignItems: 'center',
  },
  saveText: { color: '#fff', fontWeight: '700' },

  editBtn: {
    marginTop: 16, padding: 12, borderRadius: 10,
    borderWidth: 1, borderColor: '#6C63FF', alignItems: 'center',
  },
  editBtnText: { color: '#6C63FF', fontWeight: '600' },

  signOutBtn: {
    padding: 14, borderRadius: 12,
    borderWidth: 1, borderColor: '#E53935', alignItems: 'center',
  },
  signOutText: { color: '#E53935', fontWeight: '600' },

  devBtn: {
    marginTop: 12, padding: 14, borderRadius: 12,
    borderWidth: 1, borderColor: '#2a2a3a', alignItems: 'center',
  },
  devBtnText: { color: '#888', fontWeight: '600', fontSize: 13 },
});
