# Issue: Acidity/Gastritis returns action: "none" (Track C)
**Severity:** Medium
**Status:** Fixed

## Description
Returning `action: "none"` for acidity and indigestion issues might have caused the UI to fail to render the prescription screen, even though advice was available.

## Fix
Changed the action to `"dispense"` to ensure the UI handles the prescription correctly.
