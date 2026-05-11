import React from 'react';
import QRCode from 'react-qr-code';

export const generateQRString = (patientId: string | number) => {
  return `HEALER_PATIENT_${patientId}`;
};

export const QRCodeDisplay = ({ qrString, clinicName }: { qrString: string; clinicName?: string }) => {
  return (
    <div className="flex flex-col items-center gap-4 p-4 bg-transparent">
      <div className="p-0 bg-transparent">
        <QRCode 
          value={qrString} 
          size={256}
          fgColor="#00BCD4" // mid blue (brand-secondary)
          bgColor="transparent"
        />
      </div>
      {clinicName && (
        <span className="text-2xl font-black text-blue-900 uppercase tracking-widest text-center">
          {clinicName}
        </span>
      )}
    </div>
  );
};
