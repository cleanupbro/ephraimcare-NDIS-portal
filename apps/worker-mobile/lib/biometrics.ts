import * as LocalAuthentication from 'expo-local-authentication'

export type BiometricType = 'fingerprint' | 'facial' | 'iris' | 'none'

export interface BiometricStatus {
  supported: boolean
  enrolled: boolean
  type: BiometricType
}

/**
 * Check if device supports biometric authentication
 */
export async function checkBiometricSupport(): Promise<BiometricStatus> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync()
  const isEnrolled = await LocalAuthentication.isEnrolledAsync()
  const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync()

  let type: BiometricType = 'none'
  if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    type = 'facial'
  } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    type = 'fingerprint'
  } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
    type = 'iris'
  }

  return {
    supported: hasHardware,
    enrolled: isEnrolled,
    type,
  }
}

export interface AuthResult {
  success: boolean
  error?: string
  errorType?: 'user_cancel' | 'system_cancel' | 'not_enrolled' | 'fallback' | 'unknown'
}

/**
 * Authenticate user with biometrics
 * Returns success/failure with error details
 */
export async function authenticateWithBiometrics(
  promptMessage: string = 'Authenticate to continue'
): Promise<AuthResult> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      fallbackLabel: 'Use PIN',
      disableDeviceFallback: true, // We handle our own PIN fallback
      cancelLabel: 'Cancel',
    })

    if (result.success) {
      return { success: true }
    }

    // Map error types
    let errorType: AuthResult['errorType'] = 'unknown'
    if (result.error === 'user_cancel') {
      errorType = 'user_cancel'
    } else if (result.error === 'system_cancel') {
      errorType = 'system_cancel'
    } else if (result.error === 'not_enrolled') {
      errorType = 'not_enrolled'
    } else if (result.error === 'user_fallback') {
      errorType = 'fallback'
    }

    return {
      success: false,
      error: result.error || 'Authentication failed',
      errorType,
    }
  } catch (error) {
    console.error('Biometric auth error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Biometric authentication failed',
      errorType: 'unknown',
    }
  }
}

/**
 * Get human-readable biometric type label
 */
export function getBiometricLabel(type: BiometricType): string {
  switch (type) {
    case 'facial':
      return 'Face ID'
    case 'fingerprint':
      return 'Fingerprint'
    case 'iris':
      return 'Iris'
    default:
      return 'Biometric'
  }
}
