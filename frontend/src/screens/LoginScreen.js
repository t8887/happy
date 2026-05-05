import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLogin } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';

export default function LoginScreen({ navigation, route }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { mutate: login, isPending } = useLogin();
  const { showToast } = useToast();

  useEffect(() => {
    if (route?.params?.passwordReset) {
      showToast('Password reset! Please log in.', 'success');
    }
  }, [route?.params?.passwordReset]);

  const handleLogin = () => {
    if (!email.trim() || !password.trim()) {
      showToast('Please fill in all fields', 'error');
      return;
    }
    login(
      { email: email.trim().toLowerCase(), password },
      { onError: (err) => showToast(err?.response?.data?.message || 'Login failed', 'error') }
    );
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text style={styles.logo}>LifeFeed</Text>
      <Text style={styles.tagline}>Track your life. Earn your streak.</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#555"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#555"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={isPending}>
          {isPending ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>Login</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.link}>Don't have an account? <Text style={styles.linkBold}>Sign up</Text></Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgotBtn}>
          <Text style={styles.forgotText}>Forgot password?</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f', justifyContent: 'center', paddingHorizontal: 24 },
  logo: { fontSize: 42, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 6 },
  tagline: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 40 },
  form: { gap: 12 },
  input: {
    backgroundColor: '#1a1a1a', color: '#fff', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, borderWidth: 1, borderColor: '#2a2a2a',
  },
  btn: {
    backgroundColor: '#fff', borderRadius: 12,
    paddingVertical: 14, alignItems: 'center', marginTop: 4,
  },
  btnText: { color: '#000', fontWeight: '700', fontSize: 16 },
  link: { color: '#555', textAlign: 'center', marginTop: 16, fontSize: 14 },
  linkBold: { color: '#fff', fontWeight: '600' },
  forgotBtn: { alignItems: 'center', marginTop: 8 },
  forgotText: { color: '#6C63FF', fontSize: 14, fontWeight: '600' },
});
