import { useState } from 'react'
import { View, Modal, KeyboardAvoidingView, Platform } from 'react-native'
import { Text, Button, TextInput } from 'react-native-paper'

interface CaseNoteModalProps {
  visible: boolean
  shiftId: string
  participantName: string
  durationMinutes?: number
  onDismiss: () => void
}

export function CaseNoteModal({
  visible,
  shiftId,
  participantName,
  durationMinutes,
  onDismiss,
}: CaseNoteModalProps) {
  const [showInput, setShowInput] = useState(false)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSkip = () => {
    setShowInput(false)
    setNote('')
    onDismiss()
  }

  const handleSave = async () => {
    setSaving(true)
    // Phase 6 will implement full case notes system with DB persistence
    setSaving(false)
    setShowInput(false)
    setNote('')
    onDismiss()
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            padding: 24,
            backgroundColor: '#fff',
          }}
        >
          <Text
            variant="headlineSmall"
            style={{ textAlign: 'center', fontWeight: '600', marginBottom: 8 }}
          >
            Shift Complete
          </Text>
          <Text
            variant="bodyMedium"
            style={{ textAlign: 'center', color: '#666', marginBottom: 4 }}
          >
            {participantName}
          </Text>
          {durationMinutes !== undefined && (
            <Text
              variant="bodyMedium"
              style={{ textAlign: 'center', color: '#66BB6A', marginBottom: 24 }}
            >
              Duration: {Math.floor(durationMinutes / 60)}h {durationMinutes % 60}m
            </Text>
          )}

          {!showInput ? (
            <>
              <Text
                variant="bodyLarge"
                style={{ textAlign: 'center', marginBottom: 24 }}
              >
                Would you like to add a case note?
              </Text>
              <Button
                mode="contained"
                onPress={() => setShowInput(true)}
                buttonColor="#66BB6A"
                style={{ marginBottom: 12, borderRadius: 8 }}
              >
                Write Note
              </Button>
              <Button
                mode="outlined"
                onPress={handleSkip}
                textColor="#666"
                style={{ borderRadius: 8 }}
              >
                Skip
              </Button>
            </>
          ) : (
            <>
              <TextInput
                mode="outlined"
                label="Case note"
                value={note}
                onChangeText={setNote}
                multiline
                numberOfLines={6}
                style={{ marginBottom: 16, minHeight: 120 }}
                outlineColor="#ccc"
                activeOutlineColor="#66BB6A"
                placeholder="Describe the care delivered during this shift..."
              />
              <Button
                mode="contained"
                onPress={handleSave}
                loading={saving}
                disabled={note.trim().length < 10}
                buttonColor="#66BB6A"
                style={{ marginBottom: 12, borderRadius: 8 }}
              >
                Save Note
              </Button>
              <Button mode="text" onPress={handleSkip} textColor="#999">
                Skip for now
              </Button>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}
