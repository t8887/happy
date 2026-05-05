import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Modal,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import DateTimePicker from '@react-native-community/datetimepicker';
import { requestNotificationPermission } from '../services/notifications';

export default function NotificationTestScreen({ navigation }) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [pickerDate, setPickerDate] = useState(new Date());
  const [scheduledTime, setScheduledTime] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [status, setStatus] = useState('');

  const trigger = async () => {
    if (!title.trim() || !message.trim()) {
      setStatus('⚠️ Title and message are required.');
      return;
    }

    const granted = await requestNotificationPermission();
    if (!granted) {
      setStatus('❌ Notification permission denied.');
      return;
    }

    try {
      if (scheduledTime) {
        // Schedule at the chosen time
        const [h, m] = scheduledTime.split(':').map(Number);
        await Notifications.scheduleNotificationAsync({
          content: {
            title: title.trim(),
            body: message.trim(),
            data: { type: 'test' },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: h,
            minute: m,
          },
        });
        setStatus(`✅ Scheduled daily at ${scheduledTime}`);
      } else {
        // Fire immediately (1-second delay so it shows as a real notification)
        await Notifications.scheduleNotificationAsync({
          content: {
            title: title.trim(),
            body: message.trim(),
            data: { type: 'test' },
          },
          trigger: { seconds: 1 },
        });
        setStatus('✅ Notification sent!');
      }

      setTitle('');
      setMessage('');
      setScheduledTime('');
    } catch (e) {
      setStatus(`❌ Error: ${e.message}`);
    }
  };

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
          <Text style={styles.title}>Notification Test</Text>
          <View style={{ width: 60 }} />
        </View>

        <Text style={styles.desc}>
          Send a test local notification immediately or schedule one at a chosen time.
        </Text>

        {/* Title */}
        <Text style={styles.label}>Notification Title</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Daily Check-in"
          placeholderTextColor="#555"
        />

        {/* Message */}
        <Text style={styles.label}>Message</Text>
        <TextInput
          style={[styles.input, styles.messageInput]}
          value={message}
          onChangeText={setMessage}
          placeholder="e.g. Time to complete your tasks!"
          placeholderTextColor="#555"
          multiline
        />

        {/* Time picker */}
        <Text style={styles.label}>Schedule at time (optional)</Text>
        {Platform.OS === 'web' ? (
          <TextInput
            style={styles.timePickerBtn}
            value={scheduledTime}
            onChangeText={(val) => {
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
            {scheduledTime ? `⏰  ${scheduledTime}` : 'Tap to choose a time...'}
          </Text>
          {scheduledTime ? (
            <TouchableOpacity onPress={() => setScheduledTime('')}>
              <Text style={styles.timeClearText}>×</Text>
            </TouchableOpacity>
          ) : null}
        </TouchableOpacity>
        )}

        {/* iOS picker modal */}
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

        {/* Android picker */}
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

        {/* Status message */}
        {status ? <Text style={styles.statusText}>{status}</Text> : null}

        {/* Trigger button */}
        <TouchableOpacity style={styles.triggerBtn} onPress={trigger}>
          <Text style={styles.triggerBtnText}>
            {scheduledTime ? `Schedule at ${scheduledTime}` : 'Send Now'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  content: { padding: 20, paddingBottom: 60 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 60, marginBottom: 24,
  },
  backBtn: { padding: 4 },
  backText: { color: '#6C63FF', fontSize: 15 },
  title: { color: '#fff', fontSize: 18, fontWeight: '700' },
  desc: { color: '#888', fontSize: 13, marginBottom: 24, lineHeight: 20 },

  label: { color: '#888', fontSize: 12, marginBottom: 6, marginTop: 16 },
  input: {
    backgroundColor: '#1a1a2e', color: '#fff', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 13, fontSize: 15,
    borderWidth: 1, borderColor: '#2a2a3a',
  },
  messageInput: { height: 90, textAlignVertical: 'top' },

  timePickerBtn: {
    backgroundColor: '#1a1a2e', borderRadius: 12, borderWidth: 1, borderColor: '#2a2a3a',
    paddingHorizontal: 16, paddingVertical: 13, marginTop: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  timePickerBtnText: { color: '#aaa', fontSize: 15 },
  timeClearText: { color: '#f87171', fontSize: 18, fontWeight: '700', paddingHorizontal: 4 },

  pickerOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end',
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

  statusText: {
    marginTop: 16, color: '#a78bfa', fontSize: 13, textAlign: 'center',
  },
  triggerBtn: {
    marginTop: 28, backgroundColor: '#6C63FF', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
  },
  triggerBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
