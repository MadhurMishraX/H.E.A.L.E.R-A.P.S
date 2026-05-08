# Issue: "Common Flu" path fires too broadly (Track A)
**Severity:** Low
**Status:** Fixed

## Description
The condition `a2 !== -1` was always true for any answered session, causing the Common Flu branch to fire for almost everyone who took paracetamol and felt relief, potentially skipping more accurate diagnoses.

## Fix
Implemented specific symptom checks to ensure the patient actually has fever, aches, or cold symptoms:
```typescript
if (a8 === 0 && (a2 !== 3 || a3 !== 2 || (a4.length > 0 && !a4.includes(5))))
```
