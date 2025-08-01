import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { Plus, Ticket, Users } from 'lucide-react'

const Dashboard: React.FC = () => {
  const { user } = useAuth()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Bienvenido, {user?.full_name}
        </h1>
        <p className="text-gray-600 mt-2">
          {user?.organization} - {user?.role === 'admin' ? 'Administrador' : 
           user?.role === 'support' ? 'Soporte' : 'Usuario'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Crear Ticket
            </CardTitle>
            <CardDescription>
              Reporta un nuevo problema o solicitud
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/tickets/new">
              <Button className="w-full">
                Nuevo Ticket
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5" />
              Mis Tickets
            </CardTitle>
            <CardDescription>
              Ver todos tus tickets de soporte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/tickets">
              <Button variant="outline" className="w-full">
                Ver Tickets
              </Button>
            </Link>
          </CardContent>
        </Card>

        {(user?.role === 'admin' || user?.role === 'support') && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Gestión
              </CardTitle>
              <CardDescription>
                {user?.role === 'admin' ? 'Panel de administración' : 'Panel de soporte'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/admin">
                <Button variant="outline" className="w-full">
                  {user?.role === 'admin' ? 'Administrar' : 'Soporte'}
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Link to="/tickets/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Ticket
                </Button>
              </Link>
              <Link to="/tickets">
                <Button variant="outline">
                  <Ticket className="mr-2 h-4 w-4" />
                  Ver Todos los Tickets
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Dashboard
