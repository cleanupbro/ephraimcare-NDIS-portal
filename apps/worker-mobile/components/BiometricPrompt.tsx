import { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import {
  checkBiometricSupport,
  authenticateWithBiometrics,
  getBiometricLabel,
  type BiometricStatus,
} from '../lib/biometrics'
import { hasPin } from '../lib/pin-auth'
import { PinEntry } from './PinEntry'

interface BiometricPromptProps {
  title?: string
  subtitle?: string
  onSuccess: () => void
  onCancel?: () => void
}

export function BiometricPrompt({
  title = 'Authenticate',
  subtitle = 'Verify your identity to continue',
  onSuccess,
  onCancel,
}: BiometricPromptProps) {
  const [biometricStatus, setBiometricStatus] = useState<BiometricStatus | null>(null)
  const [showPinFallback, setShowPinFallback] = useState(false)
  const [hasPinSet, setHasPinSet] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAuthStatus()
  }, [])

  const loadAuthStatus = async () => {
    const [bioStatus, pinStatus] = await Promise.all([
      checkBiometricSupport(),
      hasPin(),
    ])
    setBiometricStatus(bioStatus)
    setHasPinSet(pinStatus)

    // If biometrics available and enrolled, auto-trigger
    if (bioStatus.supported && bioStatus.enrolled) {
      handleBiometricAuth()
    } else if (pinStatus) {
      // No biometrics, but has PIN - show PIN
      setShowPinFallback(true)
    }
  }

  const handleBiometricAuth = async () => {
    setIsAuthenticating(true)
    setError(null)

    const result = await authenticateWithBiometrics(title)

    setIsAuthenticating(false)

    if (result.success) {
      onSuccess()
    } else if (result.errorType === 'fallback' || result.errorType === 'user_cancel') {
      // User wants to use PIN
      if (hasPinSet) {
        setShowPinFallback(true)
      } else {
        setError('PIN not set up. Please contact your administrator.')
      }
    } else {
      setError(result.error || 'Authentication failed')
    }
  }

  // Show PIN entry
  if (showPinFallback) {
    return (
      <PinEntry
        onSuccess={onSuccess}
        onCancel={() => {
          if (biometricStatus?.supported && biometricStatus?.enrolled) {
            setShowPinFallback(false)
          } else {
            onCancel?.()
          }
        }}
      />
    )
  }

  // Loading state
  if (!biometricStatus) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#66BB6A" />
      </View>
    )
  }

  const biometricIcon = biometricStatus.type === 'facial' ? 'scan' : 'finger-print'
  const biometricLabel = getBiometricLabel(biometricStatus.type)

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      {biometricStatus.supported && biometricStatus.enrolled && (
        <TouchableOpacity
          style={styles.biometricButton}
          onPress={handleBiometricAuth}
          disabled={isAuthenticating}
        >
          {isAuthenticating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name={biometricIcon as any} size={48} color="#fff" />
              <Text style={styles.biometricButtonText}>
                Use {biometricLabel}
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      {hasPinSet && (
        <TouchableOpacity
          style={styles.pinButton}
          onPress={() => setShowPinFallback(true)}
        >
          <Ionicons name="keypad" size={20} color="#66BB6A" />
          <Text style={styles.pinButtonText}>Use PIN instead</Text>
        </TouchableOpacity>
      )}

      {onCancel && (
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  biometricButton: {
    backgroundColor: '#66BB6A',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  biometricButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  error: {
    color: '#E53935',
    textAlign: 'center',
    marginBottom: 16,
  },
  pinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#66BB6A',
    gap: 8,
  },
  pinButtonText: {
    color: '#66BB6A',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: 24,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
})
