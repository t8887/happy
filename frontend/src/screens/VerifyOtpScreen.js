import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import api from '../services/api';

export default function VerifyOtpScreen({ navigation, route }) {
  const { email } = route.params;
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [resent, setResent] = useState(false);

  const handleVerify = async () => {
    setError('');
    if (code.trim().length !== 6) { setError('Enter the 6-digit code.'); return; }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-otp', { email, code: code.trim() });
      navigation.navigate('ResetPassword', { email, resetToken: data.resetToken });
    } catch (e) {
      setError(e?.response?.data?.message || 'Invalid or expired code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email });
      setResent(true);
    } catch (e) {
      setError('Could not resend. Please go back and try again.');
    } finally {
      setResending(false);
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

      <Text style={styles.title}>Enter Code</Text>
      <Text style={styles.subtitle}>
        We sent a 6-digit code to{'\n'}
        <Text style={styles.emailText}>{email}</Text>
      </Text>

      <TextInput
        style={styles.codeInput}
        placeholder="_ _ _ _ _ _"
        placeholderTextColor="#444"
        keyboardType="number-pad"
        maxLength={6}
        value={code}
        onChangeText={setCode}
        textAlign="center"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {resent ? <Text style={styles.success}>Code resent!</Text> : null}

      <TouchableOpacity style={styles.btn} onPress={handleVerify} disabled={loading}>
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.btnText}>Verify</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity style={styles.resendBtn} onPress={handleResend} disabled={resending}>
        {resending
          ? <ActivityIndicator color="#6C63FF" size="small" />
          : <Text style={styles.resendText}>Resend code</Text>
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
  emailText: { color: '#a78bfa', fontWeight: '600' },
  codeInput: {
    backgroundColor: '#1a1a2e', color: '#fff', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 18, fontSize: 28,
    borderWidth: 1, borderColor: '#2a2a3a', letterSpacing: 12,
    marginBottom: 8,
  },
  error: { color: '#f87171', fontSize: 13, marginBottom: 8, marginLeft: 4 },
  success: { color: '#4ade80', fontSize: 13, marginBottom: 8, marginLeft: 4 },
  btn: {
    backgroundColor: '#6C63FF', borderRadius: 12,
    paddingVertical: 15, alignItems: 'center', marginTop: 8,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  resendBtn: { alignItems: 'center', marginTop: 20 },
  resendText: { color: '#6C63FF', fontSize: 14, fontWeight: '600' },
});
