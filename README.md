# H.E.A.L.E.R - A.P.S 🏥🤖
### **H**ealth **E**mpowerment & **A**utomated **L**ogistics **E**mergency **R**esponse - **A**dvanced **P**rescription **S**ystem

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?style=flat&logo=vite)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Arduino](https://img.shields.io/badge/Hardware-Arduino_Mega-00979D?style=flat&logo=arduino)](https://www.arduino.cc/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-4.1-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)

---

## 🌟 Overview
**H.E.A.L.E.R - A.P.S** is a production-grade, hardware-integrated intelligent medical kiosk designed for schools and remote areas. It provides automated health assistance, clinical-grade symptom diagnosis, and precise medicine dispensing.

Built for **Army Public School (APS)**, this system ensures that students and staff have 24/7 access to basic medical screening and emergency medication via a secure, automated interface.

---

## 🚀 Key Features

### 🧠 Smart Diagnosis Engine (v3.0)
- **Multi-Track Screening:** Specialized diagnostic paths for Flu, Headaches, Gastric issues, and Skin conditions.
- **Clinical Guidelines:** Age-appropriate dosage logic for Children (1-12), Adults, and Elderly.
- **Safety Protocol:** Mandatory "Red-Flag" checks to identify life-threatening symptoms and trigger immediate alerts.

### ⚙️ Hardware & Logistics
- **Web Serial API Control:** Driverless communication between the browser and Arduino Mega for real-time motor control.
- **Precision Dispensing:** Servo-driven mechanism for accurate medicine delivery from multi-compartment silos.
- **Hybrid Firmware:** Supports both **Detach Mode** (power efficient) and **Attach Mode** (high security).

### 👥 User Experience
- **Bi-lingual Interface:** Fully localized support for **English** and **Hindi**.
- **Secure Access:** Login via RFID tags or QR codes for personalized health tracking.
- **Digital Health Records:** Automated prescription delivery via email and instant QR code generation.

### 🛡️ Admin & Analytics
- **Live Inventory Tracking:** Monitor medicine stock levels in real-time.
- **Hardware Debugger:** Integrated serial console for onsite maintenance and sensor testing.
- **ESP32-CAM Integration:** Captures session photos for remote doctor verification.

---

## 📂 Directory Structure

```text
.
├── arduino/               # Firmware for Arduino Mega & ESP32-CAM
├── public/                # Static assets and icons
├── src/
│   ├── components/        # Reusable UI components (Buttons, Modals, Cards)
│   ├── context/           # Global state management
│   ├── lib/               # External library configurations
│   ├── screens/           # Main application views (Dashboard, Diagnosis, etc.)
│   ├── services/          # Core logic: dbService, emailService, serialService
│   ├── utils/             # Helper functions and constants
│   ├── App.tsx            # Main Application routing
│   └── locales.json       # Translation strings (EN/HI)
├── .env.example           # Template for environment variables
└── vite.config.ts         # Vite configuration
```

---

## 🛠️ Installation & Setup

### 1. Prerequisites
- **Node.js** (v20+)
- **Arduino IDE** (for flashing firmware)
- **Chrome/Edge Browser** (Required for Web Serial API)

### 2. Software Installation
```bash
# Clone the repository
git clone <your-repo-link>

# Install dependencies
npm install

# Setup Environment
cp .env.example .env
# Edit .env with your Gmail App Password & API Keys
```

### 3. Hardware Setup
1. Connect your **Arduino Mega** via USB.
2. Open `arduino/H.E.A.L.E.R_Mega_Detach_.ino` in Arduino IDE.
3. Install libraries: `Servo`, `SPI`, `MFRC522`.
4. Upload to the Mega.

### 4. Running the App
```bash
npm run dev
```
Navigate to `http://localhost:5173`. Click the **Serial Connect** button to link the hardware.

---

## 📄 License

MIT License

Copyright (c) 2026 Madhur Mishra (Madhurmishrax) & Nikhil Kumar Yadav (NikhilKY64)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---
Developed with ❤️ for a safer and healthier community.
