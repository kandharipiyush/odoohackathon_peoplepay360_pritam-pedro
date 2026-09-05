import React, { useState, useEffect } from 'react';
import { intelligenceApi } from '../../services/intelligenceApi';
import Card from '../common/Card';
import Button from '../common/Button';
import { ShieldCheck, ShieldAlert, AlertTriangle, ChevronDown, ChevronUp, FileText, CheckCircle2, ArrowRight, Calculator, Clock } from 'lucide-react';
import Loader from '../common/Loader';

const ExplainableAuditor = ({ payslipId }) => {
  const [audit, setAudit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchAudit = async () => {
      try {
        const res = await intelligenceApi.getPayslipAudit(payslipId);
        const data = res?.data?.data || res?.data || null;
        setAudit(data);
      } catch (err) {
        console.error('Error fetching payslip audit:', err);
      } finally {
        setLoading(false);
      }
    };
    if (payslipId) {
      fetchAudit();
    }
  }, [payslipId]);

  if (loading) {
    return (
      <Card style={{ padding: '16px', textAlign: 'center' }}>
        <Loader />
      </Card>
    );
  }

  if (!audit) return null;

  const riskScore = parseFloat(audit.risk_score ?? audit.riskScore ?? 0);
  const isHighRisk = riskScore >= 70;
  const isMediumRisk = riskScore >= 30 && riskScore < 70;
  const isClean = riskScore < 30;

  const badgeBg = isHighRisk ? '#FEF2F2' : isMediumRisk ? '#FFFBEB' : '#F0FDF4';
  const badgeColor = isHighRisk ? '#DC2626' : isMediumRisk ? '#D97706' : '#16A34A';
  const badgeBorder = isHighRisk ? '#FCA5A5' : isMediumRisk ? '#FDE68A' : '#86EFAC';

  const steps = Array.isArray(audit.step_by_step_narrative) ? audit.step_by_step_narrative : [];
  const flags = Array.isArray(audit.ai_anomaly_flags) ? audit.ai_anomaly_flags : [];

  return (
    <Card 
      style={{ 
        borderLeft: `5px solid ${badgeColor}`,
        backgroundColor: isHighRisk ? 'rgba(254, 242, 242, 0.4)' : isMediumRisk ? 'rgba(255, 251, 235, 0.4)' : 'var(--color-bg-card)',
        padding: '20px',
        marginBottom: '20px'
      }}
    >
      {/* Top Banner Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <div style={{ 
            padding: '8px', 
            borderRadius: '10px', 
            backgroundColor: badgeBg, 
            border: `1px solid ${badgeBorder}`,
            color: badgeColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {isHighRisk ? <AlertTriangle size={22} /> : isMediumRisk ? <ShieldAlert size={22} /> : <ShieldCheck size={22} />}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', color: badgeColor, textTransform: 'uppercase' }}>
                USP 4 • EXPLAINABLE PAYROLL AUDITOR
              </span>
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '10px',
                backgroundColor: badgeBg,
                color: badgeColor,
                border: `1px solid ${badgeBorder}`
              }}>
                {audit.audit_status || (isClean ? 'Verified Clean' : 'Flagged')}
              </span>
            </div>
            <h3 style={{ margin: '4px 0 2px 0', fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              {isClean ? 'Automated Arithmetic & Compliance Audit Verified' : 'Compliance Discrepancy & Variance Detected'}
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              Continuous algorithmic verification across contract base wages, attendance penalties, and statutory withholdings.
            </p>
          </div>
        </div>

        {/* Risk Score Pill */}
        <div style={{ 
          textAlign: 'right', 
          backgroundColor: badgeBg, 
          padding: '8px 16px', 
          borderRadius: '12px', 
          border: `1px solid ${badgeBorder}` 
        }}>
          <div style={{ fontSize: '20px', fontWeight: 800, color: badgeColor, lineHeight: 1 }}>
            {riskScore.toFixed(1)} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>/ 100</span>
          </div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: badgeColor, textTransform: 'uppercase', marginTop: '2px' }}>
            {isHighRisk ? 'High Anomaly Risk' : isMediumRisk ? 'Medium Risk' : 'Audit Clean'}
          </div>
        </div>
      </div>

      {/* Plain English Summary */}
      {audit.plain_english_summary && (
        <div style={{ 
          marginTop: '14px', 
          padding: '12px 16px', 
          backgroundColor: 'var(--color-bg-main)', 
          borderRadius: '8px', 
          border: '1px solid var(--color-border)',
          fontSize: '13px',
          lineHeight: '1.5',
          color: 'var(--color-text-primary)'
        }}>
          <strong style={{ color: 'var(--color-text-primary)', display: 'block', marginBottom: '4px' }}>
            Auditor Summary Note:
          </strong>
          {audit.plain_english_summary}
        </div>
      )}

      {/* Formula Equation Banner */}
      {audit.formula_equation && (
        <div style={{ 
          marginTop: '10px', 
          padding: '10px 14px', 
          backgroundColor: 'var(--color-bg-card)', 
          borderRadius: '6px', 
          border: '1px dashed var(--color-border)',
          fontSize: '12px',
          color: 'var(--color-text-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          overflowX: 'auto'
        }}>
          <Calculator size={15} color="var(--color-brand)" style={{ flexShrink: 0 }} />
          <span><strong>Derivation:</strong> <code>{audit.formula_equation}</code></span>
        </div>
      )}

      {/* Anomaly Flags if any */}
      {flags.length > 0 && (
        <div style={{ marginTop: '14px' }}>
          <h4 style={{ fontSize: '12px', fontWeight: 700, color: '#DC2626', margin: '0 0 6px 0', textTransform: 'uppercase' }}>
            Flagged Items Requiring Review ({flags.length}):
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {flags.map((flag, idx) => (
              <div 
                key={idx} 
                style={{ 
                  padding: '8px 12px', 
                  backgroundColor: '#FEF2F2', 
                  border: '1px solid #FCA5A5', 
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#991B1B',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                <span>{flag}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expand/Collapse Toggle Button for Step-by-Step Breakdown */}
      <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-brand)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: 0
          }}
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          {expanded ? 'Hide Step-by-Step Arithmetic Journey' : 'View Step-by-Step Arithmetic Journey (4 Stages)'}
        </button>
      </div>

      {/* Expandable Step-by-Step Audit Breakdown */}
      {expanded && steps.length > 0 && (
        <div style={{ marginTop: '16px', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {steps.map((step, idx) => (
              <div 
                key={idx}
                style={{
                  padding: '12px 14px',
                  backgroundColor: 'var(--color-bg-main)',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start'
                }}
              >
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-brand)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 700,
                  flexShrink: 0,
                  marginTop: '2px'
                }}>
                  {step.step_number || idx + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <h5 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      {step.title}
                    </h5>
                    {step.impact_amount !== undefined && (
                      <span style={{ 
                        fontSize: '12px', 
                        fontWeight: 700, 
                        color: step.impact_amount < 0 ? 'var(--color-status-error)' : 'var(--color-brand)' 
                      }}>
                        {step.impact_amount < 0 ? `-$${Math.abs(step.impact_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : `$${step.impact_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                      </span>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
                    {step.narrative}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export default ExplainableAuditor;
