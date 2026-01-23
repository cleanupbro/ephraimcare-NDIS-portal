import { render, type RenderOptions } from '@testing-library/react';
import { type ReactElement, type ReactNode } from 'react';

/**
 * Custom render that wraps components with necessary providers.
 * Extend this as you add context providers (theme, auth, etc.)
 */
function AllProviders({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

function customRender(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { wrapper: AllProviders, ...options });
}

export * from '@testing-library/react';
export { customRender as render };

/** Factory for mock profile data */
export function mockProfile(overrides = {}) {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    role: 'admin' as const,
    first_name: 'Test',
    last_name: 'Admin',
    email: 'test@ephraimcare.com.au',
    organization_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

/** Factory for mock participant data */
export function mockParticipant(overrides = {}) {
  return {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    ndis_number: '431000001',
    first_name: 'Alice',
    last_name: 'Johnson',
    date_of_birth: '1985-03-15',
    phone: '0412345001',
    email: 'alice.j@email.com',
    address_line_1: '15 George St',
    suburb: 'Liverpool',
    state: 'NSW',
    postcode: '2170',
    organization_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    ...overrides,
  };
}

/** Factory for mock shift data */
export function mockShift(overrides = {}) {
  return {
    id: 'shift-001',
    participant_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    worker_id: 'worker-001',
    scheduled_start: '2026-01-24T08:00:00+11:00',
    scheduled_end: '2026-01-24T12:00:00+11:00',
    status: 'scheduled' as const,
    organization_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    ...overrides,
  };
}
