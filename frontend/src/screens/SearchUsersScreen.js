import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, FlatList,
  TouchableOpacity, Image, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSearchUsers, useSendFriendRequest } from '../hooks/useFriends';
import { useToast } from '../context/ToastContext';

function UserAvatar({ user, size = 44 }) {
  const initials = (user.name || user.username || '?')[0].toUpperCase();
  if (user.avatar) {
    return <Image source={{ uri: user.avatar }} style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]} />;
  }
  return (
    <View style={[styles.avatarFallback, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={styles.avatarInitial}>{initials}</Text>
    </View>
  );
}

function FriendButton({ user, onSend, loading }) {
  const f = user.friendship;

  if (f?.status === 'accepted') {
    return <View style={[styles.badge, styles.badgeFriends]}><Text style={styles.badgeText}>Friends</Text></View>;
  }
  if (f?.status === 'pending') {
    return <View style={[styles.badge, styles.badgePending]}><Text style={styles.badgeText}>Pending</Text></View>;
  }
  if (f?.status === 'declined') {
    return null;
  }
  return (
    <TouchableOpacity
      style={styles.addBtn}
      onPress={() => onSend(user._id)}
      disabled={loading}
    >
      {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.addBtnText}>+ Add</Text>}
    </TouchableOpacity>
  );
}

export default function SearchUsersScreen() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [sendingId, setSendingId] = useState(null);
  const { showToast } = useToast();
  const debounceRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const { data: users, isLoading } = useSearchUsers(debouncedQuery);
  const { mutateAsync: sendRequest } = useSendFriendRequest();

  const handleSend = async (receiverId) => {
    setSendingId(receiverId);
    try {
      await sendRequest(receiverId);
      showToast('Friend request sent!', 'success');
    } catch (e) {
      showToast(e?.response?.data?.message || 'Failed to send request', 'error');
    } finally {
      setSendingId(null);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <TextInput
        style={styles.searchInput}
        value={query}
        onChangeText={setQuery}
        placeholder="Search by name or username..."
        placeholderTextColor="#666"
        autoCapitalize="none"
        autoCorrect={false}
      />

      {isLoading && debouncedQuery.length >= 2 && (
        <ActivityIndicator color="#6C63FF" style={{ marginTop: 24 }} />
      )}

      {!isLoading && debouncedQuery.length >= 2 && users?.length === 0 && (
        <Text style={styles.empty}>No users found for "{debouncedQuery}"</Text>
      )}

      <FlatList
        data={users || []}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <UserAvatar user={item} />
            <View style={styles.info}>
              <Text style={styles.name}>{item.name || item.username}</Text>
              <Text style={styles.username}>@{item.username}</Text>
            </View>
            <FriendButton
              user={item}
              onSend={handleSend}
              loading={sendingId === item._id}
            />
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a', padding: 16 },
  searchInput: {
    backgroundColor: '#1a1a2e',
    color: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#2a2a3e',
    marginBottom: 16,
  },
  empty: { color: '#666', textAlign: 'center', marginTop: 32, fontSize: 14 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a2e',
  },
  avatar: { resizeMode: 'cover' },
  avatarFallback: {
    backgroundColor: '#6C63FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { color: '#fff', fontWeight: '700', fontSize: 18 },
  info: { flex: 1, marginLeft: 12 },
  name: { color: '#fff', fontWeight: '600', fontSize: 15 },
  username: { color: '#888', fontSize: 12, marginTop: 2 },
  addBtn: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    minWidth: 68,
    alignItems: 'center',
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  badgeFriends: { backgroundColor: '#1a3a1a' },
  badgePending: { backgroundColor: '#2a2a1a' },
  badgeText: { color: '#aaa', fontSize: 12, fontWeight: '600' },
});
