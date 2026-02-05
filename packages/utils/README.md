# @ephraimcare/utils

Shared utility functions and constants used across all apps.

## Key Exports

### Date/Time (`dates.ts`)
- `formatSydneyDate(date, format)` — Format dates in AEST timezone
- `toSydneyDate(date)` — Convert UTC to Sydney time
- `isToday()`, `isPast()`, `isFuture()` — Date comparisons in AEST

### Currency (`currency.ts`)
- `formatCurrency(amount)` — Format as AUD (e.g., `$1,234.56`)

### Constants (`constants.ts`)
- `SUPPORT_TYPES` — List of NDIS support type slugs
- `SUPPORT_TYPE_LABELS` — Human-readable labels
- `QUALIFICATIONS` — Worker qualification types
- `SHIFT_STATUSES` — Shift lifecycle states
- Other shared constants

## Usage

```typescript
import { formatSydneyDate, formatCurrency, SUPPORT_TYPES } from '@ephraimcare/utils'
```
