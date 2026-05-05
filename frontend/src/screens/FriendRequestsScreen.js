import React from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, Image, ActivityIndicator,
} from 'react-native';
import { useFriendRequests, useAcceptFriendRequest, useDeclineFriendRequest } from '../hooks/useFriends';
import { useToast } from '../context/ToastContext';

function UserAvatar({ user, size = 44 }) {
  const initials = (user.name || user.username || '?')[0].toUpperCase();
  if (user.avatar) {
    return (
      <Image
        source={{ uri: user.avatar }}
        style={{ width: size, height: size, borderRadius: size / 2, resizeMode: 'cover' }}
      />
    );
  }
  return (
    <View style={[styles.avatarFallback, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={styles.avatarInitial}>{initials}</Text>
    </View>
  );
}

export default function FriendRequestsScreen() {
  const { showToast } = useToast();
  const { data: requests, isLoading, refetch } = useFriendRequests();
  const { mutateAsync: accept } = useAcceptFriendRequest();
  const { mutateAsync: decline } = useDeclineFriendRequest();

  const handleAccept = async (friendshipId) => {
    try {
      await accept(friendshipId);
      showToast('Friend request accepted!', 'success');
      refetch();
    } catch {
      showToast('Failed to accept request', 'error');
    }
  };

  const handleDecline = async (friendshipId) => {
    try {
      await decline(friendshipId);
      showToast('Request declined', 'info');
      refetch();
    } catch {
      showToast('Failed to decline request', 'error');
    }
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
      {(!requests || requests.length === 0) ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyEmoji}>📭</Text>
          <Text style={styles.emptyText}>No pending requests</Text>
          <Text style={styles.emptySub}>When someone sends you a friend request, it'll show up here.</Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <UserAvatar user={item.sender} />
              <View style={styles.info}>
                <Text style={styles.name}>{item.sender.name || item.sender.username}</Text>
                <Text style={styles.username}>@{item.sender.username}</Text>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.acceptBtn}
                  onPress={() => handleAccept(item._id)}
                >
                  <Text style={styles.acceptText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.declineBtn}
                  onPress={() => handleDecline(item._id)}
                >
                  <Text style={styles.declineText}>Decline</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a', padding: 16 },
  centered: { flex: 1, backgroundColor: '#0f0f1a', alignItems: 'center', justifyContent: 'center' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptySub: { color: '#666', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  avatarFallback: {
    backgroundColor: '#6C63FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { color: '#fff', fontWeight: '700', fontSize: 18 },
  info: { flex: 1, marginLeft: 12 },
  name: { color: '#fff', fontWeight: '600', fontSize: 15 },
  username: { color: '#888', fontSize: 12, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8 },
  acceptBtn: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  acceptText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  declineBtn: {
    backgroundColor: '#2a1a1a',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#5a2a2a',
  },
  declineText: { color: '#e57373', fontWeight: '600', fontSize: 13 },
});
