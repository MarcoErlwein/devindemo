import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, User, Mail, Building } from 'lucide-react'

const profileSchema = z.object({
  email: z
    .string()
    .min(1, 'Email es requerido')
    .email('Formato de email inválido'),
  full_name: z
    .string()
    .min(1, 'Nombre completo es requerido')
    .min(2, 'Nombre debe tener al menos 2 caracteres'),
  organization: z
    .string()
    .min(1, 'Organización es requerida')
    .min(2, 'Organización debe tener al menos 2 caracteres')
})

type ProfileFormData = z.infer<typeof profileSchema>

const UserProfile: React.FC = () => {
  const { user, updateUser } = useAuth()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      email: user?.email || '',
      full_name: user?.full_name || '',
      organization: user?.organization || ''
    }
  })

  const onSubmit = async (data: ProfileFormData) => {
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      await updateUser(data)
      setSuccess('Perfil actualizado correctamente')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar perfil')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Mi Perfil</span>
          </CardTitle>
          <CardDescription>
            Actualiza tu información personal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="full_name">Nombre Completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="full_name"
                  type="text"
                  {...register('full_name')}
                  placeholder="Juan Pérez"
                  className="pl-10"
                />
              </div>
              {errors.full_name && (
                <p className="text-sm text-red-600">{errors.full_name.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="tu@email.com"
                  className="pl-10"
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="organization">Organización</Label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="organization"
                  type="text"
                  {...register('organization')}
                  placeholder="Mi Empresa S.A."
                  className="pl-10"
                />
              </div>
              {errors.organization && (
                <p className="text-sm text-red-600">{errors.organization.message}</p>
              )}
            </div>
            
            <Button type="submit" className="w-full" disabled={loading || isSubmitting}>
              {(loading || isSubmitting) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Actualizar Perfil
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default UserProfile
