import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { AppProvider } from '../../context/AppContext';

const MainLayout = () => {
  return (
    <AppProvider>
      <div className="app-container">
        <Sidebar />
        <div className="main-content">
          <Navbar />
          <main className="content-area">
            <Outlet />
          </main>
        </div>
      </div>
    </AppProvider>
  );
};

export default MainLayout;
