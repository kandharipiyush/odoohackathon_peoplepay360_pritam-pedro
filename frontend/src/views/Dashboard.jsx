import React, { useState, useEffect } from 'react';
import Card from '../components/common/Card';
import { useAuth } from '../context/AuthContext';
import { intelligenceApi } from '../services/intelligenceApi';
import BudgetPredictionCard from '../components/intelligence/BudgetPredictionCard';
import ForecastChart from '../components/intelligence/ForecastChart';
import PredictionReasons from '../components/intelligence/PredictionReasons';
import Loader from '../components/common/Loader';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardIntelligence = async () => {
      try {
        const res = await intelligenceApi.getPayrollForecast();
        setForecastData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    // Only load these widgets for HR/Admin roles
    if (['Admin', 'HR Manager', 'HR Payroll Manager'].includes(currentUser?.role)) {
      fetchDashboardIntelligence();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  return (
    <div>
      <h1 style={{ fontSize: '24px', marginBottom: 'var(--spacing-3)' }}>Overview Dashboard</h1>
      
      {loading ? (
        <Loader />
      ) : (
        <>
          {['Admin', 'HR Manager', 'HR Payroll Manager'].includes(currentUser?.role) ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 'var(--spacing-3)', alignItems: 'start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
                <BudgetPredictionCard forecastData={forecastData} />
                <ForecastChart data={forecastData} />
              </div>
              <div>
                <PredictionReasons reasons={forecastData?.reasons} />
              </div>
            </div>
          ) : (
            <Card>
              <h2 style={{ fontSize: '18px' }}>Welcome to PeoplePay360, {currentUser?.firstName}</h2>
              <p style={{ marginTop: '16px', color: 'var(--color-text-secondary)' }}>
                Select an item from the sidebar to view your information.
              </p>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;
