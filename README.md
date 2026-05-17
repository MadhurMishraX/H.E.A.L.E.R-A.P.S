# H.E.A.L.E.R - A.P.S 🏥🤖
### **H**ealth **E**mpowerment & **A**utomated **L**ogistics **E**mergency **R**esponse
#### **Advanced Prescription & Diagnostic Kiosk for Remote Communities, Villages, & Public Spaces**

---

## 🌟 Vision & Overview
**H.E.A.L.E.R - A.P.S** is a state-of-the-art, hardware-integrated medical kiosk designed as a universal, 24/7 automated primary care station for **remote villages, underserved rural communities, schools, disaster relief zones, and public spaces**. It serves as an automated first-responder clinic, providing clinical-grade symptom screening and immediate dispensing of basic medications.

Our mission is to bridge the gap between symptom onset and professional medical intervention, ensuring that citizens, families, and remote workers have access to safe, audited, and automated healthcare without delay.

---

## 🧠 The Diagnosis Engine: How It Works
The core of H.E.A.L.E.R is a **Multi-Track Clinical Decision Support System (CDSS)**. Unlike simple chatbots, our engine follows strict medical branching logic modeled after standard triage protocols.

### 🛡️ Safety-First Philosophy
- **Red-Flag Prioritization:** Before any diagnosis is made, the system checks for "Life-Threatening Signals" (e.g., chest pain, respiratory distress, high fever >104°F). If detected, the system immediately halts and initiates an **Emergency Medical Referral**.
- **The 4-Track System:**
  1. **Flu & Fever:** Differentiates between Common Flu, Seasonal Viral Fever, and serious infections.
  2. **Headache:** Identifies triggers like stress, hunger, or potentially serious neurological indicators (Migraine vs. Tension).
  3. **Gastric/Stomach:** Screens for acidity, food poisoning, and dehydration risks.
  4. **Skin & Allergy:** Analyzes rashes, fungal infections, and bacterial signals (includes camera-assisted capture).

### 📊 Accuracy & Reliability
- **Vetted Logic:** The diagnosis logic has undergone a rigorous bug audit (May 2026) to ensure paths like *Viral Fever* and *Bacterial Skin Infections* are correctly identified.
- **Medication Coverage:** The system handles standard treatments for:
  - **Fever:** Dolo 650, Crocin 500/250, Calpol Drops.
  - **Dehydration:** ORS Electral (age-specific mixing instructions).
  - **Allergy:** Cetirizine (Tablet/Syrup), Avil, Calamine.
  - **Infections:** T-Bact (Bacterial), Clotrimazole (Fungal).
- **Age-Appropriate Dosage:** Integrated `dosageRules.ts` ensures that a 7-year-old child and a 40-year-old adult receive different, safe quantities of the same medication.
- **Confidence Scoring:** Every diagnosis is accompanied by a confidence percentage (70%–95%) based on the specificity of the answers provided.

---

## 🚀 Key Features

### 🔌 Hardware Integration (IoT)
- **Web Serial Control:** Driverless communication between the web interface and **Arduino Mega**.
- **Precision Dispensing:** High-torque servo motors manage 4+ independent medicine compartments with zero-jam logic.
- **RFID & QR Security:** Secure login via citizen health cards, patient ID cards, or custom QR codes to prevent unauthorized access.
- **ESP32-CAM:** Visual confirmation of skin conditions and session recording for remote verification.

### 👥 User Experience
- **Bi-lingual Support:** Complete localization in **English** and **Hindi**, making it accessible to local residents, remote populations, and children alike.
- **Voice Feedback (Future Ready):** Designed for low-literacy accessibility in rural areas.
- **Digital Prescriptions:** Instant QR-code based prescriptions and automated email delivery to patients or family guardians.

### 🛠️ Admin & Maintenance
- **Live Inventory Tracking:** Real-time monitoring of medicine stock levels with low-stock alerts.
- **Hardware Debugger:** A built-in terminal to test sensors, calibrate motors, and view raw serial logs.
- **Session History:** Comprehensive logs of all diagnoses for community health tracking and medical records.

---

## 🏗️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, TypeScript |
| **Styling** | Tailwind CSS 4.0, Framer Motion (Animations) |
| **Database** | Dexie.js (IndexedDB for offline-first capability) |
| **Hardware** | Arduino Mega (C++), Web Serial API |
| **Mobile** | Capacitor (Android/iOS Bridge) |
| **AI/ML** | Google Gemini (Experimental AI Analysis) |
| **Icons & Charts** | Lucide-React, Recharts |

---

## 📂 Project Architecture

```text
.
├── arduino/               # Firmware: Motor control, RFID, & Camera logic
├── src/
│   ├── components/        # UI: HardwareModal, DiagnosisCards, InventoryStats
│   ├── context/           # State: AppContext (Global State Management)
│   ├── screens/           # Views: Landing, Diagnosis, Dispensing, Admin
│   ├── services/          # Logic: dbService, emailService, settingsService
│   ├── utils/             # Core: diagnosisEngine.ts, serialComm.ts, dosageRules.ts
│   └── locales.json       # Translations: Hindi & English strings
└── capacitor.config.ts    # Hybrid mobile app configuration
```

---

## ⚙️ Setup & Installation

### 1️⃣ Software Setup
```bash
# Clone the repository
git clone https://github.com/MadhurMishraX/H.E.A.L.E.R-A.P.S.git

# Install dependencies
npm install

# Environment Configuration
# Create a .env file and add your Google Gemini API Key and Email credentials
cp .env.example .env

# Run development server
npm run dev
```

### 2️⃣ Hardware Setup
1. Connect an **Arduino Mega** to your computer.
2. Flash the firmware found in `arduino/H.E.A.L.E.R_Mega_Detach_.ino`.
3. Open the web app and click the **Connect Hardware** button in the top right.
4. Ensure your browser permissions allow **Serial Port** access.

---

## 👨‍💻 The Team

### 💻 Developers
Developed with passion and clinical precision by:
- **Madhur Mishra** ([@Madhurmishrax](https://github.com/Madhurmishrax)) — Core Logic & Software Architecture
- **Nikhil Kumar Yadav** ([@NikhilKY64](https://github.com/NikhilKY64)) — Hardware Integration & Firmware

### 🏗️ Structural Engineers & Creative Design
Special thanks to our teammates who brought structural integrity and creative vision to this project:
- **Shakshi Singh**
- **Riya Yadav**
- **Kashish Adhikari**

> [!NOTE]
> This project is a result of seamless collaboration between software logic and physical design. We extend equal respect to our developers for the code and our structural team for their immense contribution to the project's creativity and hardware architecture.

---

## 📄 License & Disclaimer
This project is licensed under the **MIT License**.

**Disclaimer:** *H.E.A.L.E.R is a preliminary screening tool and does not replace professional medical advice. Always consult with a qualified doctor for serious conditions.*

---
Developed as a Global Healthcare Initiative | 2026 🇮🇳
