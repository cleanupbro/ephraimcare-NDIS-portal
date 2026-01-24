import { useState } from 'react'
import { View, Modal, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { Text, Button, TextInput, Switch } from 'react-native-paper'
import { caseNoteSchema } from '../lib/schemas/case-note'
import { useCreateCaseNote } from '../hooks/useCreateCaseNote'

interface CaseNoteModalProps {
  visible: boolean
  onDismiss: () => void
  shiftId: string
  participantId: string
  participantName: string
  workerId: string
  organizationId: string
  durationMinutes?: number
}

export function CaseNoteModal({
  visible,
  onDismiss,
  shiftId,
  participantId,
  participantName,
  workerId,
  organizationId,
  durationMinutes,
}: CaseNoteModalProps) {
  const [showInput, setShowInput] = useState(false)
  const [content, setContent] = useState('')
  const [concernFlag, setConcernFlag] = useState(false)
  const [concernText, setConcernText] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const createCaseNote = useCreateCaseNote()

  const resetForm = () => {
    setShowInput(false)
    setContent('')
    setConcernFlag(false)
    setConcernText('')
    setValidationError(null)
    setSaveError(null)
  }

  const handleSkip = () => {
    resetForm()
    onDismiss()
  }

  const handleSave = () => {
    setValidationError(null)
    setSaveError(null)

    const result = caseNoteSchema.safeParse({
      content: content.trim(),
      concernFlag,
      concernText: concernFlag ? concernText.trim() : undefined,
    })

    if (!result.success) {
      const firstError = result.error.errors[0]
      setValidationError(firstError?.message ?? 'Validation failed')
      return
    }

    createCaseNote.mutate(
      {
        shiftId,
        participantId,
        workerId,
        organizationId,
        content: result.data.content,
        concernFlag: result.data.concernFlag,
        concernText: result.data.concernText,
      },
      {
        onSuccess: () => {
          resetForm()
          onDismiss()
        },
        onError: (error) => {
          // Note was queued offline via hook's onError
          setSaveError('Saved offline - will sync when connected')
          setTimeout(() => {
            resetForm()
            onDismiss()
          }, 1500)
        },
      }
    )
  }

  const contentLength = content.trim().length
  const canSave = contentLength >= 10 && !createCaseNote.isPending

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            padding: 24,
            backgroundColor: '#fff',
          }}
          keyboardShouldPersistTaps="handled"
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
                value={content}
                onChangeText={(text) => {
                  setContent(text)
                  if (validationError) setValidationError(null)
                }}
                multiline
                numberOfLines={6}
                style={{ marginBottom: 4, minHeight: 120 }}
                outlineColor="#ccc"
                activeOutlineColor="#66BB6A"
                placeholder="Activities performed... Participant mood... Changes noticed..."
              />
              <Text
                variant="bodySmall"
                style={{
                  textAlign: 'right',
                  color: contentLength >= 10 ? '#66BB6A' : '#999',
                  marginBottom: 16,
                }}
              >
                {contentLength}/10 min
              </Text>

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: concernFlag ? 12 : 16,
                  paddingHorizontal: 4,
                }}
              >
                <Text variant="bodyMedium" style={{ color: '#333' }}>
                  Flag a concern
                </Text>
                <Switch
                  value={concernFlag}
                  onValueChange={setConcernFlag}
                  color="#FF7043"
                />
              </View>

              {concernFlag && (
                <TextInput
                  mode="outlined"
                  label="Concern description"
                  value={concernText}
                  onChangeText={setConcernText}
                  multiline
                  numberOfLines={3}
                  style={{ marginBottom: 16, minHeight: 72 }}
                  outlineColor="#FF7043"
                  activeOutlineColor="#FF7043"
                  placeholder="Describe the concern..."
                />
              )}

              {validationError && (
                <Text
                  variant="bodySmall"
                  style={{ color: '#C62828', marginBottom: 12, textAlign: 'center' }}
                >
                  {validationError}
                </Text>
              )}

              {saveError && (
                <Text
                  variant="bodySmall"
                  style={{ color: '#F57C00', marginBottom: 12, textAlign: 'center' }}
                >
                  {saveError}
                </Text>
              )}

              <Button
                mode="contained"
                onPress={handleSave}
                loading={createCaseNote.isPending}
                disabled={!canSave}
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
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  )
}
