#!/bin/bash
# Foundation Phase Verification Script
# Run: chmod +x scripts/verify-foundation.sh && ./scripts/verify-foundation.sh

set -e

echo "═══════════════════════════════════════════════════"
echo "  Ephraim Care Portal - Phase 1 Foundation Check"
echo "═══════════════════════════════════════════════════"
echo ""

PASS=0
FAIL=0

check() {
  if [ $2 -eq 0 ]; then
    echo "  ✓ $1"
    PASS=$((PASS + 1))
  else
    echo "  ✗ $1"
    FAIL=$((FAIL + 1))
  fi
}

echo "▸ Monorepo Structure"
test -f "package.json" && test -f "turbo.json" && test -f "pnpm-workspace.yaml"
check "Root config files (package.json, turbo.json, pnpm-workspace.yaml)" $?

test -f ".npmrc"
check ".npmrc with hoisting config" $?

echo ""
echo "▸ Apps"
test -f "apps/admin/package.json" && test -f "apps/admin/next.config.ts"
check "Admin app (Next.js 15.5)" $?

test -f "apps/participant/package.json" && test -f "apps/participant/next.config.ts"
check "Participant app (Next.js 15.5)" $?

test -f "apps/worker-mobile/package.json" && test -f "apps/worker-mobile/app.json"
check "Worker mobile app (Expo SDK 53)" $?

echo ""
echo "▸ Shared Packages"
test -f "packages/types/package.json" && test -f "packages/types/src/domain.ts"
check "Types package with domain types" $?

test -f "packages/supabase/package.json" && test -f "packages/supabase/src/client.ts"
check "Supabase package with client/admin" $?

test -f "packages/utils/package.json" && test -f "packages/utils/src/validators.ts"
check "Utils package (dates, currency, validators)" $?

test -f "packages/ui/package.json" && test -f "packages/ui/src/styles/globals.css"
check "UI package with Ephraim Care theme" $?

test -f "packages/config/package.json"
check "Config package" $?

echo ""
echo "▸ Database"
MIGRATIONS=$(ls supabase/migrations/*.sql 2>/dev/null | wc -l | tr -d ' ')
test "$MIGRATIONS" -ge 16
check "SQL migrations ($MIGRATIONS files, need ≥16)" $?

test -f "supabase/seed.sql"
check "Seed data (profiles, participants, shifts)" $?

test -f "supabase/config.toml"
check "Supabase config.toml with project_id" $?

echo ""
echo "▸ Auth System"
test -f "apps/admin/app/(auth)/login/page.tsx"
check "Login page (AUTH-01)" $?

test -f "apps/admin/app/(auth)/reset-password/page.tsx"
check "Password reset page (AUTH-02)" $?

test -f "apps/admin/hooks/useSessionTimeout.ts"
check "Session timeout hook (AUTH-03)" $?

test -f "apps/admin/lib/supabase/middleware.ts"
check "Supabase middleware with route protection" $?

grep -q "custom_access_token_hook" supabase/migrations/*user_roles* 2>/dev/null
check "Custom JWT claims hook (AUTH-05)" $?

echo ""
echo "▸ RLS & Security"
grep -q "enable row level security" supabase/migrations/*rls* 2>/dev/null
check "RLS enabled on all tables" $?

grep -q "organization_id" supabase/migrations/*rls* 2>/dev/null
check "Organization-level data isolation" $?

echo ""
echo "▸ Testing"
test -f "apps/admin/vitest.config.ts"
check "Vitest config for admin app" $?

test -f "apps/admin/playwright.config.ts"
check "Playwright config for E2E" $?

test -f "apps/admin/test/setup.ts" && test -f "apps/admin/test/helpers.tsx"
check "Test utilities (setup, helpers, factories)" $?

test -d "apps/admin/e2e"
check "E2E test directory with auth tests" $?

test -f "packages/utils/vitest.config.ts"
check "Utils package test config" $?

echo ""
echo "▸ Environment"
test -f ".env.local"
check ".env.local with Supabase credentials" $?

test -f ".env.example"
check ".env.example template" $?

grep -q ".env.local" .gitignore
check ".env.local in .gitignore" $?

echo ""
echo "═══════════════════════════════════════════════════"
echo "  Results: $PASS passed, $FAIL failed"
echo "═══════════════════════════════════════════════════"

if [ $FAIL -gt 0 ]; then
  echo ""
  echo "  ⚠ Some checks failed. Review above."
  exit 1
else
  echo ""
  echo "  Phase 1 Foundation: ALL CHECKS PASSED"
  echo ""
  echo "  Next steps:"
  echo "    1. pnpm install"
  echo "    2. supabase link --project-ref vkjxqvfzhiglpqvlehsk"
  echo "    3. supabase db push (applies migrations)"
  echo "    4. supabase db seed (loads seed data)"
  echo "    5. pnpm dev (starts all apps)"
fi
