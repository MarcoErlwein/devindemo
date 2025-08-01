import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  id: string
  email: string
  full_name: string
  organization: string
  role: 'admin' | 'support' | 'user'
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (userData: RegisterData) => Promise<void>
  updateUser: (userData: Partial<User>) => Promise<void>
  logout: () => void
  loading: boolean
}

interface RegisterData {
  email: string
  password: string
  full_name: string
  organization: string
  role?: 'admin' | 'support' | 'user'
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:8000'
  console.log('Using API URL:', API_URL)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      fetchCurrentUser(token)
    } else {
      setLoading(false)
    }
  }, [])

  const fetchCurrentUser = async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      } else {
        localStorage.removeItem('token')
      }
    } catch (error) {
      console.error('Error fetching user:', error)
      localStorage.removeItem('token')
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Error al iniciar sesión')
    }

    const data = await response.json()
    localStorage.setItem('token', data.access_token)
    setUser(data.user)
  }

  const register = async (userData: RegisterData) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Error al registrarse')
      }

      const data = await response.json()
      localStorage.setItem('token', data.access_token)
      setUser(data.user)
    } catch (err) {
      console.error('Registration error:', err)
      if (err instanceof TypeError && err.message.includes('fetch')) {
        throw new Error('No se pudo conectar con el servidor. Verifica tu conexión a internet.')
      }
      throw err
    }
  }

  const updateUser = async (userData: Partial<User>) => {
    const token = localStorage.getItem('token')
    if (!token) {
      throw new Error('No hay sesión activa')
    }

    const response = await fetch(`${API_URL}/api/auth/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Error al actualizar perfil')
    }

    const updatedUser = await response.json()
    setUser(updatedUser)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  const value = {
    user,
    login,
    register,
    updateUser,
    logout,
    loading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
