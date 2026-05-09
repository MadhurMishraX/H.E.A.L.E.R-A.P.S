// Redesigned Diagnosis Engine for H.E.A.L.E.R-A.P.S
// Philosophy: Default to dispensing, only escalate to doctor if genuinely dangerous signals appear.

export interface Option {
  text_en: string;
  text_hi: string;
}

export interface Question {
  id: string;
  text_en: string;
  text_hi: string;
  type: 'yes_no' | 'multiple_choice' | 'multiple_select';
  options: Option[];
  camera_trigger?: boolean;
}

export const QUESTION_TREE: Record<string, Question> = {
  // STEP 1 — OPENING (Always asked)
  'Q1': {
    id: 'Q1',
    text_en: "What is bothering you the most today?",
    text_hi: "आज आपको सबसे अधिक क्या परेशान कर रहा है?",
    type: 'multiple_choice',
    options: [
      { text_en: "Fever / Cold / Body aches", text_hi: "बुखार / सर्दी / शरीर में दर्द" },
      { text_en: "Headache", text_hi: "सिरदर्द" },
      { text_en: "Stomach / Loose motions / Vomiting", text_hi: "पेट / दस्त / उल्टी" },
      { text_en: "Skin / Itching / Rash", text_hi: "त्वचा / खुजली / चकत्ते" }
    ]
  },

  // --- TRACK A — FLU / FEVER (8 questions) ---
  'Q_A2': {
    id: 'Q_A2',
    text_en: "Do you currently have a fever?",
    text_hi: "क्या आपको अभी बुखार है?",
    type: 'multiple_choice',
    options: [
      { text_en: "Yes, I measured it and it is high (above 102°F)", text_hi: "हाँ, मैंने इसे मापा है और यह तेज़ है (102°F से ऊपर)" },
      { text_en: "I feel warm / feverish but have not measured", text_hi: "मैं गर्म / बुखार महसूस कर रहा हूँ लेकिन मापा नहीं है" },
      { text_en: "Yes, mild warmth only (below 101°F)", text_hi: "हाँ, केवल हल्की गर्मी (101°F से नीचे)" },
      { text_en: "No fever at all", text_hi: "बिल्कुल बुखार नहीं" }
    ]
  },
  'Q_A3': {
    id: 'Q_A3',
    text_en: "Do you have body aches or joint pain?",
    text_hi: "क्या आपको शरीर में दर्द या जोड़ों में दर्द है?",
    type: 'multiple_choice',
    options: [
      { text_en: "Yes, significant — hard to move", text_hi: "हाँ, महत्वपूर्ण — हिलना मुश्किल है" },
      { text_en: "Yes, mild — manageable", text_hi: "हाँ, हल्का — प्रबंधनीय" },
      { text_en: "No", text_hi: "नहीं" }
    ]
  },
  'Q_A4': {
    id: 'Q_A4',
    text_en: "Do you have any of these? (select all that apply)",
    text_hi: "क्या आपको इनमें से कोई है? (जो भी लागू हो उसे चुनें)",
    type: 'multiple_select',
    options: [
      { text_en: "Runny nose", text_hi: "बहती नाक" },
      { text_en: "Blocked nose", text_hi: "बंद नाक" },
      { text_en: "Sore throat", text_hi: "गले में खराश" },
      { text_en: "Dry cough", text_hi: "सूखी खांसी" },
      { text_en: "Wet cough with phlegm", text_hi: "बलगम वाली गीली खांसी" },
      { text_en: "None of these", text_hi: "इनमें से कोई नहीं" }
    ]
  },
  'Q_A5': {
    id: 'Q_A5',
    text_en: "Do you feel tired or weak overall?",
    text_hi: "क्या आप कुल मिलाकर थकान या कमजोरी महसूस करते हैं?",
    type: 'multiple_choice',
    options: [
      { text_en: "Yes very much — I cannot do daily activities", text_hi: "हाँ बहुत ज़्यादा — मैं दैनिक गतिविधियाँ नहीं कर सकता" },
      { text_en: "Mild tiredness — I can manage", text_hi: "हल्की थकान — मैं प्रबंधन कर सकता हूँ" },
      { text_en: "No tiredness", text_hi: "कोई थकान नहीं" }
    ]
  },
  'Q_A6': {
    id: 'Q_A6',
    text_en: "Have you had these symptoms before and recovered on your own?",
    text_hi: "क्या आपको ये लक्षण पहले हुए हैं और आप खुद ही ठीक हो गए हैं?",
    type: 'multiple_choice',
    options: [
      { text_en: "Yes, same thing happens every season / regularly", text_hi: "हाँ, हर मौसम में / नियमित रूप से ऐसा ही होता है" },
      { text_en: "Yes, had it before but went to doctor", text_hi: "हाँ, पहले हुआ था लेकिन डॉक्टर के पास गया था" },
      { text_en: "No, this is new or unusual for me", text_hi: "नहीं, यह मेरे लिए नया या असामान्य है" }
    ]
  },
  'Q_A7': {
    id: 'Q_A7',
    text_en: "How many days have you had these symptoms?",
    text_hi: "आपको ये लक्षण कितने दिनों से हैं?",
    type: 'multiple_choice',
    options: [
      { text_en: "Started today or yesterday (1–2 days)", text_hi: "आज या कल शुरू हुआ (1-2 दिन)" },
      { text_en: "3–4 days", text_hi: "3-4 दिन" },
      { text_en: "5–6 days", text_hi: "5-6 दिन" },
      { text_en: "7 days or more", text_hi: "7 दिन या उससे अधिक" }
    ]
  },
  'Q_A8': {
    id: 'Q_A8',
    text_en: "Have you taken any medicine for this already?",
    text_hi: "क्या आपने इसके लिए पहले से ही कोई दवा ली है?",
    type: 'multiple_choice',
    options: [
      { text_en: "Yes, took paracetamol and felt some relief", text_hi: "हाँ, पैरासिटामोल ली और कुछ राहत महसूस हुई" },
      { text_en: "Yes, took medicine but no relief at all", text_hi: "हाँ, दवा ली लेकिन बिल्कुल राहत नहीं मिली" },
      { text_en: "No medicine taken yet", text_hi: "अभी तक कोई दवा नहीं ली" }
    ]
  },
  'Q_A9': {
    id: 'Q_A9',
    text_en: "Do you have any of these serious symptoms RIGHT NOW?",
    text_hi: "क्या आपको अभी इनमें से कोई गंभीर लक्षण है?",
    type: 'multiple_choice',
    options: [
      { text_en: "Difficulty breathing or chest pain", text_hi: "सांस लेने में कठिनाई या सीने में दर्द" },
      { text_en: "Fever above 104°F that won't come down", text_hi: "104°F से ऊपर बुखार जो कम नहीं हो रहा है" },
      { text_en: "Vomiting everything I eat or drink", text_hi: "जो कुछ भी मैं खाता या पीता हूँ उसे उल्टी कर देना" },
      { text_en: "Extreme confusion or can't stay awake", text_hi: "अत्यधिक भ्रम या जागते रहने में असमर्थता" },
      { text_en: "None of these", text_hi: "इनमें से कोई नहीं" }
    ]
  },

  // --- TRACK B — HEADACHE (8 questions) ---
  'Q_B2': {
    id: 'Q_B2',
    text_en: "Where exactly is your headache?",
    text_hi: "आपका सिरदर्द वास्तव में कहाँ है?",
    type: 'multiple_choice',
    options: [
      { text_en: "Forehead or behind the eyes", text_hi: "माथा या आँखों के पीछे" },
      { text_en: "One side of the head only", text_hi: "सिर का केवल एक पक्ष" },
      { text_en: "Back of the head or neck", text_hi: "सिर के पीछे या गर्दन" },
      { text_en: "All over the head", text_hi: "पूरे सिर में" }
    ]
  },
  'Q_B3': {
    id: 'Q_B3',
    text_en: "How bad is the pain right now?",
    text_hi: "अभी दर्द कितना बुरा है?",
    type: 'multiple_choice',
    options: [
      { text_en: "Mild — I can work normally", text_hi: "हल्का — मैं सामान्य रूप से काम कर सकता हूँ" },
      { text_en: "Moderate — it is distracting but manageable", text_hi: "मध्यम — यह विचलित करने वाला है लेकिन प्रबंधनीय है" },
      { text_en: "Severe — I cannot do anything", text_hi: "गंभीर — मैं कुछ नहीं कर सकता" }
    ]
  },
  'Q_B4': {
    id: 'Q_B4',
    text_en: "How long has this headache been going on?",
    text_hi: "यह सिरदर्द कब से चल रहा है?",
    type: 'multiple_choice',
    options: [
      { text_en: "Just started (less than 4 hours)", text_hi: "अभी शुरू हुआ (4 घंटे से कम)" },
      { text_en: "Half a day to 1 day", text_hi: "आधा दिन से 1 दिन" },
      { text_en: "2–3 days", text_hi: "2-3 दिन" },
      { text_en: "More than 3 days", text_hi: "3 दिनों से अधिक" }
    ]
  },
  'Q_B5': {
    id: 'Q_B5',
    text_en: "Do you also have any of these?",
    text_hi: "क्या आपको इनमें से कोई और भी है?",
    type: 'multiple_select',
    options: [
      { text_en: "Nausea or want to vomit", text_hi: "जी मिचलाना या उल्टी करने की इच्छा" },
      { text_en: "Sensitivity to light or noise", text_hi: "प्रकाश या शोर के प्रति संवेदनशीलता" },
      { text_en: "Neck stiffness or pain when moving neck", text_hi: "गर्दन में अकड़न या गर्दन हिलाते समय दर्द" },
      { text_en: "Blurred or double vision", text_hi: "धुंधली या दोहरी दृष्टि" },
      { text_en: "None of these", text_hi: "इनमें से कोई नहीं" }
    ]
  },
  'Q_B6': {
    id: 'Q_B6',
    text_en: "Do you have fever along with the headache?",
    text_hi: "क्या आपको सिरदर्द के साथ बुखार है?",
    type: 'multiple_choice',
    options: [
      { text_en: "Yes, fever is the main problem and headache came with it", text_hi: "हाँ, बुखार मुख्य समस्या है और इसके साथ सिरदर्द आया" },
      { text_en: "No fever", text_hi: "कोई बुखार नहीं" }
    ]
  },
  'Q_B7': {
    id: 'Q_B7',
    text_en: "Have you had this kind of headache before?",
    text_hi: "क्या आपको पहले इस तरह का सिरदर्द हुआ है?",
    type: 'multiple_choice',
    options: [
      { text_en: "Yes, I get this regularly — same pattern every time", text_hi: "हाँ, मुझे यह नियमित रूप से होता है — हर बार एक ही पैटर्न" },
      { text_en: "Yes, but this time it feels different or worse", text_hi: "हाँ, लेकिन इस बार यह अलग या बुरा लगता है" },
      { text_en: "No, this is the first time", text_hi: "नहीं, यह पहली बार है" }
    ]
  },
  'Q_B8': {
    id: 'Q_B8',
    text_en: "Did the headache start after any of these?",
    text_hi: "क्या सिरदर्द इनमें से किसी के बाद शुरू हुआ?",
    type: 'multiple_choice',
    options: [
      { text_en: "Skipping a meal / empty stomach", text_hi: "खाना छोड़ना / खाली पेट" },
      { text_en: "Screen time / too much reading", text_hi: "स्क्रीन टाइम / बहुत अधिक पढ़ना" },
      { text_en: "Stress or lack of sleep", text_hi: "तनाव या नींद की कमी" },
      { text_en: "Sudden loud noise or bright light", text_hi: "अचानक शोर या तेज़ रोशनी" },
      { text_en: "No specific trigger I can think of", text_hi: "कोई विशिष्ट ट्रिगर नहीं जो मैं सोच सकूं" }
    ]
  },
  'Q_B9': {
    id: 'Q_B9',
    text_en: "Do you have any of these RIGHT NOW?",
    text_hi: "क्या आपको अभी इनमें से कोई लक्षण है?",
    type: 'multiple_choice',
    options: [
      { text_en: "Sudden worst headache of my life — came on in seconds", text_hi: "मेरे जीवन का अचानक सबसे खराब सिरदर्द — सेकंड में आया" },
      { text_en: "Headache with stiff neck AND fever together", text_hi: "गर्दन में अकड़न और बुखार के साथ सिरदर्द" },
      { text_en: "Vision loss or one side of face / body feels numb", text_hi: "दृष्टि हानि या चेहरे / शरीर का एक हिस्सा सुन्न महसूस होना" },
      { text_en: "None of these", text_hi: "इनमें से कोई नहीं" }
    ]
  },

  // --- TRACK C — STOMACH (9 questions) ---
  'Q_C2': {
    id: 'Q_C2',
    text_en: "What is your main stomach complaint?",
    text_hi: "आपकी पेट की मुख्य शिकायत क्या है?",
    type: 'multiple_choice',
    options: [
      { text_en: "Loose motions / Diarrhea", text_hi: "दस्त / डायरिया" },
      { text_en: "Vomiting", text_hi: "उल्टी" },
      { text_en: "Both loose motions and vomiting together", text_hi: "दस्त और उल्टी दोनों एक साथ" },
      { text_en: "Burning / Acidity / Sour burps", text_hi: "जलन / एसिडिटी / खट्टी डकारें" },
      { text_en: "Stomach cramps or pain", text_hi: "पेट में मरोड़ या दर्द" },
      { text_en: "Bloating or gas", text_hi: "पेट फूलना या गैस" }
    ]
  },
  'Q_C3': {
    id: 'Q_C3',
    text_en: "Did it start after eating outside food, oily food, or something unusual?",
    text_hi: "क्या यह बाहर का खाना, तैलीय खाना या कुछ असामान्य खाने के बाद शुरू हुआ?",
    type: 'multiple_choice',
    options: [
      { text_en: "Yes, clearly started after eating outside or unusual food", text_hi: "हाँ, स्पष्ट रूप से बाहर का या असामान्य खाना खाने के बाद शुरू हुआ" },
      { text_en: "Maybe — I am not sure", text_hi: "शायद — मुझे यकीन नहीं है" },
      { text_en: "No, it started on its own", text_hi: "नहीं, यह अपने आप शुरू हुआ" }
    ]
  },
  'Q_C4': {
    id: 'Q_C4',
    text_en: "How many times have you had loose motions or vomiting today?",
    text_hi: "आज आपको कितनी बार दस्त या उल्टी हुई है?",
    type: 'multiple_choice',
    options: [
      { text_en: "1–2 times", text_hi: "1-2 बार" },
      { text_en: "3–5 times", text_hi: "3-5 बार" },
      { text_en: "More than 5 times", text_hi: "5 बार से अधिक" }
    ]
  },
  'Q_C5': {
    id: 'Q_C5',
    text_en: "Are you able to drink water or fluids without vomiting them back up?",
    text_hi: "क्या आप पानी या तरल पदार्थ बिना उल्टी किए पी पा रहे हैं?",
    type: 'multiple_choice',
    options: [
      { text_en: "Yes, I can keep fluids down", text_hi: "हाँ, मैं तरल पदार्थ अंदर रख सकता हूँ" },
      { text_en: "I vomit sometimes but can keep some down", text_hi: "मैं कभी-कभी उल्टी करता हूँ लेकिन कुछ अंदर रख सकता हूँ" },
      { text_en: "No, I vomit everything immediately", text_hi: "नहीं, मैं तुरंत सब कुछ उल्टी कर देता हूँ" }
    ]
  },
  'Q_C6': {
    id: 'Q_C6',
    text_en: "Do you have fever along with the stomach issue?",
    text_hi: "क्या आपको पेट की समस्या के साथ बुखार है?",
    type: 'multiple_choice',
    options: [
      { text_en: "Yes, high fever above 102°F", text_hi: "हाँ, 102°F से ऊपर तेज़ बुखार" },
      { text_en: "Mild fever or just feel warm", text_hi: "हल्का बुखार या बस गर्म महसूस होना" },
      { text_en: "No fever", text_hi: "कोई बुखार नहीं" }
    ]
  },
  'Q_C7': {
    id: 'Q_C7',
    text_en: "Is there any blood or dark black color in the stool or vomit?",
    text_hi: "क्या मल या उल्टी में कोई रक्त या गहरा काला रंग है?",
    type: 'multiple_choice',
    options: [
      { text_en: "Yes", text_hi: "हाँ" },
      { text_en: "No", text_hi: "नहीं" }
    ]
  },
  'Q_C8': {
    id: 'Q_C8',
    text_en: "Do you feel very weak, dizzy, or like you might faint?",
    text_hi: "क्या आप बहुत कमजोरी, चक्कर आना या ऐसा महसूस करते हैं कि आप बेहोश हो सकते हैं?",
    type: 'multiple_choice',
    options: [
      { text_en: "Yes, significantly", text_hi: "हाँ, काफी हद तक" },
      { text_en: "Mild weakness", text_hi: "हल्की कमजोरी" },
      { text_en: "No, I feel okay otherwise", text_hi: "नहीं, मैं अन्यथा ठीक महसूस करता हूँ" }
    ]
  },
  'Q_C9': {
    id: 'Q_C9',
    text_en: "How long have these symptoms been going on?",
    text_hi: "ये लक्षण कब से चल रहे हैं?",
    type: 'multiple_choice',
    options: [
      { text_en: "Started today (less than 12 hours)", text_hi: "आज शुरू हुआ (12 घंटे से कम)" },
      { text_en: "1 day", text_hi: "1 दिन" },
      { text_en: "2–3 days", text_hi: "2-3 दिन" },
      { text_en: "More than 3 days", text_hi: "3 दिनों से अधिक" }
    ]
  },
  'Q_C10': {
    id: 'Q_C10',
    text_en: "Have you had similar stomach issues before and recovered without a doctor?",
    text_hi: "क्या आपको पहले भी ऐसी ही पेट की समस्या हुई है और बिना डॉक्टर के ठीक हुए हैं?",
    type: 'multiple_choice',
    options: [
      { text_en: "Yes, happens regularly after outside food", text_hi: "हाँ, बाहर के खाने के बाद नियमित रूप से होता है" },
      { text_en: "Yes, but it took time", text_hi: "हाँ, लेकिन इसमें समय लगा" },
      { text_en: "No, this is new", text_hi: "नहीं, यह नया है" }
    ]
  },

  // --- TRACK D — SKIN INFECTION (8 questions) ---
  'Q_D2': {
    id: 'Q_D2',
    text_en: "How would you describe the skin problem?",
    text_hi: "आप त्वचा की समस्या का वर्णन कैसे करेंगे?",
    type: 'multiple_choice',
    camera_trigger: true,
    options: [
      { text_en: "Itching with redness — no visible wound", text_hi: "लालिमा के साथ खुजली — कोई दृश्य घाव नहीं" },
      { text_en: "Peeling, flaking, or cracking skin", text_hi: "त्वचा का छिलना, झड़ना या फटना" },
      { text_en: "Ring-shaped red patch spreading outward", text_hi: "बाहर की ओर फैलने वाला अंगूठी के आकार का लाल धब्बा" },
      { text_en: "Pus-filled bumps or oozing skin", text_hi: "मवाद से भरे उभार या रिसती हुई त्वचा" },
      { text_en: "White or light-colored patches", text_hi: "सफेद या हल्के रंग के धब्बे" },
      { text_en: "Dry rough patches with no itching", text_hi: "बिना खुजली के सूखे खुरदरे धब्बे" }
    ]
  },
  'Q_D3': {
    id: 'Q_D3',
    text_en: "Where on the body is it?",
    text_hi: "यह शरीर पर कहाँ है?",
    type: 'multiple_choice',
    options: [
      { text_en: "Between toes or on the feet", text_hi: "पैर की उंगलियों के बीच या पैरों पर" },
      { text_en: "Groin, inner thighs, or buttocks area", text_hi: "जांघों के बीच, भीतरी जांघों या नितंबों का क्षेत्र" },
      { text_en: "Underarms, under breasts, or skin folds", text_hi: "बगल, स्तनों के नीचे या त्वचा की तह" },
      { text_en: "Scalp or face", text_hi: "सिर या चेहरा" },
      { text_en: "Arms, legs, back, or chest (open areas)", text_hi: "हाथ, पैर, पीठ या छाती (खुले क्षेत्र)" }
    ]
  },
  'Q_D4': {
    id: 'Q_D4',
    text_en: "How long has this been there?",
    text_hi: "यह वहाँ कब से है?",
    type: 'multiple_choice',
    options: [
      { text_en: "Just appeared — 1 to 3 days", text_hi: "अभी दिखाई दिया — 1 से 3 दिन" },
      { text_en: "About a week", text_hi: "लगभग एक सप्ताह" },
      { text_en: "More than 2 weeks", text_hi: "2 सप्ताह से अधिक" }
    ]
  },
  'Q_D5': {
    id: 'Q_D5',
    text_en: "Does it get worse in hot weather, after sweating, or when the area is moist?",
    text_hi: "क्या यह गर्म मौसम में, पसीने के बाद, या जब क्षेत्र नम हो तो बदतर हो जाता है?",
    type: 'multiple_choice',
    options: [
      { text_en: "Yes, clearly worse after sweat or moisture", text_hi: "हाँ, पसीने या नमी के बाद स्पष्ट रूप से खराब" },
      { text_en: "Sometimes", text_hi: "कभी-कभी" },
      { text_en: "No difference", text_hi: "कोई अंतर नहीं" }
    ]
  },
  'Q_C6_SKIN': { // Renamed to avoid collision or just keep it logical
    id: 'Q_C6_SKIN',
    text_en: "Is there any fever along with the skin problem?",
    text_hi: "क्या त्वचा की समस्या के साथ बुखार है?",
    type: 'multiple_choice',
    options: [
      { text_en: "Yes, high fever", text_hi: "हाँ, तेज़ बुखार" },
      { text_en: "Mild fever", text_hi: "हल्का बुखार" },
      { text_en: "No fever at all", text_hi: "बिल्कुल बुखार नहीं" }
    ]
  },
  'Q_D7': {
    id: 'Q_D7',
    text_en: "Is the affected area spreading or getting larger day by day?",
    text_hi: "क्या प्रभावित क्षेत्र दिन-ब-दिन फैल रहा है या बड़ा हो रहा है?",
    type: 'multiple_choice',
    options: [
      { text_en: "Yes, spreading fast — doubled in size in 2 days", text_hi: "हाँ, तेज़ी से फैल रहा है — 2 दिनों में आकार दोगुना हो गया" },
      { text_en: "Spreading slowly", text_hi: "धीरे-धीरे फैल रहा है" },
      { text_en: "Staying the same size", text_hi: "उसी आकार का रहना" }
    ]
  },
  'Q_D8': {
    id: 'Q_D8',
    text_en: "Do you also have itching in other parts of the body, not just the main affected area?",
    text_hi: "क्या आपको शरीर के अन्य हिस्सों में भी खुजली है, न कि केवल मुख्य प्रभावित क्षेत्र में?",
    type: 'multiple_choice',
    options: [
      { text_en: "Yes, itching all over or in multiple spots", text_hi: "हाँ, पूरे शरीर में या कई जगहों पर खुजली" },
      { text_en: "Just the main area", text_hi: "सिर्फ मुख्य क्षेत्र" },
      { text_en: "No itching, just the skin change", text_hi: "खुजली नहीं, सिर्फ त्वचा में बदलाव" }
    ]
  },
  'Q_D9': {
    id: 'Q_D9',
    text_en: "Is the patient a baby under 6 months or does the skin have open deep wounds?",
    text_hi: "क्या रोगी 6 महीने से कम का बच्चा है या त्वचा पर खुले गहरे घाव हैं?",
    type: 'multiple_choice',
    options: [
      { text_en: "Yes", text_hi: "हाँ" },
      { text_en: "No", text_hi: "नहीं" }
    ]
  },

  // --- GLOBAL CLOSING CHECK ---
  'Q_CLOSE': {
    id: 'Q_CLOSE',
    text_en: "Do you have any of these right now?",
    text_hi: "क्या आपके पास अभी इनमें से कोई है?",
    type: 'multiple_choice',
    options: [
      { text_en: "Chest pain or cannot breathe properly", text_hi: "सीने में दर्द या ठीक से सांस नहीं ले पाना" },
      { text_en: "Fever above 104°F not coming down", text_hi: "104°F से ऊपर बुखार जो कम नहीं हो रहा है" },
      { text_en: "Unconscious, seizure, or extreme confusion", text_hi: "बेहोश, दौरा या अत्यधिक भ्रम" },
      { text_en: "None of these", text_hi: "इनमें से कोई नहीं" }
    ]
  }
};

