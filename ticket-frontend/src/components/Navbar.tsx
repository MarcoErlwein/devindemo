import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { LogOut, Home, Ticket, Settings } from 'lucide-react'

const Navbar: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link to="/dashboard" className="text-xl font-bold text-blue-600">
              Sistema de Tickets
            </Link>
            
            <div className="hidden md:flex space-x-4">
              <Link 
                to="/dashboard" 
                className="flex items-center space-x-1 text-gray-600 hover:text-gray-900"
              >
                <Home className="h-4 w-4" />
                <span>Inicio</span>
              </Link>
              
              <Link 
                to="/tickets" 
                className="flex items-center space-x-1 text-gray-600 hover:text-gray-900"
              >
                <Ticket className="h-4 w-4" />
                <span>Tickets</span>
              </Link>
              
              {(user?.role === 'admin' || user?.role === 'support') && (
                <Link 
                  to="/admin" 
                  className="flex items-center space-x-1 text-gray-600 hover:text-gray-900"
                >
                  <Settings className="h-4 w-4" />
                  <span>Administración</span>
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{user?.full_name}</span>
              <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                {user?.role === 'admin' ? 'Admin' : 
                 user?.role === 'support' ? 'Soporte' : 'Usuario'}
              </span>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              className="flex items-center space-x-1"
            >
              <LogOut className="h-4 w-4" />
              <span>Salir</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
