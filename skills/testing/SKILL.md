---
name: testing
description: Test-driven development with unit, integration, and e2e tests using Vitest, Jest, Playwright, or Testing Library. Use when writing or designing tests.
---

# Testing

## Test Pyramid
1. **Unit tests** (many) — test individual functions/components in isolation
2. **Integration tests** (some) — test modules working together
3. **E2E tests** (few) — test full user flows in a real browser

## TDD Workflow
1. Write a failing test for the expected behavior
2. Write the minimum code to make it pass
3. Refactor while keeping tests green
4. Repeat

## Unit Test Pattern (Vitest/Jest)
```typescript
describe('calculateTotal', () => {
  it('returns 0 for empty cart', () => {
    expect(calculateTotal([])).toBe(0)
  })

  it('sums item prices correctly', () => {
    const items = [{ price: 10 }, { price: 20 }]
    expect(calculateTotal(items)).toBe(30)
  })

  it('throws for negative prices', () => {
    expect(() => calculateTotal([{ price: -1 }])).toThrow('Invalid price')
  })
})
```

## Component Test Pattern (Testing Library)
```typescript
it('shows error message on invalid email', async () => {
  render(<LoginForm />)
  await userEvent.type(screen.getByLabelText('Email'), 'invalid')
  await userEvent.click(screen.getByRole('button', { name: 'Submit' }))
  expect(screen.getByRole('alert')).toHaveTextContent('Invalid email')
})
```

## Guidelines
- Test behavior, not implementation
- One assertion per test (or closely related group)
- Use descriptive test names: "does X when Y"
- Mock external dependencies (APIs, databases), not internal logic
- Tests must be deterministic — no randomness, no time-dependency

## Anti-Patterns
- Don't test implementation details (private methods, internal state)
- Don't write tests after the fact just for coverage
- Don't use `test.skip` permanently — fix or delete
- Don't mock everything — integration tests need real modules
