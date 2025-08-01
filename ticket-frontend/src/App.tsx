import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import LoginForm from './components/LoginForm'
import RegisterForm from './components/RegisterForm'
import Dashboard from './components/Dashboard'
import TicketList from './components/TicketList'
import TicketForm from './components/TicketForm'
import TicketDetail from './components/TicketDetail'
import AdminPanel from './components/AdminPanel'
import UserProfile from './components/UserProfile'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import { Toaster } from '@/components/ui/toaster'

function AppContent() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {user && <Navbar />}
      <main className="flex-1">
        <Routes>
          <Route 
            path="/login" 
            element={user ? <Navigate to="/dashboard" /> : <LoginForm />} 
          />
          <Route 
            path="/register" 
            element={user ? <Navigate to="/dashboard" /> : <RegisterForm />} 
          />
          <Route 
            path="/dashboard" 
            element={user ? <Dashboard /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/tickets" 
            element={user ? <TicketList /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/tickets/new" 
            element={user ? <TicketForm /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/tickets/:id" 
            element={user ? <TicketDetail /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/admin" 
            element={user?.role === 'admin' ? <AdminPanel /> : <Navigate to="/dashboard" />} 
          />
          <Route 
            path="/profile" 
            element={user ? <UserProfile /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/" 
            element={user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} 
          />
        </Routes>
      </main>
      {user && <Footer />}
      <Toaster />
    </div>
  )
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  )
}

export default App
