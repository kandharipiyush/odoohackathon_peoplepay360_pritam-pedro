import React, { useState } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import { ShieldAlert, AlertTriangle, CheckCircle, Search, Eye, Filter } from 'lucide-react';
import RiskAnomalyDetailModal from './RiskAnomalyDetailModal';

const PayrollRiskTable = ({ risks, onRefresh }) => {
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState('ALL');
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getRiskTheme = (level) => {
    switch (level) {
      case 'CRITICAL':
      case 'HIGH':
        return { color: '#EF4444', bg: '#FEF2F2', border: '#F87171' };
      case 'MEDIUM':
        return { color: '#F59E0B', bg: '#FFFBEB', border: '#FCD34D' };
      default:
        return { color: '#10B981', bg: '#F0FDF4', border: '#86EFAC' };
    }
  };

  const list = Array.isArray(risks) ? risks : [];

  const filtered = list.filter(r => {
    const nameMatch = (r.employeeName || '').toLowerCase().includes(search.toLowerCase()) ||
                      String(r.employeeId || '').includes(search) ||
                      (r.department || '').toLowerCase().includes(search.toLowerCase());
    const levelMatch = filterLevel === 'ALL' || (r.riskLevel || '').toUpperCase() === filterLevel;
    return nameMatch && levelMatch;
  });

  const handleOpenDetails = (riskItem) => {
    // If it has specific anomalies, pass the first one with aggregated context
    const anomalyContext = riskItem.anomalies && riskItem.anomalies.length > 0 
      ? { ...riskItem.anomalies[0], employeeName: riskItem.employeeName, employeeId: riskItem.employeeId, department: riskItem.department, jobPosition: riskItem.position, payslipId: riskItem.payslipId }
      : {
          employeeId: riskItem.employeeId,
          employeeName: riskItem.employeeName,
          department: riskItem.department,
          jobPosition: riskItem.position,
          riskScore: riskItem.riskScore,
          severity: riskItem.riskLevel,
          type: riskItem.riskLevel === 'HIGH' ? 'Unusual Compensation Spike' : 'Standard Variance Audit',
          description: riskItem.reasons ? riskItem.reasons.join('. ') : 'Automated baseline check within expected deviation tolerances.',
          status: 'Reviewed',
          payslipId: riskItem.payslipId
        };
    setSelectedItem(anomalyContext);
    setIsModalOpen(true);
  };

  return (
    <div>
      <Card style={{ padding: 0, overflowX: 'auto' }} title="Employee Payroll Risk & Anomaly Assessment">
        {/* Search & Filter Bar */}
        <div style={{ 
          padding: '12px 16px', 
          borderBottom: '1px solid var(--color-border)', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: '10px' 
        }}>
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
            <input 
              type="text" 
              placeholder="Search employee, ID, department..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              style={{ paddingLeft: '32px', width: '100%', fontSize: '13px', height: '34px' }} 
            />
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map(lvl => (
              <button
                key={lvl}
                onClick={() => setFilterLevel(lvl)}
                style={{
                  padding: '4px 10px',
                  fontSize: '11px',
                  borderRadius: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: filterLevel === lvl ? '1px solid var(--color-text-primary)' : '1px solid var(--color-border)',
                  backgroundColor: filterLevel === lvl ? 'var(--color-text-primary)' : 'transparent',
                  color: filterLevel === lvl ? 'var(--color-bg-card)' : 'var(--color-text-secondary)'
                }}
              >
                {lvl === 'ALL' ? 'All Risks' : `${lvl} Risk`}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
            No employee risk records match your criteria.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-main)' }}>
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>EMPLOYEE</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>DEPARTMENT</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>RISK SCORE</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>RISK LEVEL</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>AUDIT FACTOR</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', textAlign: 'right' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const theme = getRiskTheme(r.riskLevel);
                const mainReason = r.reasons && r.reasons.length > 0 ? r.reasons[0] : (r.anomalies && r.anomalies[0]?.type) || 'None detected';
                
                return (
                  <tr key={r.employeeId} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '12px 16px', fontSize: '13px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{r.employeeName}</div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>EMP-{String(r.employeeId).padStart(3, '0')} • {r.position}</div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                      {r.department}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 700, color: theme.color }}>
                      {parseFloat(r.riskScore).toFixed(1)}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ 
                        fontSize: '11px', padding: '3px 8px', borderRadius: '12px', fontWeight: 700,
                        backgroundColor: theme.bg, color: theme.color, border: `1px solid ${theme.border}`
                      }}>
                        {r.riskLevel} RISK
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--color-text-secondary)', maxWidth: '280px' }}>
                      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {mainReason}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <Button 
                        variant="secondary" 
                        onClick={() => handleOpenDetails(r)}
                        style={{ padding: '4px 10px', height: 'auto', fontSize: '12px', gap: '4px' }}
                      >
                        <Eye size={13} style={{ marginRight: '4px' }} /> View Details
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      {/* Detail Explainability Modal */}
      <RiskAnomalyDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        anomaly={selectedItem}
        onResolved={() => {
          if (onRefresh) onRefresh();
        }}
      />
    </div>
  );
};

export default PayrollRiskTable;
