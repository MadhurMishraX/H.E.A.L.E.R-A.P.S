/**
 * HEALER Automated Diagnosis Report — GAS Backend (Professional Version)
 */

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const dateStr = new Date(data.timestamp).toLocaleDateString('en-US', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });
    const timeStr = new Date(data.timestamp).toLocaleTimeString('en-US', { 
      hour: '2-digit', minute: '2-digit' 
    });

    // 1. Create a professional Google Doc for PDF generation
    const doc = DocumentApp.create('HEALER_Report_' + data.patientName + '_' + data.timestamp);
    const body = doc.getBody();
    
    // Set margins
    body.setMarginTop(50);
    body.setMarginBottom(50);
    body.setMarginLeft(50);
    body.setMarginRight(50);

    // Header
    const header = body.appendParagraph('H.E.A.L.E.R');
    header.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    header.setFontFamily('Arial');
    header.setFontSize(28);
    header.setBold(true);
    header.setForegroundColor('#1E88E5');

    const subHeader = body.appendParagraph('Confidential Medical Report');
    subHeader.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    subHeader.setFontSize(10);
    subHeader.setForegroundColor('#757575');
    subHeader.setItalic(true);

    body.appendHorizontalRule();
    body.appendParagraph('');

    // Patient Information Table
    const infoTable = body.appendTable([
      ['Name:', data.patientName, 'Age / Gender:', data.patientAge + ' / ' + data.patientGender],
      ['Session ID:', data.sessionId || 'N/A', 'Date & Time:', dateStr + ' ' + timeStr]
    ]);
    infoTable.setBorderWidth(0);
    for (let i = 0; i < infoTable.getNumRows(); i++) {
      const row = infoTable.getRow(i);
      for (let j = 0; j < row.getNumCells(); j++) {
        const cell = row.getCell(j);
        cell.getChild(0).asParagraph().setFontSize(10);
        if (j % 2 === 0) cell.getChild(0).asParagraph().setBold(true).setForegroundColor('#546E7A');
      }
    }

    body.appendParagraph('');

    // Symptoms
    body.appendParagraph('Symptoms Reported').setBold(true).setFontSize(14).setForegroundColor('#1E88E5');
    if (data.symptoms && data.symptoms.length > 0) {
      data.symptoms.forEach(s => {
        body.appendListItem(s).setGlyphType(DocumentApp.GlyphType.BULLET);
      });
    } else {
      body.appendParagraph('None reported.');
    }

    body.appendParagraph('');

    // Diagnosis Box
    body.appendParagraph('Diagnosis').setBold(true).setFontSize(14).setForegroundColor('#1E88E5');
    const diagBox = body.appendTable([[data.diagnosis]]);
    diagBox.setBorderWidth(1);
    diagBox.setBorderColor('#BDBDBD');
    diagBox.setBackgroundColor('#F5F5F5');
    const diagCell = diagBox.getRow(0).getCell(0);
    diagCell.setPaddingTop(10);
    diagCell.setPaddingBottom(10);
    const diagPara = diagCell.getChild(0).asParagraph();
    diagPara.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    diagPara.setBold(true);
    diagPara.setFontSize(16);
    diagPara.setForegroundColor('#D32F2F');

    body.appendParagraph('');

    // Medicines Table
    body.appendParagraph('Medicines Dispensed').setBold(true).setFontSize(14).setForegroundColor('#1E88E5');
    const medTableData = [['Medicine Name', 'Dosage', 'Quantity']];
    if (data.medicines && data.medicines.length > 0) {
      data.medicines.forEach(m => {
        medTableData.push([m.name, m.dosage, m.quantity.toString()]);
      });
    } else {
      medTableData.push(['No medicines dispensed', '-', '-']);
    }
    const medTable = body.appendTable(medTableData);
    medTable.setBorderWidth(1);
    medTable.setBorderColor('#EEEEEE');
    for (let i = 0; i < medTable.getNumRows(); i++) {
      const row = medTable.getRow(i);
      row.setMinimumHeight(25);
      for (let j = 0; j < row.getNumCells(); j++) {
        const cell = row.getCell(j);
        const para = cell.getChild(0).asParagraph();
        para.setFontSize(10);
        if (i === 0) {
          cell.setBackgroundColor('#E1F5FE');
          para.setBold(true).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
        }
      }
    }

    body.appendParagraph('');

    // Doctor's Note
    const noteTitle = body.appendParagraph("Doctor's Note");
    noteTitle.setBold(true).setFontSize(12).setForegroundColor('#455A64');
    const noteContent = body.appendParagraph("Please follow the dispensed medication schedule. If symptoms persist beyond 48 hours, seek immediate medical attention.");
    noteContent.setFontSize(10).setItalic(true).setForegroundColor('#757575');

    body.appendParagraph('');

    // QR Code Section
    if (data.qrBase64) {
      body.appendParagraph('Your Personal HEALER ID').setBold(true).setAlignment(DocumentApp.HorizontalAlignment.CENTER).setFontSize(12);
      const qrBlob = Utilities.newBlob(Utilities.base64Decode(data.qrBase64.split(',')[1]), 'image/png', 'QR_Code.png');
      const qrImg = body.appendImage(qrBlob);
      qrImg.setWidth(120);
      qrImg.setHeight(120);
      body.appendParagraph('Present this at your next visit').setAlignment(DocumentApp.HorizontalAlignment.CENTER).setFontSize(8).setForegroundColor('#9E9E9E');
    }

    // Footer on every page (simplified as body end)
    body.appendParagraph('');
    body.appendHorizontalRule();
    const footerText = body.appendParagraph('Generated by HEALER Automated System | ' + new Date().toISOString() + ' | Confidential');
    footerText.setAlignment(DocumentApp.HorizontalAlignment.CENTER).setFontSize(8).setForegroundColor('#BDBDBD');

    doc.saveAndClose();

    // 2. Prepare Email with HTML Body and Inline Image
    const pdf = doc.getAs(MimeType.PDF);
    pdf.setName('HEALER_Report_' + data.patientName + '_' + dateStr.replace(/ /g, '_') + '.pdf');

    const inlineImages = {};
    let qrHtml = '';
    if (data.qrBase64) {
      const qrBlob = Utilities.newBlob(Utilities.base64Decode(data.qrBase64.split(',')[1]), 'image/png', 'qr_code_inline');
      inlineImages['qr_code'] = qrBlob;
      qrHtml = '<div style="text-align: center; margin-top: 30px;">' +
               '<p style="font-weight: bold; font-size: 14px; color: #455A64;">Scan this QR code on your next visit to instantly retrieve your records.</p>' +
               '<img src="cid:qr_code" width="150" height="150" style="border: 4px solid #1E88E5; border-radius: 10px;" />' +
               '</div>';
    }

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
        <div style="background: #0D47A1; color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 32px; letter-spacing: 2px;">H.E.A.L.E.R</h1>
          <p style="margin: 5px 0 0; font-size: 12px; font-style: italic; opacity: 0.8;">Automated Health Evaluation and Life-saving Emergency Response</p>
        </div>
        <div style="padding: 30px;">
          <p style="font-size: 16px;">Dear <strong>${data.patientName}</strong>,</p>
          <p style="font-size: 14px; line-height: 1.6;">Your diagnosis session on <strong>${dateStr}</strong> at <strong>${timeStr}</strong> has been completed. Please find your full report attached.</p>
          
          <div style="background: #F5F7FA; border: 1px solid #E4E7EB; border-radius: 12px; padding: 25px; margin: 30px 0;">
            <table style="width: 100%; font-size: 14px;">
              <tr><td style="padding: 8px 0; color: #64748B;"><strong>Diagnosis:</strong></td><td style="padding: 8px 0; font-weight: bold; color: #1E293B;">${data.diagnosis}</td></tr>
              <tr><td style="padding: 8px 0; color: #64748B;"><strong>Medicines Dispensed:</strong></td><td style="padding: 8px 0; font-weight: bold; color: #1E293B;">${data.medicines ? data.medicines.length : 0}</td></tr>
              <tr><td style="padding: 8px 0; color: #64748B;"><strong>Session ID:</strong></td><td style="padding: 8px 0; font-weight: bold; color: #1E293B; font-family: monospace;">${data.sessionId || 'N/A'}</td></tr>
            </table>
          </div>

          <p style="font-size: 11px; color: #94A3B8; text-align: center; font-style: italic; margin-top: 40px;">
            This report is generated by an automated system. Please consult a licensed medical professional before acting on any diagnosis.
          </p>

          ${qrHtml}

        </div>
        <div style="background: #F8FAFC; color: #64748B; padding: 20px; text-align: center; font-size: 12px; border-top: 1px solid #eee;">
          HEALER Automated Dispensary System | Do not reply to this email
        </div>
      </div>
    `;

    GmailApp.sendEmail(data.recipientEmail, 'HEALER — Your Diagnosis Report | ' + data.patientName + ' | ' + dateStr, '', {
      htmlBody: htmlBody,
      attachments: [pdf],
      inlineImages: inlineImages
    });

    // Cleanup: Trash the temp doc
    DriveApp.getFileById(doc.getId()).setTrashed(true);

    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: e.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
