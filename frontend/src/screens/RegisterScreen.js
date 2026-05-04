import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRegister } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';

export default function RegisterScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { mutate: register, isPending } = useRegister();
  const { showToast } = useToast();

  const handleRegister = () => {
    if (!username.trim() || !email.trim() || !password.trim()) {
      showToast('Please fill in all fields', 'error');
      return;
    }
    if (password.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    register(
      { username: username.trim(), email: email.trim().toLowerCase(), password },
      { onError: (err) => showToast(err?.response?.data?.message || 'Registration failed', 'error') }
    );
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text style={styles.logo}>LifeFeed</Text>
      <Text style={styles.tagline}>Start your journey today.</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#555"
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
        />
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
          placeholder="Password (min 6 chars)"
          placeholderTextColor="#555"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={isPending}>
          {isPending ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>Create Account</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>Already have an account? <Text style={styles.linkBold}>Login</Text></Text>
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
});
