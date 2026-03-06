# QA Audit Report: UI Components (Next.js Monorepo)
**Date:** 2026-03-07
**Project:** EphraimCare NDIS Portal
**Verdict:** 🔴 NEEDS FIXES

---

## 1. Sheet Component (`packages/ui/src/components/sheet.tsx`)
**Status:** 🔴 FAIL

### Issues:
- **UX / Body Scroll Lock (Lines 142–152):** The `unlockBodyScroll()` function is called immediately when the `open` prop changes to `false`. However, the Sheet panel has a 300ms transition. This causes the background body to "jump" (restoring scroll position and removing `position: fixed`) while the Sheet is still visible and sliding out.
- **Accessibility:** `aria-labelledby` and `aria-describedby` are hardcoded to context IDs (lines 183–184). If a consumer forgets `SheetTitle` or `SheetDescription`, these will point to non-existent elements.
- **TypeScript:** Correct usage of `forwardRef` and generics. No type errors found.

### Recommended Fixes:
- **Body Lock:** Modify the `useEffect` in `SheetContent` to call `unlockBodyScroll` only when `isMounted` becomes `false` (i.e., after the transition ends).
  ```tsx
  React.useEffect(() => {
    if (isMounted) {
      lockBodyScroll()
      return () => unlockBodyScroll()
    }
  }, [isMounted])
  ```
- **Accessibility:** Add a check to only apply `aria-*` attributes if the corresponding elements are present, or ensure defaults are safe.

---

## 2. Dialog Component (`packages/ui/src/components/dialog.tsx`)
**Status:** ⚠️ WARNING

### Issues:
- **Mobile UX (Line 46):** The Close button (`DialogPrimitive.Close`) does not have an explicit size or sufficient padding. With an `h-4 w-4` icon, the touch target is likely < 32px, which fails the 44px minimum touch target requirement.
- **CSS Transitions:** Replaced Radix `animate-in/out` with `transition-all`. While Radix *can* detect transitions, `transition-all` can be flaky if multiple properties change. Keyframes are generally more reliable for exit animations in Radix.

### Recommended Fixes:
- Increase the Close button touch target to at least `h-10 w-10` or `h-11 w-11`.
- Consider using `@keyframes` (with `data-[state=closed]:animate-out`) for more robust exit animations.

---

## 3. Alert Dialog Component (`packages/ui/src/components/alert-dialog.tsx`)
**Status:** ⚠️ WARNING

### Issues:
- **CSS Transitions:** Same concern as the Dialog component. The `scale-95` and `opacity-0` on `data-[state=closed]` might be cut off if Radix unmounts the component before the transition completes.

### Recommended Fixes:
- Verify transition completion in Safari/Firefox or switch to keyframe-based animations.

---

## 4. Dropdown Menu Component (`packages/ui/src/components/dropdown-menu.tsx`)
**Status:** 🔴 FAIL

### Issues:
- **Architecture (Line 55):** `DropdownMenuSubContent` is NOT wrapped in `DropdownMenuPortal`. This can cause clipping issues if the sub-menu is opened near the edge of a container with `overflow: hidden` or `z-index` constraints.
- **Mobile UX (Line 88):** `DropdownMenuItem` has `py-1.5`, which is too small for reliable touch interaction on mobile devices.
- **Theming (Lines 59, 75):** Hardcoded `bg-white dark:bg-zinc-900` instead of using the Tailwind variable `bg-popover`. This breaks custom theme overrides.

### Recommended Fixes:
- Wrap `DropdownMenuSubContent` in `<DropdownMenuPrimitive.Portal>`.
- Increase item padding for mobile (e.g., `min-h-[44px]` or larger `py`).
- Replace hardcoded colors with `bg-popover` and `text-popover-foreground`.

---

## 5. Select Component (`packages/ui/src/components/select.tsx`)
**Status:** ⚠️ WARNING

### Issues:
- **Theming (Line 103):** Same hardcoded color issue: `bg-white dark:bg-zinc-900` should be `bg-popover`.
- **Mobile UX (Line 142):** `SelectItem` correctly implements `min-h-[44px]`. (PASS)
- **Viewport (Line 102):** `max-h-[min(24rem,60vh)]` is excellent for mobile constraints. (PASS)

---

## 6. Consumer Integration Audit

- **`apps/admin/components/layout/admin-sidebar.tsx`**: ✅ PASS. Correct state flow for mobile nav.
- **`apps/admin/components/layout/protected-shell.tsx`**: ✅ PASS.
- **`apps/admin/components/shifts/shift-filters.tsx`**: ✅ PASS. Correct usage of Select for filtering.
- **`apps/admin/components/shifts/shift-detail-sheet.tsx`**: ✅ PASS. Correct usage of `Sheet` and `Select` for complex form state.
- **`apps/participant/components/layout/sidebar.tsx`**: ✅ PASS.

---

## Overall Verdict: NEEDS FIXES
The UI components are visually polished but have critical UX bugs (Sheet scroll jump) and architectural omissions (Dropdown Portal) that will lead to production issues on mobile and in complex layouts. 

### Critical Path:
1. Fix `sheet.tsx` scroll lock timing.
2. Add Portals to `DropdownMenuSubContent`.
3. Standardize colors to use CSS variables (`bg-popover`, `bg-background`).
4. Increase touch targets for Dialog close buttons and Dropdown items.
