import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, Image, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

  const currentAvatar = editing ? avatar : profile?.avatar;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F1A' }} edges={['bottom']}>
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#0F0F1A' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        {/* Hero */}
        <View style={styles.hero}>
          {/* Back button overlaid */}
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          {/* Avatar ring + image */}
          <TouchableOpacity
            style={styles.avatarRing}
            onPress={editing ? showPickerOptions : undefined}
            activeOpacity={editing ? 0.7 : 1}
          >
            {currentAvatar ? (
              <Image source={{ uri: currentAvatar }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            )}
            {editing && (
              <View style={styles.editOverlay}>
                <Text style={styles.editOverlayText}>ðŸ“·</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Name + username */}
          <Text style={styles.displayName}>{profile?.name || profile?.username}</Text>
          <Text style={styles.username}>@{profile?.username}</Text>

          {editing && (
            <TouchableOpacity style={styles.changePhotoBtn} onPress={showPickerOptions}>
              <Text style={styles.changePhotoText}>Change Photo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profile?.xp ?? 0}</Text>
            <Text style={styles.statLabel}>Total XP</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profile?.streak ?? 0}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
        </View>

        {/* Info */}
        {editing ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Edit Profile</Text>
            <Text style={styles.fieldLabel}>Display Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor="#555"
              maxLength={40}
            />
            <Text style={styles.fieldLabel}>Bio</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={bio}
              onChangeText={setBio}
              placeholder="Short bio (max 160 chars)"
              placeholderTextColor="#555"
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
                  : <Text style={styles.saveText}>Save Changes</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Display Name</Text>
                <Text style={styles.fieldValue}>{profile?.name || 'â€”'}</Text>
                <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Bio</Text>
                <Text style={styles.fieldValue}>{profile?.bio || 'No bio yet'}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.editBtn} onPress={startEdit}>
              <Text style={styles.editBtnText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Social */}
        <View style={styles.socialGrid}>
          <TouchableOpacity style={styles.socialBtn} onPress={() => navigation.navigate('FriendList')}>
            <Text style={styles.socialBtnText}>Friends</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialBtn} onPress={() => navigation.navigate('FriendRequests')}>
            <Text style={styles.socialBtnText}>Requests</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialBtn} onPress={() => navigation.navigate('ChatList')}>
            <Text style={styles.socialBtnText}>Messages</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialBtn} onPress={() => navigation.navigate('SearchUsers')}>
            <Text style={styles.socialBtnText}>Find People</Text>
          </TouchableOpacity>
        </View>

        {/* Actions */}
        <TouchableOpacity style={styles.signOutBtn} onPress={clearAuth}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* Dev */}
        <TouchableOpacity
          style={styles.devBtn}
          onPress={() => navigation.navigate('NotificationTest')}
        >
          <Text style={styles.devBtnText}>Test Notifications</Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const ACCENT = '#6C63FF';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F1A' },
  content: { paddingBottom: 48 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F0F1A' },

  hero: {
    backgroundColor: '#13132b',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingBottom: 32,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    borderBottomWidth: 1,
    borderColor: ACCENT + '30',
    marginBottom: 24,
  },
  backBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 44,
    left: 20,
    zIndex: 10,
    padding: 4,
  },
  backText: { color: ACCENT, fontSize: 15, fontWeight: '600' },

  avatarRing: {
    width: 116,
    height: 116,
    borderRadius: 58,
    borderWidth: 3,
    borderColor: ACCENT,
    padding: 3,
    marginBottom: 16,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 14,
    elevation: 12,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 52,
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    borderRadius: 52,
    backgroundColor: ACCENT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 40, fontWeight: '800' },
  editOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1a1a2e',
    borderWidth: 2,
    borderColor: ACCENT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editOverlayText: { fontSize: 14 },

  displayName: { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: 0.2 },
  username: { color: '#b0b0dd', fontSize: 14, marginTop: 4 },

  changePhotoBtn: {
    marginTop: 14,
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: ACCENT + '20',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: ACCENT + '60',
  },
  changePhotoText: { color: ACCENT, fontSize: 13, fontWeight: '600' },

  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: '#13132b',
    borderRadius: 20,
    paddingVertical: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2a2a44',
  },
  statCard: { flex: 1, alignItems: 'center' },
  statEmoji: { fontSize: 22, marginBottom: 6 },
  statValue: { color: '#fff', fontSize: 28, fontWeight: '900' },
  statLabel: { color: '#aaa', fontSize: 12, marginTop: 4, letterSpacing: 0.5 },
  statDivider: { width: 1, backgroundColor: '#2a2a44', marginVertical: 8 },

  card: {
    backgroundColor: '#13132b',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2a2a44',
  },
  cardTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 16 },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start' },
  fieldLabel: { color: '#aaa', fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  fieldValue: { color: '#f0f0f0', fontSize: 15, lineHeight: 22 },

  input: {
    backgroundColor: '#0c0c1a',
    borderWidth: 1,
    borderColor: '#2a2a44',
    borderRadius: 12,
    padding: 13,
    color: '#fff',
    fontSize: 15,
    marginBottom: 4,
  },
  bioInput: { height: 90, textAlignVertical: 'top' },

  editActions: { flexDirection: 'row', gap: 12, marginTop: 18 },
  cancelBtn: {
    flex: 1, paddingVertical: 13, borderRadius: 12,
    borderWidth: 1, borderColor: '#333', alignItems: 'center',
  },
  cancelText: { color: '#bbb', fontWeight: '600' },
  saveBtn: {
    flex: 2, paddingVertical: 13, borderRadius: 12,
    backgroundColor: ACCENT, alignItems: 'center',
    shadowColor: ACCENT, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 8,
  },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  editBtn: {
    marginTop: 18,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ACCENT,
    alignItems: 'center',
    backgroundColor: ACCENT + '12',
  },
  editBtnText: { color: ACCENT, fontWeight: '700', fontSize: 14 },

  socialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  socialBtn: {
    width: '47%',
    backgroundColor: '#13132b',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a44',
    gap: 6,
  },
  socialIcon: { fontSize: 22 },
  socialBtnText: { color: '#e8e8e8', fontSize: 13, fontWeight: '600' },

  signOutBtn: {
    marginHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 14,
    backgroundColor: '#E5393520',
    borderWidth: 1,
    borderColor: '#E53935',
    alignItems: 'center',
    marginBottom: 12,
  },
  signOutText: { color: '#E53935', fontWeight: '700', fontSize: 15 },

  devBtn: {
    marginHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2a2a3a',
    alignItems: 'center',
  },
  devBtnText: { color: '#999', fontWeight: '600', fontSize: 13 },
});

