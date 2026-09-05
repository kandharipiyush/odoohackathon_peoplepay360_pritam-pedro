const PDFDocument = require('pdfkit');

/**
 * Service to dynamically generate branded, official PDF payslip documents
 */
class PDFService {
  /**
   * Formats numbers to USD currency format (e.g. $50,000.00)
   */
  formatCurrency(amount) {
    const val = parseFloat(amount) || 0;
    return '$' + val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  /**
   * Generates official payslip PDF and pipes it to an output stream (e.g. Express res)
   * @param {Object} payslipData - Payslip object with joined employee, contract, and payrun details
   * @param {NodeJS.WritableStream} outputStream - Stream to pipe PDF data into
   */
  generatePayslipPDF(payslipData, outputStream) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 40,
          info: {
            Title: `Payslip - ${payslipData.employee_name} - ${payslipData.period_start}`,
            Author: 'PeoplePay360 Enterprise HR',
            Subject: 'Official Confidential Payslip',
          },
        });

        // Error and finish event listeners on output stream / doc
        doc.on('error', (err) => reject(err));
        outputStream.on('finish', () => resolve());
        outputStream.on('error', (err) => reject(err));

        doc.pipe(outputStream);

        const primaryColor = '#1E3A8A'; // Deep Navy
        const secondaryColor = '#2563EB'; // Royal Blue
        const darkTextColor = '#1F2937'; // Slate 800
        const lightGray = '#F3F4F6'; // Gray 100
        const borderColor = '#E5E7EB'; // Gray 200
        const accentGreen = '#059669'; // Emerald 600

        const auditJson =
          typeof payslipData.audit_reasons_json === 'string'
            ? JSON.parse(payslipData.audit_reasons_json || '{}')
            : payslipData.audit_reasons_json || {};

        const breakdown = auditJson.salary_breakdown || [];
        const metrics = auditJson.metrics || {};
        const auditReasons = auditJson.audit_reasons || [];

        // ==========================================
        // 1. Header Banner
        // ==========================================
        doc.rect(40, 40, 515, 65).fill(primaryColor);

        doc.fillColor('#FFFFFF')
          .fontSize(20)
          .font('Helvetica-Bold')
          .text('PEOPLEPAY360', 55, 52);

        doc.fontSize(9)
          .font('Helvetica')
          .text('ENTERPRISE PAYROLL & HR OPERATIONS PLATFORM', 55, 75);

        doc.fontSize(14)
          .font('Helvetica-Bold')
          .text('OFFICIAL PAYSLIP', 380, 52, { align: 'right', width: 160 });

        doc.fontSize(8)
          .font('Helvetica-Oblique')
          .text('CONFIDENTIAL / SYSTEM GENERATED', 380, 72, { align: 'right', width: 160 });

        doc.fillColor(darkTextColor);

        // ==========================================
        // 2. Pay Period & Metadata Bar
        // ==========================================
        const metaY = 115;
        doc.rect(40, metaY, 515, 28).fill(lightGray).stroke(borderColor);

        doc.fillColor(darkTextColor)
          .fontSize(8.5)
          .font('Helvetica-Bold')
          .text('Payslip Ref:', 50, metaY + 8)
          .font('Helvetica')
          .text(`PSL-${payslipData.id.toString().padStart(6, '0')}`, 115, metaY + 8);

        doc.font('Helvetica-Bold')
          .text('Pay Period:', 210, metaY + 8)
          .font('Helvetica')
          .text(`${payslipData.period_start} to ${payslipData.period_end}`, 265, metaY + 8);

        doc.font('Helvetica-Bold')
          .text('Status:', 430, metaY + 8)
          .font('Helvetica-Bold')
          .fillColor(payslipData.status === 'Paid' ? accentGreen : secondaryColor)
          .text(payslipData.status.toUpperCase(), 470, metaY + 8);

        doc.fillColor(darkTextColor);

        // ==========================================
        // 3. Employee & Contract Summary Box
        // ==========================================
        const empBoxY = 152;
        doc.rect(40, empBoxY, 515, 82).stroke(borderColor);

        // Left Column (Employee Details)
        doc.fontSize(8.5).font('Helvetica-Bold').text('Employee ID:', 50, empBoxY + 10);
        doc.font('Helvetica').text(`EMP-${payslipData.employee_id.toString().padStart(4, '0')}`, 140, empBoxY + 10);

        doc.font('Helvetica-Bold').text('Employee Name:', 50, empBoxY + 24);
        doc.font('Helvetica').text(payslipData.employee_name || 'N/A', 140, empBoxY + 24);

        doc.font('Helvetica-Bold').text('Department:', 50, empBoxY + 38);
        doc.font('Helvetica').text(payslipData.department || 'N/A', 140, empBoxY + 38);

        doc.font('Helvetica-Bold').text('Job Position:', 50, empBoxY + 52);
        doc.font('Helvetica').text(payslipData.job_position || 'N/A', 140, empBoxY + 52);

        doc.font('Helvetica-Bold').text('Email:', 50, empBoxY + 66);
        doc.font('Helvetica').text(payslipData.email || 'N/A', 140, empBoxY + 66);

        // Right Column (Payrun & Work Metrics)
        const rColX = 300;
        doc.font('Helvetica-Bold').text('Payrun Batch:', rColX, empBoxY + 10);
        doc.font('Helvetica').text(payslipData.payrun_name || 'Regular Payrun', rColX + 100, empBoxY + 10);

        doc.font('Helvetica-Bold').text('Contract Base Wage:', rColX, empBoxY + 24);
        doc.font('Helvetica').text(this.formatCurrency(payslipData.contract_wage), rColX + 100, empBoxY + 24);

        doc.font('Helvetica-Bold').text('Standard Work Days:', rColX, empBoxY + 38);
        doc.font('Helvetica').text(`${metrics.standard_working_days || 0} days`, rColX + 100, empBoxY + 38);

        doc.font('Helvetica-Bold').text('Payable Days Worked:', rColX, empBoxY + 52);
        doc.font('Helvetica').text(`${payslipData.worked_days || metrics.worked_days || 0} days`, rColX + 100, empBoxY + 52);

        doc.font('Helvetica-Bold').text('Paid / Unpaid Leaves:', rColX, empBoxY + 66);
        doc.font('Helvetica').text(`${metrics.paid_leave_days || 0} / ${metrics.unpaid_leave_days || 0} days`, rColX + 100, empBoxY + 66);

        // ==========================================
        // 4. Itemized Earnings & Deductions Table
        // ==========================================
        const tableY = 245;
        const colWidth = 252;

        // Table Header Left: Earnings
        doc.rect(40, tableY, colWidth, 22).fill(primaryColor);
        doc.fillColor('#FFFFFF')
          .fontSize(9)
          .font('Helvetica-Bold')
          .text('EARNINGS & ALLOWANCES', 50, tableY + 6)
          .text('AMOUNT', 40 + colWidth - 75, tableY + 6, { width: 65, align: 'right' });

        // Table Header Right: Deductions
        doc.rect(40 + colWidth + 11, tableY, colWidth, 22).fill('#991B1B'); // Crimson/Burgundy
        doc.fillColor('#FFFFFF')
          .fontSize(9)
          .font('Helvetica-Bold')
          .text('DEDUCTIONS & WITHHOLDINGS', 40 + colWidth + 21, tableY + 6)
          .text('AMOUNT', 555 - 75, tableY + 6, { width: 65, align: 'right' });

        doc.fillColor(darkTextColor);

        // Partition salary rules into Earnings and Deductions
        const earnings = breakdown.filter(
          (b) => b.category === 'Basic' || b.category === 'Allowance'
        );
        const deductions = breakdown.filter((b) => b.category === 'Deduction');

        const maxRows = Math.max(earnings.length, deductions.length, 1);
        let currentRowY = tableY + 22;
        const rowHeight = 20;

        for (let i = 0; i < maxRows; i++) {
          const bgFill = i % 2 === 0 ? '#FAFAFA' : '#FFFFFF';

          // Draw row background
          doc.rect(40, currentRowY, colWidth, rowHeight).fill(bgFill).stroke(borderColor);
          doc.rect(40 + colWidth + 11, currentRowY, colWidth, rowHeight).fill(bgFill).stroke(borderColor);

          doc.fillColor(darkTextColor).fontSize(8).font('Helvetica');

          // Print Earning
          if (i < earnings.length) {
            const e = earnings[i];
            doc.text(`${e.name} (${e.code})`, 48, currentRowY + 6, { width: 140, ellipsis: true });
            doc.text(this.formatCurrency(e.amount), 40 + colWidth - 85, currentRowY + 6, {
              width: 75,
              align: 'right',
            });
          }

          // Print Deduction
          if (i < deductions.length) {
            const d = deductions[i];
            doc.text(`${d.name} (${d.code})`, 40 + colWidth + 19, currentRowY + 6, { width: 140, ellipsis: true });
            doc.text(this.formatCurrency(d.amount), 555 - 85, currentRowY + 6, {
              width: 75,
              align: 'right',
            });
          }

          currentRowY += rowHeight;
        }

        // Subtotals Row
        const subtotalY = currentRowY;
        doc.rect(40, subtotalY, colWidth, 22).fill(lightGray).stroke(borderColor);
        doc.rect(40 + colWidth + 11, subtotalY, colWidth, 22).fill(lightGray).stroke(borderColor);

        doc.fillColor(darkTextColor).fontSize(8.5).font('Helvetica-Bold');
        doc.text('GROSS EARNINGS:', 48, subtotalY + 6);
        doc.text(this.formatCurrency(payslipData.gross_amount), 40 + colWidth - 85, subtotalY + 6, {
          width: 75,
          align: 'right',
        });

        const totalDeductions = Math.max(0, parseFloat(payslipData.gross_amount) - parseFloat(payslipData.net_amount));
        doc.text('TOTAL DEDUCTIONS:', 40 + colWidth + 19, subtotalY + 6);
        doc.text(this.formatCurrency(totalDeductions), 555 - 85, subtotalY + 6, {
          width: 75,
          align: 'right',
        });

        // ==========================================
        // 5. Net Payable Salary Banner
        // ==========================================
        const netY = subtotalY + 34;
        doc.rect(40, netY, 515, 45).fill('#ECFDF5').stroke('#10B981'); // Emerald Green Accent

        doc.fillColor('#065F46')
          .fontSize(12)
          .font('Helvetica-Bold')
          .text('NET TAKE-HOME PAYABLE:', 55, netY + 16);

        doc.fontSize(16)
          .font('Helvetica-Bold')
          .text(this.formatCurrency(payslipData.net_amount), 280, netY + 14, {
            align: 'right',
            width: 260,
          });

        doc.fillColor(darkTextColor);

        // ==========================================
        // 6. AI Anomaly & Auditor Assessment Box
        // ==========================================
        const auditBoxY = netY + 56;
        doc.rect(40, auditBoxY, 515, 60).stroke(borderColor);

        const riskScore = parseFloat(payslipData.risk_score || 0);
        let riskBadgeColor = '#059669'; // Low risk: green
        let riskLabel = 'LOW (CLEAN)';
        if (riskScore > 50) {
          riskBadgeColor = '#DC2626'; // High risk: red
          riskLabel = 'HIGH RISK';
        } else if (riskScore > 20) {
          riskBadgeColor = '#D97706'; // Medium risk: amber
          riskLabel = 'ELEVATED AUDIT';
        }

        doc.fontSize(8.5).font('Helvetica-Bold').text('AI AUDIT & ANOMALY ASSESSMENT:', 50, auditBoxY + 8);
        doc.fillColor(riskBadgeColor).text(`RISK SCORE: ${riskScore.toFixed(1)} / 100 [${riskLabel}]`, 350, auditBoxY + 8, {
          align: 'right',
          width: 195,
        });

        doc.fillColor(darkTextColor).font('Helvetica').fontSize(7.5);

        if (auditReasons.length > 0) {
          let reasonText = auditReasons.map((r) => `• ${r}`).join('  |  ');
          if (reasonText.length > 210) reasonText = reasonText.slice(0, 207) + '...';
          doc.text(reasonText, 50, auditBoxY + 24, { width: 495, lineGap: 3 });
        } else {
          doc.text('• No financial discrepancies or attendance anomalies detected by the PeoplePay360 Intelligence Engine.', 50, auditBoxY + 26);
        }

        // ==========================================
        // 7. Footer
        // ==========================================
        const footerY = 750;
        doc.moveTo(40, footerY).lineTo(555, footerY).stroke(borderColor);

        doc.fillColor('#6B7280')
          .fontSize(7)
          .font('Helvetica')
          .text(
            'This is a secure system-generated payroll statement produced by PeoplePay360. No physical signature is required.',
            40,
            footerY + 8,
            { align: 'center', width: 515 }
          );

        doc.text(
          `Generated: ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC | Document Ref: PSL-${payslipData.id}`,
          40,
          footerY + 20,
          { align: 'center', width: 515 }
        );

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}

module.exports = new PDFService();
