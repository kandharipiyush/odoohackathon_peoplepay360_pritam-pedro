import React, { useState, useEffect } from 'react';
import { intelligenceApi } from '../../services/intelligenceApi';
import Card from '../common/Card';
import Button from '../common/Button';
import { ShieldAlert, AlertTriangle, ChevronRight } from 'lucide-react';
import Loader from '../common/Loader';

const ExplainableAuditor = ({ payslipId }) => {
  const [auditData, setAuditData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAudit = async () => {
      try {
        const res = await intelligenceApi.getPayslipAudit(payslipId);
        setAuditData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAudit();
  }, [payslipId]);

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}><Loader /></div>;
  if (!auditData) return null;

  const isFlagged = auditData.riskLevel === 'HIGH' || auditData.riskLevel === 'CRITICAL';

  if (!isFlagged) {
    return (
      <Card style={{ borderLeft: '4px solid var(--color-status-success)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-status-success)' }}>
          <ShieldAlert size={20} />
          <span style={{ fontWeight: 600 }}>Payroll Audit Passed</span>
        </div>
        <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '8px' }}>
          No anomalies detected for this payslip. Risk score: {auditData.riskScore}/100.
        </p>
      </Card>
    );
  }

  return (
    <Card style={{ borderLeft: '4px solid var(--color-status-error)', backgroundColor: '#FEF2F2' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-3)' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-status-error)' }}>
            <AlertTriangle size={20} />
            PAYROLL AUDITOR
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>Automated compliance & anomaly check</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-status-error)', lineHeight: 1 }}>{auditData.riskScore} <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>/ 100</span></div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-status-error)' }}>{auditData.riskLevel} RISK</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-3)' }}>
        <div>
          <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text-primary)' }}>Why was this flagged?</h4>
          <ul style={{ paddingLeft: '20px', margin: 0, color: 'var(--color-text-secondary)', fontSize: '14px' }}>
            {auditData.triggers.map((trigger, idx) => (
              <li key={idx} style={{ marginBottom: '4px' }}>{trigger}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text-primary)' }}>Affected Components</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {auditData.affectedComponents.map((comp, idx) => (
              <span key={idx} style={{ fontSize: '12px', padding: '4px 12px', backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '12px', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                {comp}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: 'var(--color-bg-card)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid #FCA5A5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-status-error)', marginBottom: '4px' }}>RECOMMENDED ACTION</div>
          <div style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>{auditData.recommendedAction}</div>
        </div>
        <Button variant="danger" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          Review Payroll <ChevronRight size={16} />
        </Button>
      </div>
    </Card>
  );
};

export default ExplainableAuditor;
