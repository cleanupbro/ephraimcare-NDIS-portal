import { useState, useEffect } from 'react'
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Location from 'expo-location'

import {
  captureShiftPhoto,
  getShiftPhotos,
  deleteLocalPhoto,
  type CapturedPhoto,
} from '../lib/photo-sync'

interface ShiftPhotoCaptureProps {
  shiftId: string
  maxPhotos?: number
  disabled?: boolean
  onPhotoAdded?: (photo: CapturedPhoto) => void
}

export function ShiftPhotoCapture({
  shiftId,
  maxPhotos = 3,
  disabled = false,
  onPhotoAdded,
}: ShiftPhotoCaptureProps) {
  const [photos, setPhotos] = useState<CapturedPhoto[]>([])
  const [isCapturing, setIsCapturing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadPhotos()
  }, [shiftId])

  const loadPhotos = async () => {
    setIsLoading(true)
    try {
      const shiftPhotos = await getShiftPhotos(shiftId)
      setPhotos(shiftPhotos)
    } catch (error) {
      console.error('Failed to load photos:', error)
    }
    setIsLoading(false)
  }

  const handleCapture = async () => {
    if (disabled || photos.length >= maxPhotos) return

    setIsCapturing(true)

    try {
      // Get current location
      let location: { latitude: number; longitude: number } | undefined

      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        })
        location = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        }
      }

      const photo = await captureShiftPhoto(shiftId, location)

      if (photo) {
        setPhotos((prev) => [...prev, photo])
        onPhotoAdded?.(photo)
      }
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to capture photo'
      )
    }

    setIsCapturing(false)
  }

  const handleDelete = (photoId: string) => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteLocalPhoto(photoId)
              setPhotos((prev) => prev.filter((p) => p.id !== photoId))
            } catch (error) {
              Alert.alert('Error', 'Failed to delete photo')
            }
          },
        },
      ]
    )
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#66BB6A" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Shift Photos</Text>
        <Text style={styles.count}>
          {photos.length} / {maxPhotos}
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.photosRow}>
          {/* Existing photos */}
          {photos.map((photo) => (
            <View key={photo.id} style={styles.photoContainer}>
              <Image source={{ uri: photo.localUri }} style={styles.photo} />
              {!disabled && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(photo.id)}
                >
                  <Ionicons name="close-circle" size={24} color="#E53935" />
                </TouchableOpacity>
              )}
              {!photo.uploaded && (
                <View style={styles.pendingBadge}>
                  <Ionicons name="cloud-upload-outline" size={12} color="#fff" />
                </View>
              )}
            </View>
          ))}

          {/* Add photo button */}
          {photos.length < maxPhotos && !disabled && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleCapture}
              disabled={isCapturing}
            >
              {isCapturing ? (
                <ActivityIndicator color="#66BB6A" />
              ) : (
                <>
                  <Ionicons name="camera" size={32} color="#66BB6A" />
                  <Text style={styles.addButtonText}>Add Photo</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {photos.length === 0 && (
        <Text style={styles.emptyText}>
          Tap Add Photo to document your shift
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  count: {
    fontSize: 14,
    color: '#666',
  },
  photosRow: {
    flexDirection: 'row',
    gap: 12,
  },
  photoContainer: {
    position: 'relative',
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  deleteButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  pendingBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#FF9800',
    borderRadius: 10,
    padding: 4,
  },
  addButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#66BB6A',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#66BB6A',
    fontSize: 12,
    marginTop: 4,
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
})