export function getNextQuestion(currentQuestionId: string, selectedOption: any, scores: any) {
  if (currentQuestionId === 'Q1') {
    if (selectedOption === 0) return 'Q_A2';
    if (selectedOption === 1) return 'Q_B2';
    if (selectedOption === 2) return 'Q_C2';
    if (selectedOption === 3) return 'Q_D2';
  }

  // Track A Flow
  if (currentQuestionId.startsWith('Q_A')) {
    const trackA = ['Q_A2', 'Q_A3', 'Q_A4', 'Q_A5', 'Q_A6', 'Q_A7', 'Q_A8', 'Q_A9'];
    const currentIndex = trackA.indexOf(currentQuestionId);
    if (currentIndex !== -1 && currentIndex < trackA.length - 1) {
      return trackA[currentIndex + 1];
    }
    return 'Q_CLOSE';
  }

  // Track B Flow
  if (currentQuestionId.startsWith('Q_B')) {
    const trackB = ['Q_B2', 'Q_B3', 'Q_B4', 'Q_B5', 'Q_B6', 'Q_B7', 'Q_B8', 'Q_B9'];
    const currentIndex = trackB.indexOf(currentQuestionId);
    if (currentIndex !== -1 && currentIndex < trackB.length - 1) {
      return trackB[currentIndex + 1];
    }
    return 'Q_CLOSE';
  }

  // Track C Flow
  if (currentQuestionId.startsWith('Q_C') && currentQuestionId !== 'Q_C6_SKIN') {
    const trackC = ['Q_C2', 'Q_C3', 'Q_C4', 'Q_C5', 'Q_C6', 'Q_C7', 'Q_C8', 'Q_C9', 'Q_C10'];
    const currentIndex = trackC.indexOf(currentQuestionId);
    if (currentIndex !== -1 && currentIndex < trackC.length - 1) {
      return trackC[currentIndex + 1];
    }
    return 'Q_CLOSE';
  }

  // Track D Flow
  if (currentQuestionId.startsWith('Q_D') || currentQuestionId === 'Q_C6_SKIN') {
    const trackD = ['Q_D2', 'Q_D3', 'Q_D4', 'Q_D5', 'Q_C6_SKIN', 'Q_D7', 'Q_D8', 'Q_D9'];
    const currentIndex = trackD.indexOf(currentQuestionId);
    if (currentIndex !== -1 && currentIndex < trackD.length - 1) {
      return trackD[currentIndex + 1];
    }
    return 'Q_CLOSE';
  }

  return null;
}

