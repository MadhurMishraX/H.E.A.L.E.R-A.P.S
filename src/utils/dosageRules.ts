import { AgeGroup } from './ageUtils';

export interface DosageInfo {
  medicine: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  compartment?: number;
}

export function getDosageInfo(
  track: 'A' | 'B' | 'C' | 'D', 
  diagnosis: string, 
  ageGroup: AgeGroup, 
  sessionAnswers: any[]
): DosageInfo[] {
  const prescriptions: DosageInfo[] = [];

  const getMultiAns = (qId: string) => {
    const ans = sessionAnswers.find(a => a.question_id === qId);
    if (!ans) return [];
    return Array.isArray(ans.selected_option) ? ans.selected_option : [ans.selected_option];
  };

  const getAns = (qId: string) => {
    const ans = sessionAnswers.find(a => a.question_id === qId);
    if (!ans) return -1;
    return Array.isArray(ans.selected_option) ? ans.selected_option[0] : ans.selected_option;
  };

  if (diagnosis.includes('DOCTOR NEEDED')) {
    prescriptions.push({
      medicine: "Referral Needed",
      dosage: "N/A",
      frequency: "N/A",
      duration: "N/A",
      instructions: "Please consult a doctor immediately for further evaluation."
    });
    // For stomach, dispense ORS while waiting
    if (track === 'C' && diagnosis !== 'URGENT - DOCTOR NEEDED') {
       prescriptions.push(getORSInfo(ageGroup));
    }
    return prescriptions;
  }

  switch (track) {
    case 'A': // Flu / Fever
      prescriptions.push(getParacetamolInfo(ageGroup, 1));
      
      const symptomsA = getMultiAns('Q_A4');
      if (symptomsA.includes(0) || symptomsA.includes(1)) { // Runny or Blocked nose
        prescriptions.push({
          medicine: "Sinarest / D-Cold Total",
          dosage: "1 tablet",
          frequency: "Twice daily",
          duration: "3 days",
          instructions: "For nasal congestion. For adults only."
        });
      }
      if (symptomsA.includes(4)) { // Wet cough
        prescriptions.push({
          medicine: "Ascoril Syrup",
          dosage: "10ml",
          frequency: "Three times a day",
          duration: "5 days",
          instructions: "For wet cough with phlegm."
        });
      }
      if (symptomsA.includes(3)) { // Dry cough
        prescriptions.push({
          medicine: "Benadryl / Corex-D",
          dosage: "10ml",
          frequency: "Three times a day",
          duration: "5 days",
          instructions: "For dry cough."
        });
      }
      // If runny nose is main complaint, use Cetirizine
      if (symptomsA.includes(0)) {
        prescriptions.push(getCetirizineInfo(ageGroup, 2));
      }
      break;

    case 'B': // Headache
      prescriptions.push(getParacetamolInfo(ageGroup, 1));
      
      prescriptions.push({
        medicine: "Saridon Tablet",
        dosage: "1 tablet",
        frequency: "Once if needed",
        duration: "1 day",
        instructions: "Take only if no relief from Paracetamol after 1 hour (Adults)."
      });

      const symptomsB = getMultiAns('Q_B5');
      if (symptomsB.includes(0)) { // Nausea
        prescriptions.push({
          medicine: "Domstal 10mg (Domperidone)",
          dosage: "1 tablet",
          frequency: "Twice daily",
          duration: "2 days",
          instructions: "Take 30 mins before food for nausea."
        });
      }

      if (diagnosis === 'HUNGER / ACIDITY HEADACHE') {
        prescriptions.push({
          medicine: "Pantoprazole 40mg (Pan-D) / Gelusil",
          dosage: "1 tablet / 2 tsp",
          frequency: "Once / Twice daily",
          duration: "3 days",
          instructions: "Take Pan-D on empty stomach in the morning."
        });
      }
      break;

    case 'C': // Stomach
      if (diagnosis === 'ACIDITY / GASTRITIS') {
        prescriptions.push({
          medicine: "Pantoprazole 40mg + Gelusil Liquid",
          dosage: "1 tab / 2 tsp",
          frequency: "Once daily (empty stomach) / After meals",
          duration: "5 days",
          instructions: "Avoid spicy and oily food."
        });
      } else if (diagnosis === 'GAS / INDIGESTION') {
        prescriptions.push({
          medicine: "Gas-O-Fast / Meftal Spas",
          dosage: "1 sachet / 1 tablet",
          frequency: "As needed",
          duration: "2 days",
          instructions: "For bloating, gas or stomach cramps."
        });
      } else {
        prescriptions.push(getORSInfo(ageGroup, 3));
        
        prescriptions.push({
          medicine: "Enterogermina / Sporlac Probiotic",
          dosage: "1 ampoule / 1 tablet",
          frequency: "Twice daily",
          duration: "5 days",
          instructions: "Helps restore gut bacteria."
        });

        if (diagnosis === 'FOOD-RELATED CRAMPS') {
          prescriptions.push({
            medicine: "Meftal Spas",
            dosage: "1 tablet",
            frequency: "If pain persists",
            duration: "2 days",
            instructions: "For stomach cramps."
          });
        }

        if (ageGroup === 'infant' || ageGroup === 'toddler' || ageGroup === 'child') {
          prescriptions.push({
            medicine: "Zinc 20mg",
            dosage: "1 tablet",
            frequency: "Once daily",
            duration: "14 days",
            instructions: "Dissolve in water/milk. Crucial for recovery from diarrhea."
          });
          prescriptions.push({
            medicine: "Vomikind Syrup / Domstal",
            dosage: "As per weight",
            frequency: "For vomiting",
            duration: "2 days",
            instructions: "Consult doctor if vomiting continues."
          });
        } else {
           prescriptions.push({
            medicine: "Racecadotril 100mg (Redotil)",
            dosage: "1 tablet",
            frequency: "Three times a day",
            duration: "3 days",
            instructions: "Reduces water loss in stools."
          });
        }
      }
      break;

    case 'D': // Skin
      const d2 = getAns('Q_D2');
      
      if (diagnosis.includes('FUNGAL') || diagnosis === 'RINGWORM (FUNGAL)') {
        prescriptions.push(getClotrimazoleInfo(ageGroup, 4));
        if (ageGroup === 'adult' || ageGroup === 'elderly') {
          prescriptions.push({
            medicine: "Fluconazole 150mg",
            dosage: "1 tablet",
            frequency: "Once a week",
            duration: "2 weeks",
            instructions: "Take only if infection is widespread."
          });
        }
        if (diagnosis === 'TINEA VERSICOLOR (FUNGAL)') {
          prescriptions.push({
            medicine: "Selsun (Selenium Sulfide) Shampoo",
            dosage: "Apply to body",
            frequency: "Twice a week",
            duration: "2 weeks",
            instructions: "Apply to affected area, leave for 10 mins, then wash off."
          });
        }
      }

      if (diagnosis.includes('ALLERGIC') || diagnosis.includes('ALLERGY') || diagnosis.includes('ITCHING')) {
        prescriptions.push(getCetirizineInfo(ageGroup, 2));
        prescriptions.push({
          medicine: "Calamine Lotion",
          dosage: "Apply thin layer",
          frequency: "Thrice daily",
          duration: "5 days",
          instructions: "Soothing for itchy and red skin."
        });
      }

      if (diagnosis === 'MINOR BACTERIAL SKIN INFECTION') {
        prescriptions.push({
          medicine: "Mupirocin 2% (T-Bact) / Soframycin Cream",
          dosage: "Thin layer",
          frequency: "Twice daily",
          duration: "7 days",
          instructions: "Apply to pus-filled bumps or wounds."
        });
        prescriptions.push(getCetirizineInfo(ageGroup, 2));
      }
      
      if (ageGroup === 'infant' || ageGroup === 'toddler') {
        // Handle Avil syrup instead of Cetirizine if needed, but Cetirizine 2.5ml is also common
        // Chunk 18 says: Avil for children under 6
        prescriptions.push({
            medicine: "Avil (Chlorpheniramine) Syrup",
            dosage: "2.5ml",
            frequency: "Twice daily",
            duration: "5 days",
            instructions: "For itching in small children. May cause sleepiness."
        });
      }
      break;
  }

  return prescriptions;
}

