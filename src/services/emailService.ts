import { getAllSettings } from './settingsService';
import QRCode from 'qrcode';

// Type definition for Vite environment variables
const GAS_URL = (import.meta as any).env.VITE_GAS_URL;

export interface ReportData {
  patientName: string;
  patientAge: number;
  patientGender: string;
  symptoms: string[];
  diagnosis: string;
  medicines: { name: string; quantity: number; dosage: string }[];
  timestamp: string;
  recipientEmail: string;
  sessionId?: string;
  qrBase64?: string;
}

export const sendEmail = async (payload: any): Promise<{ success: boolean; error?: string }> => {
  if (!GAS_URL || GAS_URL === 'your_gas_url_here') {
    console.error('GAS URL not configured. Please set VITE_GAS_URL in .env');
    return { success: false, error: 'Email service not configured.' };
  }

  try {
    await fetch(GAS_URL, {
      method: 'POST',
      mode: 'no-cors', // Required for GAS Web App redirects
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    return { success: true };
  } catch (err) {
    console.error('Email sending failed:', err);
    return { success: false, error: 'Failed to send email.' };
  }
};

export const sendDiagnosisReport = async (data: ReportData): Promise<void> => {
  const result = await sendEmail(data);
  if (!result.success) {
    console.warn("Email dispatch failed (caught):", result.error);
  }
};

export const sendPrescriptionEmail = async (patient: any, session: any, prescriptions: any[]) => {
  // Generate QR base64 for the patient's QR code
  const qrBase64 = await QRCode.toDataURL(patient.qr_code || `HEALER_PATIENT_${patient.id}`);

  const reportData: ReportData = {
    patientName: patient.name,
    patientAge: patient.age,
    patientGender: patient.gender,
    symptoms: session.symptoms ? (typeof session.symptoms === 'string' ? session.symptoms.split(',') : session.symptoms) : [],
    diagnosis: session.diagnosed_disease,
    medicines: prescriptions.map(p => ({
      name: p.medicine_name,
      quantity: 1, // Quantity is fixed to 1 for dispensary
      dosage: p.dosage
    })),
    timestamp: session.timestamp,
    recipientEmail: patient.email,
    sessionId: session.id?.toString(),
    qrBase64: qrBase64
  };

  return sendDiagnosisReport(reportData);
};

export const sendQRCodeEmail = async (patient: any, qrCodeBase64?: string) => {
  // If base64 not provided, generate it
  const base64 = qrCodeBase64 || await QRCode.toDataURL(patient.qr_code || `HEALER_PATIENT_${patient.id}`);

  const reportData: ReportData = {
    patientName: patient.name,
    patientAge: patient.age,
    patientGender: patient.gender,
    symptoms: ["QR Code Retrieval"],
    diagnosis: "This report contains your personal HEALER ID QR code for future logins and record retrieval.",
    medicines: [],
    timestamp: new Date().toISOString(),
    recipientEmail: patient.email,
    sessionId: patient.id?.toString(),
    qrBase64: base64
  };

  return sendDiagnosisReport(reportData);
};

export const sendAutoReferralEmail = async (patient: any, session: any, prescriptions: any[]) => {
  const settings = await getAllSettings();
  const doctorEmail = settings.doctor_email;

  if (!doctorEmail) {
    console.warn("No doctor email configured for auto-referral");
    return;
  }

  const qrBase64 = await QRCode.toDataURL(patient.qr_code || `HEALER_PATIENT_${patient.id}`);

  const reportData: ReportData = {
    patientName: patient.name,
    patientAge: patient.age,
    patientGender: patient.gender,
    symptoms: session.symptoms ? (typeof session.symptoms === 'string' ? session.symptoms.split(',') : session.symptoms) : ["Urgent Referral"],
    diagnosis: "URGENT AUTO-REFERRAL: " + session.diagnosed_disease,
    medicines: prescriptions.map(p => ({
      name: p.medicine_name,
      quantity: 1,
      dosage: p.dosage
    })),
    timestamp: session.timestamp,
    recipientEmail: doctorEmail,
    sessionId: session.id?.toString(),
    qrBase64: qrBase64
  };

  return sendDiagnosisReport(reportData);
};
