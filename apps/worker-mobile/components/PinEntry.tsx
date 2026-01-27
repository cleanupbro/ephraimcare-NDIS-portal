import { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Vibration,
} from 'react-native'
import { verifyPin } from '../lib/pin-auth'

interface PinEntryProps {
  onSuccess: () => void
  onCancel?: () => void
  maxAttempts?: number
}

export function PinEntry({ onSuccess, onCancel, maxAttempts = 5 }: PinEntryProps) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [attempts, setAttempts] = useState(0)
  const [isLocked, setIsLocked] = useState(false)
  const [lockCountdown, setLockCountdown] = useState(0)

  // Lockout timer
  useEffect(() => {
    if (lockCountdown > 0) {
      const timer = setTimeout(() => setLockCountdown(lockCountdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (isLocked && lockCountdown === 0) {
      setIsLocked(false)
      setAttempts(0)
    }
  }, [lockCountdown, isLocked])

  const handlePinChange = async (value: string) => {
    if (isLocked) return

    const cleaned = value.replace(/\D/g, '').slice(0, 6)
    setPin(cleaned)
    setError(null)

    // Auto-verify when 4+ digits
    if (cleaned.length >= 4) {
      const isValid = await verifyPin(cleaned)

      if (isValid) {
        onSuccess()
      } else {
        Vibration.vibrate(200)
        const newAttempts = attempts + 1
        setAttempts(newAttempts)
        setPin('')

        if (newAttempts >= maxAttempts) {
          setIsLocked(true)
          setLockCountdown(30) // 30 second lockout
          setError('Too many attempts. Try again in 30 seconds.')
        } else {
          setError(`Incorrect PIN. ${maxAttempts - newAttempts} attempts remaining.`)
        }
      }
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter Your PIN</Text>

      <View style={styles.pinContainer}>
        <TextInput
          style={styles.pinInput}
          value={pin}
          onChangeText={handlePinChange}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={6}
          autoFocus
          editable={!isLocked}
        />

        {/* PIN dots indicator */}
        <View style={styles.dotsContainer}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i < pin.length ? styles.dotFilled : styles.dotEmpty,
                error ? styles.dotError : null,
              ]}
            />
          ))}
        </View>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      {isLocked && (
        <Text style={styles.lockText}>
          Locked for {lockCountdown} seconds
        </Text>
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
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 32,
  },
  pinContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  pinInput: {
    position: 'absolute',
    opacity: 0,
    width: '100%',
    height: 50,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#66BB6A',
  },
  dotEmpty: {
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: '#66BB6A',
  },
  dotError: {
    borderColor: '#E53935',
    backgroundColor: '#E53935',
  },
  error: {
    color: '#E53935',
    textAlign: 'center',
    marginBottom: 16,
  },
  lockText: {
    color: '#FF9800',
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 16,
  },
  cancelButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
})