function getParacetamolInfo(ageGroup: AgeGroup, compartment?: number): DosageInfo {
  switch (ageGroup) {
    case 'infant':
      return {
        medicine: "Calpol Drops (Paracetamol)",
        dosage: "15mg/kg",
        frequency: "Every 6 hours",
        duration: "3 days",
        instructions: "Buy from pharmacy. Only for fever.",
        compartment
      };
    case 'toddler':
      return {
        medicine: "Crocin Syrup (Paracetamol)",
        dosage: "5ml to 10ml",
        frequency: "Every 6 hours",
        duration: "3 days",
        instructions: "Shake well. Max 4 doses in 24 hours.",
        compartment
      };
    case 'child':
      return {
        medicine: "Crocin 250mg",
        dosage: "1 tablet",
        frequency: "Every 6 hours",
        duration: "3 days",
        instructions: "Take with water after food.",
        compartment
      };
    case 'adult':
      return {
        medicine: "Dolo 650mg",
        dosage: "1 tablet",
        frequency: "Every 6-8 hours",
        duration: "3 days",
        instructions: "Max 4 tablets daily. Take after food.",
        compartment
      };
    case 'elderly':
      return {
        medicine: "Crocin 500mg",
        dosage: "1 tablet",
        frequency: "Every 8 hours",
        duration: "3 days",
        instructions: "Take with food to avoid acidity.",
        compartment
      };
  }
}

