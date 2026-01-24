import { Slot, useRouter, useSegments } from 'expo-router'
import { useEffect } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { PaperProvider, MD3LightTheme } from 'react-native-paper'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider, useSession } from '../hooks/useAuth'

const TWENTY_FOUR_HOURS = 1000 * 60 * 60 * 24

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: TWENTY_FOUR_HOURS,
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
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

  useEffect(() => {
    if (isLoading) return

    const inAuthRoute = segments[0] === 'login'

    if (!session && !inAuthRoute) {
      // Not authenticated and not on login -> redirect to login
      router.replace('/login')
    } else if (session && inAuthRoute) {
      // Authenticated but on login -> redirect to tabs
      router.replace('/(tabs)/shifts')
    }
  }, [session, isLoading, segments])

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#66BB6A" />
      </View>
    )
  }

  return <Slot />
}

export default function RootLayout() {
  return (
    <PaperProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <AuthGate />
        </SessionProvider>
      </QueryClientProvider>
    </PaperProvider>
  )
}
