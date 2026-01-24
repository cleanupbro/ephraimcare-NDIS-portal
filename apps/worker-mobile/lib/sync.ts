import NetInfo, { NetInfoSubscription } from '@react-native-community/netinfo'
import { useSyncStore } from '../stores/syncStore'
import { supabase } from './supabase'

let syncSubscription: NetInfoSubscription | null = null

export async function syncPendingActions(): Promise<void> {
  const state = await NetInfo.fetch()
  if (!state.isConnected) return

  const { pendingActions, removePendingAction } = useSyncStore.getState()
  if (pendingActions.length === 0) return

  for (const action of pendingActions) {
    try {
      if (action.type === 'check_in') {
        const { error } = await supabase.from('shift_check_ins').insert({
          shift_id: action.shiftId,
          check_in_time: action.timestamp,
          check_in_latitude: action.latitude,
          check_in_longitude: action.longitude,
          synced_from_offline: true,
        } as any)
        if (error) throw error

        await supabase
          .from('shifts')
          .update({ status: 'in_progress' } as any)
          .eq('id', action.shiftId)
      } else if (action.type === 'case_note') {
        const { error } = await supabase
          .from('case_notes')
          .upsert({
            shift_id: action.shiftId,
            participant_id: action.payload?.participantId,
            worker_id: action.payload?.workerId,
            organization_id: action.payload?.organizationId,
            content: action.payload?.content,
            concern_flag: action.payload?.concernFlag ?? false,
            concern_text: action.payload?.concernText ?? null,
            note_date: action.payload?.noteDate ?? new Date().toISOString().split('T')[0],
            is_draft: false,
          } as any, { onConflict: 'shift_id,worker_id' })
          .select()
          .single()
        if (error) throw error
      } else if (action.type === 'check_out') {
        const { data: checkIn } = (await supabase
          .from('shift_check_ins')
          .select('check_in_time')
          .eq('shift_id', action.shiftId)
          .single()) as any

        const durationMinutes = checkIn?.check_in_time
          ? Math.round(
              (new Date(action.timestamp).getTime() -
                new Date(checkIn.check_in_time).getTime()) /
                (1000 * 60)
            )
          : null

        const { error } = await supabase
          .from('shift_check_ins')
          .update({
            check_out_time: action.timestamp,
            check_out_latitude: action.latitude,
            check_out_longitude: action.longitude,
            check_out_type: 'manual',
            duration_minutes: durationMinutes,
            synced_from_offline: true,
          } as any)
          .eq('shift_id', action.shiftId)
        if (error) throw error

        await supabase
          .from('shifts')
          .update({ status: 'completed' } as any)
          .eq('id', action.shiftId)
      }

      removePendingAction(action.id)
    } catch (error) {
      console.warn('Sync failed for action:', action.id, error)
      break
    }
  }
}

export function startSyncListener(): void {
  if (syncSubscription) return

  syncSubscription = NetInfo.addEventListener((state) => {
    if (state.isConnected) {
      syncPendingActions()
    }
  })
}

export function stopSyncListener(): void {
  if (syncSubscription) {
    syncSubscription()
    syncSubscription = null
  }
}
