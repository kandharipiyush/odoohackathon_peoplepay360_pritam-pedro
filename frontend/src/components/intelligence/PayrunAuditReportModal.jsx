import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Loader from '../common/Loader';
import { intelligenceApi } from '../../services/intelligenceApi';
import { ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2, FileText, User, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PayrunAuditReportModal = ({ isOpen, onClose, payrunId, payrunName }) => {
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && payrunId) {
      setLoading(true);
      intelligenceApi.getPayrunAuditReport(payrunId)
        .then((res) => {
          setReport(res?.data?.data || res?.data || null);
        })
        .catch((err) => {
          console.error('Error loading audit report:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, payrunId]);

  if (!isOpen) return null;

  const summary = report?.executive_summary || {};
  const flagged = Array.isArray(report?.high_risk_flagged_payslips) ? report.high_risk_flagged_payslips : [];
  const avgRisk = summary.average_risk_score || 0;
  const isHighRisk = (summary.flagged_payslips_count || 0) > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Explainable Audit Report: ${payrunName || `PR-${payrunId}`}`}
      maxWidth="750px"
    >
      {loading ? (
        <div style={{ padding: '32px', textAlign: 'center' }}>
          <Loader />
          <p style={{ marginTop: '12px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            Running algorithmic compliance scan across all payrun records...
          </p>
        </div>
      ) : !report ? (
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          Audit report unavailable for this payrun.
        </div>
      ) : (
        <div>
          {/* Executive Status Header */}
          <div style={{
            padding: '16px',
            borderRadius: '8px',
            backgroundColor: isHighRisk ? '#FEF2F2' : '#F0FDF4',
            border: `1px solid ${isHighRisk ? '#FCA5A5' : '#86EFAC'}`,
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}>
            <div style={{
              padding: '10px',
              borderRadius: '50%',
              backgroundColor: isHighRisk ? '#FEE2E2' : '#DCFCE7',
              color: isHighRisk ? '#DC2626' : '#16A34A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {isHighRisk ? <AlertTriangle size={24} /> : <ShieldCheck size={24} />}
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', color: isHighRisk ? '#DC2626' : '#16A34A', textTransform: 'uppercase' }}>
                DISBURSEMENT AUDIT VERDICT
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: isHighRisk ? '#991B1B' : '#14532D', marginTop: '2px' }}>
                {summary.disbursement_readiness || 'AUDIT COMPLETE'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                Period: {report.period} • Payrun Batch #{report.payrun_id}
              </div>
            </div>
          </div>

          {/* KPI Metrics Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px' }}>
            <div style={{ padding: '12px', backgroundColor: 'var(--color-bg-main)', borderRadius: '8px', border: '1px solid var(--color-border)', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Total Payslips</div>
              <div style={{ fontSize: '18px', fontWeight: 700 }}>{summary.total_employees || 0}</div>
            </div>
            <div style={{ padding: '12px', backgroundColor: 'var(--color-bg-main)', borderRadius: '8px', border: '1px solid var(--color-border)', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Clean & Verified</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#16A34A' }}>{summary.clean_payslips_count || 0}</div>
            </div>
            <div style={{ padding: '12px', backgroundColor: 'var(--color-bg-main)', borderRadius: '8px', border: '1px solid var(--color-border)', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Flagged Discrepancies</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: isHighRisk ? '#DC2626' : 'var(--color-text-primary)' }}>{summary.flagged_payslips_count || 0}</div>
            </div>
            <div style={{ padding: '12px', backgroundColor: 'var(--color-bg-main)', borderRadius: '8px', border: '1px solid var(--color-border)', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Batch Risk Score</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: avgRisk > 30 ? '#D97706' : '#16A34A' }}>{avgRisk.toFixed(1)}/100</div>
            </div>
          </div>

          {/* Financial Totals */}
          <div style={{ padding: '12px 16px', backgroundColor: 'var(--color-bg-main)', borderRadius: '8px', border: '1px solid var(--color-border)', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span><strong>Total Gross:</strong> ${(summary.total_gross_disbursement || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            <span><strong>Statutory Deductions:</strong> ${(summary.total_statutory_withholdings || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            <span><strong>Net Payable:</strong> <strong style={{ color: '#16A34A' }}>${(summary.total_net_disbursement || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></span>
          </div>

          {/* Flagged Items Section */}
          {flagged.length > 0 ? (
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '10px', color: 'var(--color-text-primary)' }}>
                Flagged Payslips Requiring Sign-Off ({flagged.length}):
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '250px', overflowY: 'auto' }}>
                {flagged.map((item, idx) => (
                  <div key={idx} style={{
                    padding: '12px',
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FCA5A5',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                        {item.employee_name} <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--color-text-secondary)' }}>({item.department})</span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#991B1B', marginTop: '2px' }}>
                        {item.reasons && item.reasons.length > 0 ? item.reasons.join(', ') : 'Unusual salary variance detected'}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                        Gross: ${(item.gross || 0).toLocaleString()} • Net: ${(item.net || 0).toLocaleString()}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#DC2626', backgroundColor: '#FEE2E2', padding: '4px 8px', borderRadius: '6px' }}>
                        Risk: {item.risk_score}
                      </span>
                      <Button
                        size="small"
                        variant="secondary"
                        onClick={() => {
                          onClose();
                          navigate(`/payroll/payslips/${item.payslip_id}`);
                        }}
                      >
                        Inspect
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{
              padding: '16px',
              textAlign: 'center',
              backgroundColor: '#F0FDF4',
              borderRadius: '8px',
              color: '#16A34A',
              fontSize: '13px',
              fontWeight: 600
            }}>
              ✓ Zero discrepancies detected across this entire payrun batch. All calculations 100% verified.
            </div>
          )}

          {/* Footer Actions */}
          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <Button variant="secondary" onClick={onClose}>
              Close Report
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default PayrunAuditReportModal;
