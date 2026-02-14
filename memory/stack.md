# Tech Stack

## Runtime
- Language: TypeScript 5.7 (strict mode)
- Runtime: Node.js 18+
- Package manager: pnpm (workspaces)
- Monorepo tool: Turborepo

## Frameworks
- **Admin Portal:** Next.js 15.5.10 (App Router), React 19
- **Participant Portal:** Next.js 15.5.10 (App Router), React 19
- **Worker Mobile App:** Expo SDK 53, React Native 0.79, Expo Router

## Database
- Supabase PostgreSQL (Sydney region)
- Project ref: vkjxqvfzhiglpqvlehsk
- URL: https://vkjxqvfzhiglpqvlehsk.supabase.co
- Auth: Supabase Auth with Row Level Security (RLS) on all tables
- Realtime: Not used currently

## Styling
- **Web:** Tailwind CSS v4, shadcn/ui component library
- **Mobile:** React Native Paper, custom color constants

## State Management
- Server state: TanStack React Query v5
- Client state: Zustand
- Forms: React Hook Form + Zod validation

## APIs & Services
| Service | Purpose | Auth Method |
|---------|---------|-------------|
| Supabase | Database, Auth, Storage, RLS | API keys (anon + service role) |
| Resend | Email notifications (worker invites) | API key |
| Twilio | SMS shift reminders | Account SID + Auth Token (not yet configured) |
| Xero | Accounting sync | OAuth2 (not yet configured) |

## Key Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| next | 15.5.10 | Web framework |
| react | 19.x | UI library |
| @supabase/supabase-js | latest | Database client |
| @supabase/ssr | latest | Server-side Supabase auth |
| @tanstack/react-query | 5.x | Server state management |
| zustand | latest | Client state |
| zod | latest | Schema validation |
| react-hook-form | latest | Form handling |
| @hookform/resolvers | latest | Zod + React Hook Form bridge |
| date-fns | latest | Date utilities |
| @react-pdf/renderer | latest | PDF generation |
| expo | 53 | Mobile framework |
| react-native | 0.79 | Mobile UI |
| react-native-paper | latest | Mobile component library |
| expo-location | latest | GPS for check-in/out |
| expo-secure-store | latest | Secure credential storage |
| tailwindcss | 4.x | CSS framework |
| turbo | latest | Monorepo build orchestration |
| vitest | 3.x | Unit testing |
| playwright | latest | E2E testing |
| msw | latest | API mocking for tests |

## Environment Variables Needed
| Variable | Purpose | Where |
|----------|---------|-------|
| NEXT_PUBLIC_SUPABASE_URL | Supabase project URL | Admin + Participant |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase public key | Admin + Participant |
| SUPABASE_SERVICE_ROLE_KEY | Supabase admin key | Admin only |
| NEXT_PUBLIC_SITE_URL | Admin portal URL | Admin |
| RESEND_API_KEY | Email sending | Admin |
| RESEND_FROM_EMAIL | Sender email address | Admin |
| ADMIN_EMAIL | Admin notification CC | Admin |
| TWILIO_ACCOUNT_SID | SMS service | Admin (optional) |
| TWILIO_AUTH_TOKEN | SMS auth | Admin (optional) |
| TWILIO_PHONE_NUMBER | SMS sender number | Admin (optional) |
| XERO_CLIENT_ID | Accounting integration | Admin (optional) |
| XERO_CLIENT_SECRET | Accounting auth | Admin (optional) |
| EXPO_PUBLIC_SUPABASE_URL | Supabase URL for mobile | Worker Mobile |
| EXPO_PUBLIC_SUPABASE_ANON_KEY | Supabase key for mobile | Worker Mobile |
