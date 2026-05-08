/**
 * HEALER Automated Diagnosis Report — GAS Backend
 */

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    // 1. Create a temporary Google Doc to generate PDF
    const doc = DocumentApp.create('HEALER_Report_' + data.patientName + '_' + Date.now());
    const body = doc.getBody();
    
    // Header
    body.appendParagraph('HEALER — Automated Diagnosis Report').setHeading(DocumentApp.ParagraphHeading.HEADING1).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    body.appendHorizontalRule();
    
    // Patient Info Section
    body.appendParagraph('Patient Information').setHeading(DocumentApp.ParagraphHeading.HEADING2);
    body.appendParagraph('Name: ' + data.patientName);
    body.appendParagraph('Age: ' + data.patientAge);
    body.appendParagraph('Gender: ' + data.patientGender);
    body.appendParagraph('Timestamp: ' + new Date(data.timestamp).toLocaleString());
    body.appendHorizontalRule();
    
    // Symptoms Section
    body.appendParagraph('Symptoms').setHeading(DocumentApp.ParagraphHeading.HEADING2);
    if (data.symptoms && data.symptoms.length > 0) {
      data.symptoms.forEach(s => body.appendListItem(s));
    } else {
      body.appendParagraph('No symptoms recorded.');
    }
    body.appendHorizontalRule();
    
    // Diagnosis Section
    body.appendParagraph('Diagnosis').setHeading(DocumentApp.ParagraphHeading.HEADING2);
    body.appendParagraph(data.diagnosis);
    body.appendHorizontalRule();
    
    // Medicines Section
    body.appendParagraph('Medicines Dispensed').setHeading(DocumentApp.ParagraphHeading.HEADING2);
    if (data.medicines && data.medicines.length > 0) {
      const table = body.appendTable();
      const headerRow = table.appendTableRow();
      headerRow.appendTableCell('Medicine').setBackgroundColor('#f3f3f3');
      headerRow.appendTableCell('Quantity').setBackgroundColor('#f3f3f3');
      headerRow.appendTableCell('Dosage').setBackgroundColor('#f3f3f3');
      
      data.medicines.forEach(m => {
        const row = table.appendTableRow();
        row.appendTableCell(m.name);
        row.appendTableCell(m.quantity.toString());
        row.appendTableCell(m.dosage);
      });
    } else {
      body.appendParagraph('No medicines dispensed.');
    }
    
    doc.saveAndClose();
    
    // 2. Convert Doc to PDF
    const pdf = DriveApp.getFileById(doc.getId()).getAs(MimeType.PDF);
    
    // 3. Send Email
    GmailApp.sendEmail(data.recipientEmail, 'HEALER Diagnosis Report - ' + data.patientName, 'Please find the attached diagnosis report.', {
      attachments: [pdf],
      name: 'HEALER System'
    });
    
    // 4. Cleanup temporary doc
    DriveApp.getFileById(doc.getId()).setTrashed(true);
    
    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
