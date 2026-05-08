export type AgeGroup = 'infant' | 'toddler' | 'child' | 'adult' | 'elderly';

export function getAgeGroup(age: number): AgeGroup {
  if (age <= 1) {
    return 'infant';
  } else if (age > 1 && age <= 5) {
    return 'toddler';
  } else if (age > 5 && age <= 12) {
    return 'child';
  } else if (age > 12 && age < 60) {
    return 'adult';
  } else {
    return 'elderly';
  }
}

