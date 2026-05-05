import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import api from '../services/api';

export default function ResetPasswordScreen({ navigation, route }) {
  const { email, resetToken } = route.params;
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleReset = async () => {
    setError('');
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, resetToken, newPassword: password });
      // Go back to Login and show success
      navigation.reset({ index: 0, routes: [{ name: 'Login', params: { passwordReset: true } }] });
    } catch (e) {
      setError(e?.response?.data?.message || 'Reset failed. Please start over.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>New Password</Text>
      <Text style={styles.subtitle}>Choose a strong password for your account.</Text>

      <TextInput
        style={styles.input}
        placeholder="New password"
        placeholderTextColor="#555"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm password"
        placeholderTextColor="#555"
        secureTextEntry
        value={confirm}
        onChangeText={setConfirm}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity style={styles.btn} onPress={handleReset} disabled={loading}>
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.btnText}>Reset Password</Text>
        }
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#0f0f1a',
    paddingHorizontal: 24, paddingTop: 80,
  },
  backBtn: { marginBottom: 36 },
  backText: { color: '#6C63FF', fontSize: 15 },
  title: { color: '#fff', fontSize: 26, fontWeight: '800', marginBottom: 10 },
  subtitle: { color: '#888', fontSize: 14, lineHeight: 22, marginBottom: 32 },
  input: {
    backgroundColor: '#1a1a2e', color: '#fff', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 15,
    borderWidth: 1, borderColor: '#2a2a3a', marginBottom: 12,
  },
  error: { color: '#f87171', fontSize: 13, marginBottom: 8, marginLeft: 4 },
  btn: {
    backgroundColor: '#6C63FF', borderRadius: 12,
    paddingVertical: 15, alignItems: 'center', marginTop: 8,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
