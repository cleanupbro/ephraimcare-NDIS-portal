import { useState, useRef } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native'
import { setPin as savePinToStore } from '../lib/pin-auth'

interface PinSetupProps {
  onComplete: () => void
  onSkip?: () => void
}

export function PinSetup({ onComplete, onSkip }: PinSetupProps) {
  const [step, setStep] = useState<'enter' | 'confirm'>('enter')
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const confirmInputRef = useRef<TextInput>(null)

  const handlePinChange = (value: string) => {
    // Only allow digits
    const cleaned = value.replace(/\D/g, '').slice(0, 6)

    if (step === 'enter') {
      setPin(cleaned)
      setError(null)
    } else {
      setConfirmPin(cleaned)
      setError(null)
    }
  }

  const handleConfirm = async () => {
    if (confirmPin !== pin) {
      setError('PINs do not match')
      setConfirmPin('')
      return
    }

    setIsLoading(true)
    const result = await savePinToStore(pin)
    setIsLoading(false)

    if (result.success) {
      onComplete()
    } else {
      setError(result.error || 'Failed to save PIN')
    }
  }

  const handleBack = () => {
    setStep('enter')
    setConfirmPin('')
    setError(null)
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {step === 'enter' ? 'Create Your PIN' : 'Confirm Your PIN'}
      </Text>
      <Text style={styles.subtitle}>
        {step === 'enter'
          ? 'Enter a 4-6 digit PIN for quick authentication'
          : 'Re-enter your PIN to confirm'}
      </Text>

      <View style={styles.pinContainer}>
        {step === 'enter' ? (
          <TextInput
            style={styles.pinInput}
            value={pin}
            onChangeText={handlePinChange}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={6}
            autoFocus
            placeholder="Enter PIN"
            placeholderTextColor="#999"
          />
        ) : (
          <TextInput
            ref={confirmInputRef}
            style={styles.pinInput}
            value={confirmPin}
            onChangeText={handlePinChange}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={6}
            autoFocus
            placeholder="Confirm PIN"
            placeholderTextColor="#999"
          />
        )}

        {/* PIN dots indicator */}
        <View style={styles.dotsContainer}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i < (step === 'enter' ? pin.length : confirmPin.length)
                  ? styles.dotFilled
                  : styles.dotEmpty,
              ]}
            />
          ))}
        </View>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.buttonContainer}>
        {step === 'confirm' && (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}

        {step === 'enter' && pin.length >= 4 && (
          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => {
              setStep('confirm')
              confirmInputRef.current?.focus()
            }}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        )}

        {step === 'confirm' && confirmPin.length >= 4 && (
          <TouchableOpacity
            style={[styles.continueButton, isLoading && styles.buttonDisabled]}
            onPress={handleConfirm}
            disabled={isLoading}
          >
            <Text style={styles.continueButtonText}>
              {isLoading ? 'Saving...' : 'Save PIN'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {onSkip && step === 'enter' && (
        <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
          <Text style={styles.skipButtonText}>Skip for now</Text>
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  pinContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  pinInput: {
    fontSize: 32,
    letterSpacing: 8,
    textAlign: 'center',
    width: '100%',
    paddingVertical: 16,
    borderWidth: 0,
    // Hide the actual input, we show dots instead
    position: 'absolute',
    opacity: 0,
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
  error: {
    color: '#E53935',
    textAlign: 'center',
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#66BB6A',
  },
  backButtonText: {
    color: '#66BB6A',
    fontSize: 16,
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: '#66BB6A',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  skipButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#999',
    fontSize: 14,
  },
})
