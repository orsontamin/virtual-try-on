import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import WizardPage from './pages/WizardPage';
import AnalyticsPage from './pages/AnalyticsPage';
import HistoryPage from './pages/HistoryPage';
import GlamStudioPage from './pages/GlamStudioPage';
import BarberKioskPage from './pages/BarberKioskPage';
import SharePage from './pages/SharePage';

import LandingPage from './pages/LandingPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/wardrobe" element={<WizardPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/barber-kiosk" element={<BarberKioskPage />} />
        <Route path="/glam-studio" element={<GlamStudioPage />} />
        <Route path="/share/:id" element={<SharePage />} />
      </Routes>
    </Router>
  );
}

export default App;
