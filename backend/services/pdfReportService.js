import PDFDocument from 'pdfkit';

/**
 * Generate a PDF health report in memory buffer
 * @param {Object} user - User document
 * @param {Array} medicines - Medicines array
 * @param {Array} logs - Adherence logs array
 * @returns {Promise<Buffer>} - Resolves with PDF Buffer
 */
export const generateAdherenceReportPDF = (user, medicines, logs) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      // Title Section
      doc.fontSize(24).fillColor('#0F2F57').text('Trulicare Adherence Report', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#7a8a9b').text(`Report Compiled on: ${new Date().toLocaleDateString()}`, { align: 'center' });
      doc.moveDown(1.5);

      // Metadata Info Box
      doc.fontSize(12).fillColor('#0F2F57').text('Patient Information', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#334155');
      doc.text(`- Name: ${user ? user.name : 'Patient'}`);
      doc.text(`- Email: ${user ? user.email : 'N/A'}`);
      doc.text(`- Verified Phone: ${(user && user.phoneNumber) || 'Not Configured'}`);
      doc.text(`- Preferred Timezone: ${(user && user.timezone) || 'UTC'}`);
      doc.moveDown(1.5);

      // Compliance Overview
      const totalDoses = (logs && logs.length) || 0;
      const takenDoses = (logs || []).filter(l => l.status && l.status.toLowerCase() === 'taken').length;
      const skippedDoses = (logs || []).filter(l => l.status && l.status.toLowerCase() === 'skipped').length;
      const missedDoses = (logs || []).filter(l => l.status && l.status.toLowerCase() === 'missed').length;
      const complianceRate = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 100;

      doc.fontSize(12).fillColor('#0F2F57').text('Adherence Performance Metrics (Past 30 Days)', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#334155');
      doc.text(`- Overall Compliance Rate: ${complianceRate}%`);
      doc.text(`- Total Logged Doses: ${totalDoses}`);
      doc.text(`  * Taken: ${takenDoses}`);
      doc.text(`  * Skipped: ${skippedDoses}`);
      doc.text(`  * Missed: ${missedDoses}`);
      doc.moveDown(1.5);

      // Medications
      doc.fontSize(12).fillColor('#0F2F57').text('Prescriptions Active in System', { underline: true });
      doc.moveDown(0.5);
      
      if (!medicines || medicines.length === 0) {
        doc.fontSize(10).fillColor('#7a8a9b').text('No active prescriptions registered in this account.');
      } else {
        medicines.forEach((med, index) => {
          doc.fontSize(10).fillColor('#334155').text(`${index + 1}. ${med.name || 'Medication'} (${med.dosageStrength || 'Strength Unspecified'})`);
          doc.fontSize(9).fillColor('#64748b');
          doc.text(`   Current Quantity: ${med.currentQuantity || 0} / ${med.totalQuantity || 0} ${med.unit || 'Units'} (Refills Left: ${med.refillsRemaining || 0})`);
          doc.text(`   Scheduled Dosage: ${med.dosesPerDay || 1} dose(s) daily at ${med.reminderTime || 'N/A'}`);
          doc.moveDown(0.5);
        });
      }

      doc.moveDown(2);
      doc.fontSize(8).fillColor('#94a3b8').text('This is an automated performance report from Trulicare Portal. For clinical analysis, please share this file with your prescribing doctor.', { align: 'center' });

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
};
