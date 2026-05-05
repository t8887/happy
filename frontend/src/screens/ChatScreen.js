import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
  ActivityIndicator,
} from 'react-native';
import { useConversation, useSendMessage } from '../hooks/useMessages';
import useAuthStore from '../store/authStore';

export default function ChatScreen({ route, navigation }) {
  const { friend } = route.params;
  const { user: me } = useAuthStore();
  const [text, setText] = useState('');
  const flatListRef = useRef(null);

  const { data: messages, isLoading } = useConversation(friend._id);
  const { mutateAsync: sendMessage, isPending: sending } = useSendMessage();

  // Set header title to friend's name
  useEffect(() => {
    navigation.setOptions({ title: friend.name || friend.username });
  }, [friend]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages?.length) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages?.length]);

  const handleSend = async () => {
    const content = text.trim();
    if (!content || sending) return;
    setText('');
    try {
      await sendMessage({ receiverId: friend._id, content });
    } catch {
      // message failed — could show toast here
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#6C63FF" size="large" />
      </View>
    );
  }

  const myId = me?._id || me?.id;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages || []}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySub}>Say hello to {friend.name || friend.username}!</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isMine = item.sender.toString() === myId || item.sender === myId;
          return (
            <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
              <Text style={[styles.bubbleText, isMine ? styles.bubbleTextMine : styles.bubbleTextTheirs]}>
                {item.content}
              </Text>
              <Text style={[styles.bubbleTime, isMine ? styles.bubbleTimeMine : styles.bubbleTimeTheirs]}>
                {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          );
        }}
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Type a message..."
          placeholderTextColor="#555"
          multiline
          maxLength={2000}
          returnKeyType="default"
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!text.trim() || sending}
        >
          {sending
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.sendBtnText}>↑</Text>
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  centered: { flex: 1, backgroundColor: '#0f0f1a', alignItems: 'center', justifyContent: 'center' },
  messageList: { padding: 16, paddingBottom: 8, flexGrow: 1 },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyText: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 6 },
  emptySub: { color: '#555', fontSize: 13 },

  bubble: {
    maxWidth: '75%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginBottom: 8,
  },
  bubbleMine: {
    backgroundColor: '#6C63FF',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: '#1a1a2e',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  bubbleText: { fontSize: 15, lineHeight: 20 },
  bubbleTextMine: { color: '#fff' },
  bubbleTextTheirs: { color: '#ddd' },
  bubbleTime: { fontSize: 10, marginTop: 3 },
  bubbleTimeMine: { color: 'rgba(255,255,255,0.6)', textAlign: 'right' },
  bubbleTimeTheirs: { color: '#555' },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#1a1a2e',
    backgroundColor: '#0f0f1a',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    color: '#fff',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  sendBtn: {
    width: 44, height: 44,
    borderRadius: 22,
    backgroundColor: '#6C63FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#2a2a3e' },
  sendBtnText: { color: '#fff', fontSize: 20, fontWeight: '700' },
});
