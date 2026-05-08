# Issue: Back-of-head + Fever override (Track B)
**Severity:** Medium
**Status:** Fixed

## Description
New back-of-the-head headache combined with fever and it being the "first time" should be a red flag. However, it was being overridden by the general "Flu-Related Headache" path.

## Fix
Moved the red flag check for back-of-head pain above the flu-related headache diagnosis to ensure safety.
