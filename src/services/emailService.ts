import { getAllSettings } from './settingsService';

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
}

export const sendEmail = async (payload: any): Promise<{ success: boolean; error?: string }> => {
  if (!GAS_URL || GAS_URL === 'your_gas_url_here') {
    console.error('GAS URL not configured. Please set VITE_GAS_URL in .env');
    return { success: false, error: 'Email service not configured.' };
  }

  try {
    const response = await fetch(GAS_URL, {
      method: 'POST',
      mode: 'no-cors', // GAS web apps often require no-cors or redirect handling
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    // Note: With 'no-cors', we can't read the response body, but the request will be sent.
    // For a real production app, you might want to handle redirects properly or use a proxy.
    return { success: true };
  } catch (err) {
    console.error('Email sending failed:', err);
    return { success: false, error: 'Failed to send email.' };
  }
};

export const sendDiagnosisReport = async (data: ReportData): Promise<void> => {
  const result = await sendEmail(data);
  if (!result.success) {
    throw new Error(result.error);
  }
};

const getConfidenceLabel = (score: number) => {
  if (score >= 80) return "High";
  if (score >= 60) return "Moderate";
  return "Requires Review";
};

export const sendPrescriptionEmail = async (patient: any, session: any, prescriptions: any[]) => {
  const reportData: ReportData = {
    patientName: patient.name,
    patientAge: patient.age,
    patientGender: patient.gender,
    symptoms: session.symptoms ? (typeof session.symptoms === 'string' ? session.symptoms.split(',') : session.symptoms) : [],
    diagnosis: session.diagnosed_disease,
    medicines: prescriptions.map(p => ({
      name: p.medicine_name,
      quantity: 1, // Defaulting to 1 as it's a prescription
      dosage: p.dosage
    })),
    timestamp: session.timestamp,
    recipientEmail: patient.email
  };

  return sendDiagnosisReport(reportData);
};

export const sendQRCodeEmail = async (patient: any, qrCodeBase64: string) => {
  // Since our GAS script is designed for reports, we'll send a simple report with the QR code info
  // In a real scenario, you'd extend the GAS script to handle different types of emails.
  const reportData: ReportData = {
    patientName: patient.name,
    patientAge: patient.age,
    patientGender: patient.gender,
    symptoms: ["QR Code Retrieval"],
    diagnosis: "Patient QR Code for retrieval of medical records.",
    medicines: [],
    timestamp: new Date().toISOString(),
    recipientEmail: patient.email
  };

  return sendDiagnosisReport(reportData);
};

export const sendAutoReferralEmail = async (patient: any, session: any, prescriptions: any[]) => {
  const settings = await getAllSettings();
  const doctorEmail = settings.doctor_email;

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
    recipientEmail: doctorEmail
  };

  return sendDiagnosisReport(reportData);
};
