# 🛠️ H.E.A.L.E.R Hardware Setup Guide

This guide explains how to enable Hardware APIs (Web Serial & Web Bluetooth) on mobile devices and insecure connections.

---

## 📱 Enabling Hardware on Android Chrome (Local Network)

If you are accessing the app via a local IP (e.g., `http://192.168.x.x:5173`), Chrome disables Bluetooth and USB by default for security. Follow these steps to bypass this:

1.  **Open Chrome** on your Android tablet.
2.  **Go to Flags:** In the address bar, type:
    `chrome://flags/#unsafely-treat-insecure-origin-as-secure`
3.  **Enable the Setting:** Find "Insecure origins treated as secure" and set it to **Enabled**.
4.  **Add your IP:** In the text box provided, type your computer's address:
    `http://192.168.x.x:5173`
    *(Replace `x.x` with your computer's actual local IP address).*
5.  **Relaunch:** Click the **Relaunch** button at the bottom of the browser.

---

## 🌍 Production Setup (Vercel / HTTPS)

When using the production link (HTTPS), you **do not** need to change any flags.
1.  **Open your Vercel URL:** `https://your-project.vercel.app`
2.  **Hardware Prompt:** When you click "Connect," the browser will automatically show the Bluetooth or USB selection popup.

---

## 🧪 Quick Hardware Checklist

- [ ] **Power:** Is the Arduino Mega and ESP32-CAM powered?
- [ ] **Bluetooth:** Is the "HEALER-ROBOT" appearing in your phone's Bluetooth list?
- [ ] **USB OTG:** If using a tablet with USB, ensure you have a high-quality OTG adapter.
- [ ] **HTTPS:** Are you using a secure connection? (Or the Chrome Flag above).

---

## 🏁 Connection Steps in the App

1. Click the **Hardware Status** icon (Top-Right).
2. Choose **USB** or **Bluetooth** using the pill-toggle.
3. Click **Connect via [Selected Mode]**.
4. Select your device from the browser's list.
5. Wait for the green **"Hardware Online"** status.
