import React from 'react'
import { Link } from 'react-router-dom'

const Footer: React.FC = () => {
  return (
    <footer className="bg-white shadow-sm border-t mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <div className="text-sm text-gray-600">
              © 2024 Sistema de Tickets. Todos los derechos reservados.
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <Link 
              to="/dashboard" 
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Inicio
            </Link>
            <Link 
              to="/tickets" 
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Tickets
            </Link>
            <div className="text-sm text-gray-600">
              v1.0.0
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
