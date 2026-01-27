import * as SecureStore from 'expo-secure-store'
import * as Crypto from 'expo-crypto'

const PIN_KEY = 'worker_pin_hash'
const PIN_SALT = 'ephraim_care_pin_salt_v1'

/**
 * Hash PIN using SHA-256
 * Uses a salt to prevent rainbow table attacks
 */
async function hashPin(pin: string): Promise<string> {
  const saltedPin = pin + PIN_SALT
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    saltedPin
  )
  return hash
}

/**
 * Check if worker has set up a PIN
 */
export async function hasPin(): Promise<boolean> {
  const stored = await SecureStore.getItemAsync(PIN_KEY)
  return stored !== null
}

/**
 * Set worker's PIN
 * PIN must be 4-6 digits
 */
export async function setPin(pin: string): Promise<{ success: boolean; error?: string }> {
  // Validate PIN format
  if (!/^\d{4,6}$/.test(pin)) {
    return { success: false, error: 'PIN must be 4-6 digits' }
  }

  try {
    const hashedPin = await hashPin(pin)
    await SecureStore.setItemAsync(PIN_KEY, hashedPin, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED,
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to save PIN:', error)
    return { success: false, error: 'Failed to save PIN' }
  }
}

/**
 * Verify entered PIN against stored PIN
 */
export async function verifyPin(pin: string): Promise<boolean> {
  try {
    const storedHash = await SecureStore.getItemAsync(PIN_KEY)
    if (!storedHash) return false

    const inputHash = await hashPin(pin)
    return storedHash === inputHash
  } catch (error) {
    console.error('PIN verification error:', error)
    return false
  }
}

/**
 * Clear stored PIN (for logout/reset)
 */
export async function clearPin(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(PIN_KEY)
  } catch (error) {
    console.error('Failed to clear PIN:', error)
  }
}

/**
 * Update PIN (requires current PIN verification)
 */
export async function updatePin(
  currentPin: string,
  newPin: string
): Promise<{ success: boolean; error?: string }> {
  const isValid = await verifyPin(currentPin)
  if (!isValid) {
    return { success: false, error: 'Current PIN is incorrect' }
  }

  return setPin(newPin)
}
