import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import Login from './pages/Login'
import StaffDashboard from './pages/StaffDashboard'
import ChefDashboard from './pages/ChefDashboard'
import AdminDashboard from './pages/AdminDashboard'
import './App.css'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/staff/dashboard" element={<StaffDashboard />} />
              <Route path="/chef/dashboard" element={<ChefDashboard />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/" element={<Navigate to="/login" />} />
            </Routes>
            <Toaster position="top-right" />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
