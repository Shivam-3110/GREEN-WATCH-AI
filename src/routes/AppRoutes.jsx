import { Navigate, Route, Routes } from 'react-router-dom'
import DashboardLayout from '../layouts/DashboardLayout'
import DashboardPage from '../pages/DashboardPage'
import AirQualityPage from '../pages/AirQualityPage'
import MapPage from '../pages/MapPage'
import ChatPage from '../pages/ChatPage'
import CarbonCalculatorPage from '../pages/CarbonCalculatorPage'
import WasteDetectionPage from '../pages/WasteDetectionPage'
import AlertTestPage from '../pages/AlertTestPage'
import EcoChallengePage from '../pages/EcoChallengePage'
import CitySimulatorPage from '../pages/CitySimulatorPage'
import SettingsPage from '../pages/SettingsPage'
import NotFoundPage from '../pages/NotFoundPage'
import LoginPage from '../pages/auth/LoginPage'
import RegisterPage from '../pages/auth/RegisterPage'
import PublicOnlyRoute from './PublicOnlyRoute'
import ProtectedRoute from './ProtectedRoute'

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <RegisterPage />
          </PublicOnlyRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/air-quality" element={<AirQualityPage />} />
        <Route path="/map-intelligence" element={<MapPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/carbon-calculator" element={<CarbonCalculatorPage />} />
        <Route path="/waste-detection" element={<WasteDetectionPage />} />
        <Route path="/alerts" element={<AlertTestPage />} />
        <Route path="/eco-challenge" element={<EcoChallengePage />} />
        <Route path="/city-simulator" element={<CitySimulatorPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* 404 Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default AppRoutes
