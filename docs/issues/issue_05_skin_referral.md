# Issue: Aggressive Rash + Fever referral (Track D)
**Severity:** Critical
**Status:** Fixed

## Description
The rule "Rash + High Fever = Refer" was too aggressive, catching patients with simple itching and a common cold. 

## Fix
Restricted the referral to cases where the skin problem is also spreading fast or involves pus:
```typescript
if ((d2 === 3 || d7 === 0) && d6 === 0)
```
