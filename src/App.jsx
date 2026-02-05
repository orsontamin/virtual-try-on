import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import WizardPage from './pages/WizardPage';
import AnalyticsPage from './pages/AnalyticsPage';
import HistoryPage from './pages/HistoryPage';
import GlamStudioPage from './pages/GlamStudioPage';
import BarberKioskPage from './pages/BarberKioskPage';
import SharePage from './pages/SharePage';
import LandingPage from './pages/LandingPage';

const ScreenLayout = ({ children }) => {
  const location = useLocation();
  if (location.pathname.startsWith('/share')) {
    return children;
  }

  return (
    <div className="bg-[#F47321] w-full h-full flex items-center justify-center overflow-hidden">
      <div className="screen-container">
        <div className="screen-content no-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <ScreenLayout>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/wardrobe" element={<WizardPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/barber-kiosk" element={<BarberKioskPage />} />
          <Route path="/glam-studio" element={<GlamStudioPage />} />
          <Route path="/share/:id" element={<SharePage />} />
        </Routes>
      </ScreenLayout>
    </Router>
  );
}

export default App;