function getORSInfo(ageGroup: AgeGroup, compartment?: number): DosageInfo {
  switch (ageGroup) {
    case 'infant':
    case 'toddler':
      return {
        medicine: "ORS Electral Powder",
        dosage: "100-200ml",
        frequency: "After every loose stool",
        duration: "2-3 days",
        instructions: "Give in small sips using a spoon or bottle.",
        compartment
      };
    case 'child':
      return {
        medicine: "ORS Electral Powder",
        dosage: "200-400ml",
        frequency: "After every loose stool",
        duration: "2-3 days",
        instructions: "Essential for preventing dehydration.",
        compartment
      };
    case 'adult':
      return {
        medicine: "ORS Electral Powder",
        dosage: "Full sachet in 1 Litre water",
        frequency: "200-400ml after every stool",
        duration: "2-3 days",
        instructions: "Drink continuously throughout the day.",
        compartment
      };
    case 'elderly':
      return {
        medicine: "ORS Electral Powder",
        dosage: "200ml every hour",
        frequency: "Minimum",
        duration: "2-3 days",
        instructions: "Take small sips continuously.",
        compartment
      };
  }
}

function getCetirizineInfo(ageGroup: AgeGroup, compartment?: number): DosageInfo {
  if (ageGroup === 'infant') {
    return {
      medicine: "Avil Syrup (Alternative)",
      dosage: "1.25ml",
      frequency: "Twice daily",
      duration: "5 days",
      instructions: "Consult doctor for infant allergy."
    };
  }
  if (ageGroup === 'toddler' || ageGroup === 'child') {
    return {
      medicine: "Cetirizine Syrup / 5mg tablet",
      dosage: "5ml / Half tablet",
      frequency: "Once daily at night",
      duration: "5-7 days",
      instructions: "May cause slight sleepiness.",
      compartment
    };
  }
  return {
    medicine: "Cetirizine 10mg",
    dosage: "1 tablet",
    frequency: "Once daily at night",
    duration: "7 days",
    instructions: "Do not drive after taking. May cause sleepiness.",
    compartment
  };
}

function getClotrimazoleInfo(ageGroup: AgeGroup, compartment?: number): DosageInfo {
  return {
    medicine: "Clotrimazole 1% Cream (Candid)",
    dosage: "Thin layer",
    frequency: "Twice daily",
    duration: "2-4 weeks",
    instructions: "Apply on clean, dry skin. Continue for 1 week after symptoms disappear.",
    compartment
  };
}
