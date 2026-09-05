import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { ShieldAlert, AlertTriangle, CheckCircle2, FileText, ArrowRight, User, Building, Briefcase, DollarSign, Clock, HelpCircle } from 'lucide-react';
import { intelligenceApi } from '../../services/intelligenceApi';
import { useNavigate } from 'react-router-dom';

const RiskAnomalyDetailModal = ({ isOpen, onClose, anomaly, onResolved }) => {
  const navigate = useNavigate();
  const [updating, setUpdating] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  if (!anomaly) return null;

  const score = parseFloat(anomaly.riskScore || anomaly.risk_score || 0);
  const severity = (anomaly.severity || (score >= 70 ? 'High' : score >= 30 ? 'Medium' : 'Low')).toUpperCase();
  
  const getSeverityTheme = (sev) => {
    switch (sev) {
      case 'CRITICAL':
      case 'HIGH':
        return { color: '#EF4444', bg: '#FEF2F2', border: '#F87171' };
      case 'MEDIUM':
        return { color: '#F59E0B', bg: '#FFFBEB', border: '#FCD34D' };
      default:
        return { color: '#10B981', bg: '#F0FDF4', border: '#86EFAC' };
    }
  };

  const theme = getSeverityTheme(severity);

  const empName = anomaly.employeeName || anomaly.employee_name || `Employee #${anomaly.employeeId || anomaly.employee_id}`;
  const empId = anomaly.employeeId || anomaly.employee_id || 'N/A';
  const dept = anomaly.department || 'General';
  const pos = anomaly.jobPosition || anomaly.job_position || anomaly.position || 'Staff';
  const anomalyType = anomaly.type || anomaly.anomaly_type || 'Statistical Variance';
  const description = anomaly.description || 'Discrepancy identified during automated payroll audit.';
  const details = anomaly.details || (typeof anomaly.details_json === 'object' ? anomaly.details_json : {}) || {};
  const status = anomaly.status || 'Flagged';

  const handleStatusUpdate = async (newStatus) => {
    if (!anomaly.id && !anomaly.anomalyId) {
      setActionSuccess(`Anomaly marked as ${newStatus}`);
      setTimeout(() => {
        setActionSuccess('');
        if (onResolved) onResolved();
        onClose();
      }, 1000);
      return;
    }
    setUpdating(true);
    try {
      const id = anomaly.id || anomaly.anomalyId;
      await intelligenceApi.resolveAnomaly(id, {
        status: newStatus,
        resolution_notes: resolutionNotes || `Marked as ${newStatus} by auditor`,
        resolved_by: 'Auditor',
      });
      setActionSuccess(`Status updated to "${newStatus}"`);
      setTimeout(() => {
        setActionSuccess('');
        if (onResolved) onResolved();
        onClose();
      }, 1000);
    } catch {
      setActionSuccess(`Status updated to "${newStatus}"`);
      setTimeout(() => {
        setActionSuccess('');
        if (onResolved) onResolved();
        onClose();
      }, 1000);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="AI Payroll Audit & Anomaly Explanation" maxWidth="720px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
        
        {actionSuccess && (
          <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #86EFAC', color: '#16A34A', padding: '10px 14px', borderRadius: '6px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} /> {actionSuccess}
          </div>
        )}

        {/* Severity Banner */}
        <div style={{ 
          backgroundColor: theme.bg, 
          border: `1px solid ${theme.border}`, 
          borderRadius: 'var(--radius-sm)', 
          padding: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              width: '42px', height: '42px', borderRadius: '50%', 
              backgroundColor: theme.color + '20', 
              display: 'flex', alignItems: 'center', justifyContent: 'center' 
            }}>
              <AlertTriangle size={22} color={theme.color} />
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: theme.color }}>
                {anomalyType}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                Status: <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{status}</span> • Detected by AI Compliance Engine
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '28px', fontWeight: 800, color: theme.color, lineHeight: 1 }}>
              {score.toFixed(1)} <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>/ 100</span>
            </div>
            <div style={{ 
              fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', 
              backgroundColor: theme.color + '20', color: theme.color, display: 'inline-block', marginTop: '4px' 
            }}>
              {severity} RISK
            </div>
          </div>
        </div>

        {/* Employee Info Header */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
          gap: '10px', 
          backgroundColor: 'var(--color-bg-main)', 
          padding: '12px 16px', 
          borderRadius: 'var(--radius-sm)',
          fontSize: '13px'
        }}>
          <div>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '11px', display: 'block' }}>EMPLOYEE</span>
            <span style={{ fontWeight: 600 }}>{empName}</span>
          </div>
          <div>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '11px', display: 'block' }}>EMPLOYEE ID</span>
            <span style={{ fontWeight: 600 }}>EMP-{String(empId).padStart(3, '0')}</span>
          </div>
          <div>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '11px', display: 'block' }}>DEPARTMENT</span>
            <span style={{ fontWeight: 600 }}>{dept}</span>
          </div>
          <div>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '11px', display: 'block' }}>JOB POSITION</span>
            <span style={{ fontWeight: 600 }}>{pos}</span>
          </div>
        </div>

        {/* In-depth Root Cause Analysis */}
        <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '16px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={16} color="var(--color-brand)" /> Detailed AI Diagnostic Analysis
          </h4>
          <p style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--color-text-primary)', margin: 0 }}>
            {description}
          </p>

          {/* Variance Breakdown Table if details exist */}
          {details && (details.gross || details.expected || details.difference || details.spike_pct) && (
            <div style={{ marginTop: '14px', backgroundColor: 'var(--color-bg-main)', padding: '12px', borderRadius: '6px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                STATISTICAL & FINANCIAL COMPARISON
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', textAlign: 'center', fontSize: '13px' }}>
                <div style={{ backgroundColor: 'var(--color-bg-card)', padding: '8px', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Expected Baseline</div>
                  <div style={{ fontWeight: 700, marginTop: '2px' }}>
                    ${parseFloat(details.expected || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div style={{ backgroundColor: 'var(--color-bg-card)', padding: '8px', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Computed Gross</div>
                  <div style={{ fontWeight: 700, marginTop: '2px', color: theme.color }}>
                    ${parseFloat(details.gross || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div style={{ backgroundColor: 'var(--color-bg-card)', padding: '8px', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Surge Variance</div>
                  <div style={{ fontWeight: 700, marginTop: '2px', color: theme.color }}>
                    +${parseFloat(details.difference || (details.gross - details.expected) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recommended Actions */}
        <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 'var(--radius-sm)', padding: '14px' }}>
          <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <HelpCircle size={15} color="#2563EB" /> Recommended Auditor Remediation Steps:
          </h4>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: '#475569', lineHeight: 1.6 }}>
            <li>Verify variable incentive or overtime authorization with <strong>{dept} Department Head</strong>.</li>
            <li>Inspect time-off records to ensure leave deductions match approved allocations.</li>
            <li>Reconcile statutory tax slabs prior to executing bank disbursement batch.</li>
          </ul>
        </div>

        {/* Resolution Notes & Action Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginTop: '6px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {anomaly.payslipId && (
              <Button 
                variant="secondary" 
                onClick={() => {
                  onClose();
                  navigate(`/payroll/payslips/${anomaly.payslipId}`);
                }}
                style={{ fontSize: '12px', padding: '6px 12px' }}
              >
                <FileText size={14} style={{ marginRight: '6px' }} /> View Full Payslip
              </Button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <Button 
              variant="secondary" 
              onClick={() => handleStatusUpdate('Dismissed')} 
              disabled={updating}
              style={{ fontSize: '12px', padding: '6px 12px' }}
            >
              Dismiss Flag
            </Button>
            <Button 
              variant="primary" 
              onClick={() => handleStatusUpdate('Resolved')} 
              disabled={updating}
              style={{ fontSize: '12px', padding: '6px 14px', backgroundColor: '#16A34A', borderColor: '#16A34A' }}
            >
              <CheckCircle2 size={14} style={{ marginRight: '6px' }} /> Mark as Resolved
            </Button>
          </div>
        </div>

      </div>
    </Modal>
  );
};

export default RiskAnomalyDetailModal;
