import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import api from '../services/api';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    setError('');
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) { setError('Please enter your email.'); return; }

    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: trimmed });
      setSent(true);
      navigation.navigate('VerifyOtp', { email: trimmed });
    } catch (e) {
      setError(e?.response?.data?.message || 'Something went wrong.');
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

      <Text style={styles.title}>Forgot Password</Text>
      <Text style={styles.subtitle}>
        Enter the email address linked to your account and we'll send you a 6-digit code.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Email address"
        placeholderTextColor="#555"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {sent ? (
        <View style={styles.hintBox}>
          <Text style={styles.hintText}>Use code <Text style={styles.hintCode}>111111</Text> to reset your password.</Text>
        </View>
      ) : null}

      <TouchableOpacity style={styles.btn} onPress={handleSubmit} disabled={loading}>
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.btnText}>Send Code</Text>
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
    borderWidth: 1, borderColor: '#2a2a3a', marginBottom: 8,
  },
  error: { color: '#f87171', fontSize: 13, marginBottom: 8, marginLeft: 4 },
  hintBox: {
    backgroundColor: '#1a1a2e', borderRadius: 12, borderWidth: 1,
    borderColor: '#6C63FF', padding: 14, marginBottom: 8,
  },
  hintText: { color: '#aaa', fontSize: 14 },
  hintCode: { color: '#a78bfa', fontWeight: '800', fontSize: 16 },
  btn: {
    backgroundColor: '#6C63FF', borderRadius: 12,
    paddingVertical: 15, alignItems: 'center', marginTop: 8,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
