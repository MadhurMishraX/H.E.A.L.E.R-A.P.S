import { db } from './db';

export async function seedDatabase(): Promise<void> {
  const settingCount = await db.settings.count();
  if (settingCount === 0) {
    await db.settings.bulkAdd([
      { key: 'doctor_email', value: 'doctor@clinic.com' },
      { key: 'doctor_phone', value: '+919876543210' },
      { key: 'clinic_name', value: 'H.E.A.L.E.R Smart Clinic' },
      { key: 'admin_pin', value: '1234' },
      { key: 'low_stock_threshold', value: '5' },
    ]);
  }

  // Clear and re-seed disease map to ensure consistency with the new logic
  await db.disease_compartment_map.clear();
  await db.disease_compartment_map.bulkAdd([
    // TRACK A - FLU
    { disease_name: 'COMMON FLU', compartment_number: 1, is_dispensable: 1, is_serious: 0, medicine_name: 'Paracetamol', dosage_adult: '650mg', dosage_child: 'Syrup', dosage_elderly: '500mg', advice: 'Rest. Drink warm water. Sinarest/D-Cold for runny nose.' },
    { disease_name: 'VIRAL FEVER', compartment_number: 1, is_dispensable: 1, is_serious: 0, medicine_name: 'Paracetamol', dosage_adult: '650mg', dosage_child: 'Syrup', dosage_elderly: '500mg', advice: 'Stay hydrated. Take paracetamol if temp > 100°F.' },
    { disease_name: 'SEASONAL FLU', compartment_number: 1, is_dispensable: 1, is_serious: 0, medicine_name: 'Paracetamol', dosage_adult: '650mg', dosage_child: 'Syrup', dosage_elderly: '500mg', advice: 'Safe to treat at home. Use support medicines for cough/nose.' },
    
    // TRACK B - HEADACHE
    { disease_name: 'TENSION HEADACHE', compartment_number: 1, is_dispensable: 1, is_serious: 0, medicine_name: 'Paracetamol', dosage_adult: '650mg', dosage_child: 'N/A', dosage_elderly: '500mg', advice: 'Avoid screen time. Get sleep. Saridon if pain persists.' },
    { disease_name: 'MIGRAINE', compartment_number: 1, is_dispensable: 1, is_serious: 0, medicine_name: 'Paracetamol', dosage_adult: '650mg', dosage_child: 'N/A', dosage_elderly: '500mg', advice: 'Rest in a dark, quiet room. Take Domstal for nausea.' },
    { disease_name: 'PROBABLE TENSION / STRESS HEADACHE', compartment_number: 1, is_dispensable: 1, is_serious: 0, medicine_name: 'Paracetamol', dosage_adult: '650mg', dosage_child: 'N/A', dosage_elderly: '500mg', advice: 'Relax. Check for stress triggers.' },
    { disease_name: 'FLU-RELATED HEADACHE', compartment_number: 1, is_dispensable: 1, is_serious: 0, medicine_name: 'Paracetamol', dosage_adult: '650mg', dosage_child: 'Syrup', dosage_elderly: '500mg', advice: 'Treating the flu will relieve the headache.' },
    { disease_name: 'HUNGER / ACIDITY HEADACHE', compartment_number: 1, is_dispensable: 1, is_serious: 0, medicine_name: 'Paracetamol', dosage_adult: '650mg', dosage_child: 'N/A', dosage_elderly: '500mg', advice: 'Eat something light. Take Pan-D / Gelusil for acidity.' },
    
    // TRACK C - STOMACH
    { disease_name: 'FOOD POISONING / GASTROENTERITIS', compartment_number: 3, is_dispensable: 1, is_serious: 0, medicine_name: 'ORS Electral', dosage_adult: '1 Litre soln', dosage_child: '100-200ml', dosage_elderly: 'Small sips', advice: 'Very light food (Khichdi). Probiotics helpful.' },
    { disease_name: 'FOOD POISONING', compartment_number: 3, is_dispensable: 1, is_serious: 0, medicine_name: 'ORS Electral', dosage_adult: '1 Litre soln', dosage_child: '100-200ml', dosage_elderly: 'Small sips', advice: 'Drink ORS continuously. Avoid milk/oily food.' },
    { disease_name: 'ACUTE GASTROENTERITIS', compartment_number: 3, is_dispensable: 1, is_serious: 0, medicine_name: 'ORS Electral', dosage_adult: '1 Litre soln', dosage_child: '100-200ml', dosage_elderly: 'Small sips', advice: 'Critical to stay hydrated with ORS.' },
    { disease_name: 'ACIDITY / GASTRITIS', compartment_number: null, is_dispensable: 0, is_serious: 0, medicine_name: 'Pantoprazole', dosage_adult: '40mg', dosage_child: 'N/A', dosage_elderly: '40mg', advice: 'Take Pan-D empty stomach. Avoid spicy food.' },
    { disease_name: 'GAS / INDIGESTION', compartment_number: null, is_dispensable: 0, is_serious: 0, medicine_name: 'Gas-O-Fast', dosage_adult: '1 sachet', dosage_child: 'N/A', dosage_elderly: '1 sachet', advice: 'Walk after meals. Meftal Spas for cramps.' },
    { disease_name: 'FOOD-RELATED CRAMPS', compartment_number: 3, is_dispensable: 1, is_serious: 0, medicine_name: 'ORS Electral', dosage_adult: '1 Litre soln', dosage_child: '100-200ml', dosage_elderly: 'Small sips', advice: 'Meftal Spas for pain relief.' },

    // TRACK D - SKIN
    { disease_name: 'FUNGAL INFECTION', compartment_number: 4, is_dispensable: 1, is_serious: 0, medicine_name: 'Clotrimazole Cream', dosage_adult: 'Twice daily', dosage_child: 'Twice daily', dosage_elderly: 'Twice daily', advice: 'Keep area dry. Use Cetirizine for itching.' },
    { disease_name: 'RINGWORM (FUNGAL)', compartment_number: 4, is_dispensable: 1, is_serious: 0, medicine_name: 'Clotrimazole Cream', dosage_adult: 'Twice daily', dosage_child: 'Twice daily', dosage_elderly: 'Twice daily', advice: 'Apply cream 2 weeks minimum.' },
    { disease_name: 'TINEA VERSICOLOR (FUNGAL)', compartment_number: 4, is_dispensable: 1, is_serious: 0, medicine_name: 'Clotrimazole Cream', dosage_adult: 'Twice daily', dosage_child: 'Twice daily', dosage_elderly: 'Twice daily', advice: 'Use Selsun shampoo on skin.' },
    { disease_name: 'ALLERGIC RASH / URTICARIA', compartment_number: 2, is_dispensable: 1, is_serious: 0, medicine_name: 'Cetirizine 10mg', dosage_adult: '1 tablet night', dosage_child: 'Syrup', dosage_elderly: '5mg night', advice: 'Calamine lotion for soothing relief.' },
    { disease_name: 'CONTACT DERMATITIS / ALLERGY', compartment_number: 2, is_dispensable: 1, is_serious: 0, medicine_name: 'Cetirizine 10mg', dosage_adult: '1 tablet night', dosage_child: 'Syrup', dosage_elderly: '5mg night', advice: 'Identify and avoid the new trigger (soap/cloth).' },
    { disease_name: 'MINOR BACTERIAL SKIN INFECTION', compartment_number: 2, is_dispensable: 1, is_serious: 0, medicine_name: 'Cetirizine 10mg', dosage_adult: '1 tablet night', dosage_child: 'Syrup', dosage_elderly: '5mg night', advice: 'Use Mupirocin (T-Bact) cream on bumps.' },

    // REFERRALS
    { disease_name: 'URGENT - DOCTOR NEEDED', compartment_number: null, is_dispensable: 0, is_serious: 1, medicine_name: 'REFERRAL', dosage_adult: 'N/A', dosage_child: 'N/A', dosage_elderly: 'N/A', advice: 'IMMEDIATE HOSPITAL VISIT REQUIRED.' },
    { disease_name: 'DOCTOR NEEDED', compartment_number: null, is_dispensable: 0, is_serious: 1, medicine_name: 'REFERRAL', dosage_adult: 'N/A', dosage_child: 'N/A', dosage_elderly: 'N/A', advice: 'Please consult a doctor for a full checkup.' },
    { disease_name: 'OTHER', compartment_number: null, is_dispensable: 0, is_serious: 1, medicine_name: 'REFERRAL', dosage_adult: 'N/A', dosage_child: 'N/A', dosage_elderly: 'N/A', advice: 'Consultation advised.' }
  ]);

  const invCount = await db.inventory.count();
  if (invCount === 0) {
    await db.inventory.bulkAdd([
      { compartment_number: 1, medicine_name: 'Paracetamol (Dolo/Crocin)', current_count: 50, low_stock_threshold: 5, last_updated: new Date().toISOString() },
      { compartment_number: 2, medicine_name: 'Cetirizine 10mg', current_count: 50, low_stock_threshold: 5, last_updated: new Date().toISOString() },
      { compartment_number: 3, medicine_name: 'ORS Electral Powder', current_count: 50, low_stock_threshold: 5, last_updated: new Date().toISOString() },
      { compartment_number: 4, medicine_name: 'Clotrimazole 1% Cream', current_count: 50, low_stock_threshold: 5, last_updated: new Date().toISOString() },
    ]);
  }
}
