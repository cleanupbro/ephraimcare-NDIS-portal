import { useState } from 'react'
import { View, KeyboardAvoidingView, Platform } from 'react-native'
import { TextInput, Button, Text, HelperText } from 'react-native-paper'
import { useSession } from '../hooks/useAuth'

export default function LoginScreen() {
  const { signIn } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required')
      return
    }
    setError(null)
    setLoading(true)
    const signInError = await signIn(email.trim(), password)
    if (signInError) setError(signInError)
    setLoading(false)
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' }}>
        <Text variant="headlineMedium" style={{ textAlign: 'center', color: '#66BB6A', fontWeight: 'bold', marginBottom: 8 }}>
          Ephraim Care
        </Text>
        <Text variant="bodyMedium" style={{ textAlign: 'center', color: '#666', marginBottom: 32 }}>
          Worker App
        </Text>

        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          mode="outlined"
          style={{ marginBottom: 16 }}
          outlineColor="#ccc"
          activeOutlineColor="#66BB6A"
        />

        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          mode="outlined"
          style={{ marginBottom: 8 }}
          outlineColor="#ccc"
          activeOutlineColor="#66BB6A"
          right={
            <TextInput.Icon
              icon={showPassword ? 'eye-off' : 'eye'}
              onPress={() => setShowPassword(!showPassword)}
            />
          }
        />

        {error && (
          <HelperText type="error" visible={!!error} style={{ marginBottom: 8 }}>
            {error}
          </HelperText>
        )}

        <Button
          mode="contained"
          onPress={handleLogin}
          loading={loading}
          disabled={loading}
          style={{ marginTop: 16, borderRadius: 8 }}
          buttonColor="#66BB6A"
        >
          Sign In
        </Button>
      </View>
    </KeyboardAvoidingView>
  )
}