export function calculateDiagnosis(sessionAnswers: any[]) {
  const getAns = (qId: string) => {
    const ans = sessionAnswers.find(a => a.question_id === qId);
    if (!ans) return -1;
    return Array.isArray(ans.selected_option) ? ans.selected_option[0] : ans.selected_option;
  };

  const getMultiAns = (qId: string) => {
    const ans = sessionAnswers.find(a => a.question_id === qId);
    if (!ans) return [];
    return Array.isArray(ans.selected_option) ? ans.selected_option : [ans.selected_option];
  };

  // GLOBAL RED FLAGS (Q_CLOSE)
  const close = getAns('Q_CLOSE');
  if (close !== -1 && close !== 3) {
    return {
      diagnosis: 'URGENT - DOCTOR NEEDED',
      confidence: 100,
      action: "auto_referred",
      is_serious: true,
      note: "Emergency red flags detected. Please go to the hospital immediately."
    };
  }

  const q1 = getAns('Q1');

  // --- TRACK A: FLU / FEVER ---
  if (q1 === 0) {
    const a2 = getAns('Q_A2');
    const a3 = getAns('Q_A3');
    const a4 = getMultiAns('Q_A4');
    const a5 = getAns('Q_A5');
    const a6 = getAns('Q_A6');
    const a7 = getAns('Q_A7');
    const a8 = getAns('Q_A8');
    const a9 = getAns('Q_A9');

    // Red Flags
    if (a9 !== -1 && a9 !== 4) return { diagnosis: 'DOCTOR NEEDED', action: "auto_referred", is_serious: true, note: "Serious symptoms detected." };
    if (a7 === 3) return { diagnosis: 'DOCTOR NEEDED', action: "auto_referred", is_serious: true, note: "Symptoms lasting 7+ days." };
    if (a8 === 1 && a7 === 2) return { diagnosis: 'DOCTOR NEEDED', action: "auto_referred", is_serious: true, note: "No relief after medicine for 5+ days." };

    // Diagnosis
    if (a6 === 0 && (a7 >= 0 && a7 <= 1)) return { diagnosis: 'SEASONAL FLU', action: "dispense", compartment: 1, confidence: 95 };
    if (a8 === 0 && (a2 !== 3 || a3 !== 2 || (a4.length > 0 && !a4.includes(5)))) return { diagnosis: 'COMMON FLU', action: "dispense", compartment: 1, confidence: 90 };
    if (a2 !== 3 && a5 !== 2 && (a4.length === 0 || a4.includes(5))) return { diagnosis: 'VIRAL FEVER', action: "dispense", compartment: 1, confidence: 90 };
    
    return { diagnosis: 'COMMON FLU', action: "dispense", compartment: 1, confidence: 70 };
  }

  // --- TRACK B: HEADACHE ---
  if (q1 === 1) {
    const b2 = getAns('Q_B2');
    const b3 = getAns('Q_B3');
    const b4 = getAns('Q_B4');
    const b5 = getMultiAns('Q_B5');
    const b6 = getAns('Q_B6');
    const b7 = getAns('Q_B7');
    const b8 = getAns('Q_B8');
    const b9 = getAns('Q_B9');

    // Red Flags
    if (b2 === 2 && b7 === 2) return { diagnosis: 'DOCTOR NEEDED', action: "auto_referred", is_serious: true, note: "New back-of-head pain (could be BP related)." };
    if (b9 !== -1 && b9 !== 3) return { diagnosis: 'URGENT - DOCTOR NEEDED', action: "auto_referred", is_serious: true };
    if (b3 === 2 && b4 === 3) return { diagnosis: 'DOCTOR NEEDED', action: "auto_referred", is_serious: true, note: "Severe headache for 3+ days." };

    // Diagnosis
    if (b6 === 0) return { diagnosis: 'FLU-RELATED HEADACHE', action: "dispense", compartment: 1, confidence: 90 };
    if (b8 === 0) return { diagnosis: 'HUNGER / ACIDITY HEADACHE', action: "dispense", compartment: 1, confidence: 85 };
    if (b2 === 1 && b3 !== 0 && b5.includes(0) && b5.includes(1)) return { diagnosis: 'MIGRAINE', action: "dispense", compartment: 1, confidence: 90 };
    if ((b2 === 0 || b2 === 3) && b3 !== 2) return { diagnosis: 'TENSION HEADACHE', action: "dispense", compartment: 1, confidence: 90 };

    return { diagnosis: 'PROBABLE TENSION / STRESS HEADACHE', action: "dispense", compartment: 1, confidence: 70 };
  }

  // --- TRACK C: STOMACH ---
  if (q1 === 2) {
    const c2 = getAns('Q_C2');
    const c3 = getAns('Q_C3');
    const c4 = getAns('Q_C4');
    const c5 = getAns('Q_C5');
    const c6 = getAns('Q_C6');
    const c7 = getAns('Q_C7');
    const c8 = getAns('Q_C8');
    const c9 = getAns('Q_C9');

    // Red Flags
    if (c7 === 0) return { diagnosis: 'URGENT - DOCTOR NEEDED', action: "auto_referred", is_serious: true, note: "Blood detected." };
    if (c4 === 2) return { diagnosis: 'DOCTOR NEEDED', action: "auto_referred", is_serious: true, note: "Frequent episodes (>6)." };
    if (c5 === 2) return { diagnosis: 'URGENT - DOCTOR NEEDED', action: "auto_referred", is_serious: true, note: "Cannot keep fluids down." };
    if (c6 === 0) return { diagnosis: 'DOCTOR NEEDED', action: "auto_referred", is_serious: true, note: "High fever with stomach issues." };
    if (c9 === 3) return { diagnosis: 'DOCTOR NEEDED', action: "auto_referred", is_serious: true, note: "Symptoms >3 days." };

    // Diagnosis
    if (c2 === 3) return { diagnosis: 'ACIDITY / GASTRITIS', action: "dispense", confidence: 95, note: "Prescription only." };
    if (c2 === 5) return { diagnosis: 'GAS / INDIGESTION', action: "dispense", confidence: 90, note: "Prescription only." };
    if (c2 === 4) return { diagnosis: 'FOOD-RELATED CRAMPS', action: "dispense", compartment: 3, confidence: 90 };
    if (c2 === 0) return { diagnosis: 'FOOD POISONING / GASTROENTERITIS', action: "dispense", compartment: 3, confidence: 90 };
    if (c2 === 1) return { diagnosis: 'FOOD POISONING', action: "dispense", compartment: 3, confidence: 90 };
    if (c2 === 2) return { diagnosis: 'ACUTE GASTROENTERITIS', action: "dispense", compartment: 3, confidence: 90 };

    return { diagnosis: 'FOOD POISONING / GASTROENTERITIS', action: "dispense", compartment: 3, confidence: 70 };
  }

  // --- TRACK D: SKIN INFECTION ---
  if (q1 === 3) {
    const d2 = getAns('Q_D2');
    const d3 = getAns('Q_D3');
    const d4 = getAns('Q_D4');
    const d5 = getAns('Q_D5');
    const d6 = getAns('Q_C6_SKIN');
    const d7 = getAns('Q_D7');
    const d8 = getAns('Q_D8');
    const d9 = getAns('Q_D9');

    // Red Flags
    if (d9 === 0) return { diagnosis: 'DOCTOR NEEDED', action: "auto_referred", is_serious: true, note: "Baby <6mo or deep wounds." };
    if ((d2 === 3 || d7 === 0) && d6 === 0) return { diagnosis: 'URGENT - DOCTOR NEEDED', action: "auto_referred", is_serious: true, note: "Rash + High Fever." };
    if (d7 === 0 && d2 === 3 && d6 !== 2) return { diagnosis: 'DOCTOR NEEDED', action: "auto_referred", is_serious: true, note: "Fast spreading infection." };

    // Diagnosis
    if (d2 === 0 && (d3 === 1 || d3 === 0 || d3 === 2) && d5 === 0) {
      return { diagnosis: 'FUNGAL INFECTION', action: "dispense", compartment: 4, confidence: 95, extra_compartment: 2 };
    }
    if (d2 === 2) return { diagnosis: 'RINGWORM (FUNGAL)', action: "dispense", compartment: 4, confidence: 95 };
    if (d2 === 4) return { diagnosis: 'TINEA VERSICOLOR (FUNGAL)', action: "dispense", compartment: 4, confidence: 90 };
    if (d8 === 0) return { diagnosis: 'ALLERGIC RASH / URTICARIA', action: "dispense", compartment: 2, confidence: 90 };
    if (d2 === 0 && d8 === 1) return { diagnosis: 'CONTACT DERMATITIS / ALLERGY', action: "dispense", compartment: 2, confidence: 85 };
    if (d2 === 3 && (d6 === 1 || d6 === 2)) return { diagnosis: 'MINOR BACTERIAL SKIN INFECTION', action: "dispense", compartment: 2, confidence: 80 };

    return { diagnosis: 'ALLERGIC RASH / URTICARIA', action: "dispense", compartment: 2, confidence: 70 };
  }

  return {
    diagnosis: 'OTHER',
    confidence: 100,
    action: "auto_referred",
    is_serious: true,
    note: "Symptom combination requires clinical evaluation."
  };
}
