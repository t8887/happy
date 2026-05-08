import React from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, Image, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFriendList } from '../hooks/useFriends';

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

export default function FriendListScreen({ navigation }) {
  const { data: friends, isLoading } = useFriendList();

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#6C63FF" size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {(!friends || friends.length === 0) ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyEmoji}>👥</Text>
          <Text style={styles.emptyText}>No friends yet</Text>
          <Text style={styles.emptySub}>Search for users and send them a friend request!</Text>
        </View>
      ) : (
        <FlatList
          data={friends}
          keyExtractor={(item) => item.friendshipId}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <UserAvatar user={item.user} />
              <View style={styles.info}>
                <Text style={styles.name}>{item.user.name || item.user.username}</Text>
                <Text style={styles.username}>@{item.user.username}</Text>
              </View>
              <TouchableOpacity
                style={styles.msgBtn}
                onPress={() => navigation.navigate('Chat', { friend: item.user })}
              >
                <Text style={styles.msgBtnText}>💬 Message</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </SafeAreaView>
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
  msgBtn: {
    backgroundColor: '#1a1a3e',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#6C63FF',
  },
  msgBtnText: { color: '#6C63FF', fontWeight: '600', fontSize: 13 },
});
