# Issue: Viral Fever path is dead (Track A)
**Severity:** Medium
**Status:** Fixed

## Description
The condition `a4.length === 0` was never true because `getMultiAns()` returns an array even if "None of these" (index 5) is selected. This caused the Viral Fever diagnosis to be unreachable for most patients.

## Fix
Updated logic to include the "None of these" option:
```typescript
if (a2 !== 3 && a5 !== 2 && (a4.length === 0 || a4.includes(5)))
```
