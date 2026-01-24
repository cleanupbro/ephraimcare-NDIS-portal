import { Slot, useRouter, useSegments } from 'expo-router'
import { useEffect } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { PaperProvider, MD3LightTheme } from 'react-native-paper'
import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { SessionProvider, useSession } from '../hooks/useAuth'
import { OfflineIndicator } from '../components/OfflineIndicator'
import { startSyncListener, stopSyncListener } from '../lib/sync'
import { useNotificationSetup } from '../hooks/useNotifications'
import { QUERY_GC_TIME_MS } from '../constants/config'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: QUERY_GC_TIME_MS,
      staleTime: 1000 * 60 * 5,
      retry: 2,
    },
  },
})

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'EPHRAIMCARE_QUERY_CACHE',
})

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#66BB6A',
    primaryContainer: '#E8F5E9',
    onPrimary: '#FFFFFF',
  },
}

function AuthGate() {
  const { session, isLoading } = useSession()
  const segments = useSegments()
  const router = useRouter()

  useNotificationSetup()

  useEffect(() => {
    if (session) {
      startSyncListener()
      return () => stopSyncListener()
    }
  }, [session])

  useEffect(() => {
    if (isLoading) return

    const inAuthRoute = segments[0] === 'login'

    if (!session && !inAuthRoute) {
      router.replace('/login')
    } else if (session && inAuthRoute) {
      router.replace('/(tabs)')
    }
  }, [session, isLoading, segments])

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#66BB6A" />
      </View>
    )
  }

  return (
    <View style={{ flex: 1 }}>
      <OfflineIndicator />
      <Slot />
    </View>
  )
}

export default function RootLayout() {
  return (
    <PaperProvider theme={theme}>
      <SessionProvider>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{
            persister: asyncStoragePersister,
            maxAge: QUERY_GC_TIME_MS,
          }}
        >
          <AuthGate />
        </PersistQueryClientProvider>
      </SessionProvider>
    </PaperProvider>
  )
}
