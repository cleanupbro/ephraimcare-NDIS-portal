import { useState } from 'react'
import * as Location from 'expo-location'
import { GPS_TIMEOUT_MS, GPS_MAX_ACCURACY_METERS } from '../constants/config'

interface LocationState {
  latitude: number | null
  longitude: number | null
  accuracy: number | null
  loading: boolean
  error: string | null
}

export function useCurrentLocation() {
  const [state, setState] = useState<LocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    loading: false,
    error: null,
  })

  const requestLocation = async (): Promise<{ latitude: number; longitude: number } | null> => {
    setState((s) => ({ ...s, loading: true, error: null }))

    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        setState((s) => ({ ...s, loading: false, error: 'Location permission denied' }))
        return null
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: GPS_TIMEOUT_MS,
      })

      const { latitude, longitude, accuracy } = location.coords

      if (accuracy && accuracy > GPS_MAX_ACCURACY_METERS) {
        const retry = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation,
        })
        setState({
          latitude: retry.coords.latitude,
          longitude: retry.coords.longitude,
          accuracy: retry.coords.accuracy,
          loading: false,
          error: null,
        })
        return { latitude: retry.coords.latitude, longitude: retry.coords.longitude }
      }

      setState({ latitude, longitude, accuracy, loading: false, error: null })
      return { latitude, longitude }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get location'
      setState((s) => ({ ...s, loading: false, error: message }))
      return null
    }
  }

  return { ...state, requestLocation }
}
