---
name: react-patterns
description: React component design, hooks, state management, composition patterns, and performance optimization. Use when building or refactoring React components.
---

# React Patterns

## Component Design

### Composition Over Configuration
```tsx
// Good: Composable
<Card>
  <Card.Header>Title</Card.Header>
  <Card.Body>Content</Card.Body>
</Card>

// Avoid: Prop-heavy
<Card title="Title" body="Content" headerStyle={...} bodyStyle={...} />
```

### Props Interface
- Always define explicit TypeScript interfaces
- Use `children: React.ReactNode` for wrapper components
- Default props via destructuring: `({ size = 'md' }: Props)`
- Never use `any` for props

## Hooks Patterns

### Custom Hook Extraction
Extract logic into custom hooks when:
- Logic is reused across 2+ components
- Component has complex state management
- Side effects need cleanup

```tsx
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debouncedValue
}
```

### State Management Decision Tree
1. **Local to one component** → `useState`
2. **Shared between parent-child** → lift state up, pass props
3. **Shared across distant components** → React Context
4. **Complex with many actions** → `useReducer` + Context
5. **Server state (API data)** → React Query / SWR
6. **Global app state** → Zustand (simple) or Redux (complex)

## Performance

- Wrap expensive renders in `React.memo()`
- Use `useMemo` for expensive calculations
- Use `useCallback` for functions passed as props to memoized children
- Never create objects/arrays inline in JSX — extract to variables or memoize
- Use React DevTools Profiler to find unnecessary re-renders

## Anti-Patterns
- Don't use `useEffect` for derived state — compute during render
- Don't use index as key in dynamic lists
- Don't mutate state directly — always create new references
- Don't fetch data in useEffect when server components are available
