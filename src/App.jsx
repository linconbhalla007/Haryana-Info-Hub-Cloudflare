import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';

import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import './components/cards.css';

import Home from './pages/Home.jsx';
import News from './pages/News.jsx';
import GovernmentOrders from './pages/GovernmentOrders.jsx';
import GovernmentOrderDetail from './pages/GovernmentOrderDetail.jsx';
import Jobs from './pages/Jobs.jsx';
import JobDetail from './pages/JobDetail.jsx';
import Schemes from './pages/Schemes.jsx';
import SchemeDetail from './pages/SchemeDetail.jsx';
import Departments from './pages/Departments.jsx';
import DepartmentDetail from './pages/DepartmentDetail.jsx';
import Search from './pages/Search.jsx';
import NotFound from './pages/NotFound.jsx';
import UnderDevelopmentDialog from './components/UnderDevelopmentDialog.jsx';

// Admin Panel Imports
import { AdminAuthProvider, ProtectedRoute } from './admin/context/AdminAuthContext.jsx';
import AdminLogin from './admin/pages/AdminLogin.jsx';
import AdminDashboard from './admin/pages/AdminDashboard.jsx';
import GovernmentOrdersCMS from './admin/pages/GovernmentOrdersCMS.jsx';
import HomepageSectionsCMS from './admin/pages/HomepageSectionsCMS.jsx';

// Scrolls to top on every route change (React Router doesn't do this by default).
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function App() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeCard, setActiveCard] = useState('');
  const location = useLocation();

  const isAdminRoute = location.pathname.startsWith('/admin');

  const openDevDialog = (title) => {
    setActiveCard(title);
    setDialogOpen(true);
  };

  return (
    <AdminAuthProvider>
      <ScrollToTop />
      {isAdminRoute ? (
        <Routes>
          <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/government-orders"
            element={
              <ProtectedRoute>
                <GovernmentOrdersCMS />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/homepage-sections"
            element={
              <ProtectedRoute>
                <HomepageSectionsCMS />
              </ProtectedRoute>
            }
          />
          <Route path="/admin/*" element={<Navigate to="/admin/login" replace />} />
        </Routes>
      ) : (
        <div className="app-shell">
          <Header onDevClick={openDevDialog} />
          <main className="app-main">
            <Routes>
              <Route path="/" element={<Home onDevClick={openDevDialog} />} />
              <Route path="/news" element={<News />} />
              <Route path="/government-orders" element={<GovernmentOrders />} />
              <Route path="/government-orders/:id" element={<GovernmentOrderDetail />} />
              <Route path="/jobs" element={<Jobs />} />
              <Route path="/jobs/:id" element={<JobDetail />} />
              <Route path="/schemes" element={<Schemes />} />
              <Route path="/schemes/:id" element={<SchemeDetail />} />
              <Route path="/departments" element={<Departments />} />
              <Route path="/departments/:id" element={<DepartmentDetail />} />
              <Route path="/search" element={<Search />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer onDevClick={openDevDialog} />
          <UnderDevelopmentDialog
            isOpen={dialogOpen}
            onClose={() => setDialogOpen(false)}
            cardTitle={activeCard}
          />
        </div>
      )}
    </AdminAuthProvider>
  );
}

export default App;
