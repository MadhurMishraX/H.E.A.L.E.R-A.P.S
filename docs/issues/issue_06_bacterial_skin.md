# Issue: Bacterial Infection path too narrow (Track D)
**Severity:** Medium
**Status:** Fixed

## Description
Patients with pus-filled bumps and a mild fever were falling through to the default "Allergic Rash" diagnosis because the bacterial infection path only checked for "No fever".

## Fix
Included mild fever (`d6 === 1`) in the bacterial infection path:
```typescript
if (d2 === 3 && (d6 === 1 || d6 === 2))
```
