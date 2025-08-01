const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30m';

app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const users = new Map();
const tickets = new Map();
const comments = new Map();

const UserRole = {
  ADMIN: 'admin',
  SUPPORT: 'support',
  USER: 'user'
};

const TicketStatus = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed'
};

const TicketPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const hashPassword = async (password) => {
  return await bcrypt.hash(password, 12);
};

const verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

const generateToken = (userId) => {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ detail: 'Token de acceso requerido' });
  }

  try {
    const decoded = verifyToken(token);
    const user = users.get(decoded.sub);
    
    if (!user) {
      return res.status(401).json({ detail: 'Usuario no encontrado' });
    }

    if (!user.is_active) {
      return res.status(401).json({ detail: 'Cuenta desactivada' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ detail: 'Token inválido' });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ detail: 'Permisos insuficientes' });
    }
    next();
  };
};

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ detail: errors.array()[0].msg });
  }
  next();
};

app.get('/healthz', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/auth/register', [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('full_name').notEmpty().withMessage('Nombre completo es requerido'),
  body('organization').notEmpty().withMessage('Organización es requerida'),
  body('role').optional().isIn(Object.values(UserRole)).withMessage('Rol inválido'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { email, password, full_name, organization, role = UserRole.USER } = req.body;

    const existingUser = Array.from(users.values()).find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ detail: 'El email ya está registrado' });
    }

    const userId = generateId();
    const hashedPassword = await hashPassword(password);

    const user = {
      id: userId,
      email,
      full_name,
      organization,
      role,
      password: hashedPassword,
      created_at: new Date().toISOString(),
      is_active: true
    };

    users.set(userId, user);

    const token = generateToken(userId);

    res.status(201).json({
      access_token: token,
      token_type: 'bearer',
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        organization: user.organization,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

app.post('/api/auth/login', [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('Contraseña es requerida'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = Array.from(users.values()).find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ detail: 'Email o contraseña incorrectos' });
    }

    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ detail: 'Email o contraseña incorrectos' });
    }

    if (!user.is_active) {
      return res.status(401).json({ detail: 'Cuenta desactivada' });
    }

    const token = generateToken(user.id);

    res.json({
      access_token: token,
      token_type: 'bearer',
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        organization: user.organization,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({
    id: req.user.id,
    email: req.user.email,
    full_name: req.user.full_name,
    organization: req.user.organization,
    role: req.user.role
  });
});

app.post('/api/tickets', [
  authenticateToken,
  body('title').notEmpty().withMessage('Título es requerido'),
  body('description').notEmpty().withMessage('Descripción es requerida'),
  body('category').notEmpty().withMessage('Categoría es requerida'),
  body('priority').optional().isIn(Object.values(TicketPriority)).withMessage('Prioridad inválida'),
  handleValidationErrors
], (req, res) => {
  try {
    const { title, description, category, priority = TicketPriority.MEDIUM } = req.body;

    const ticketId = generateId();
    const ticket = {
      id: ticketId,
      title,
      description,
      status: TicketStatus.OPEN,
      priority,
      category,
      created_by: req.user.id,
      assigned_to: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    tickets.set(ticketId, ticket);

    res.status(201).json(ticket);
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

app.get('/api/tickets', authenticateToken, (req, res) => {
  try {
    const userTickets = [];

    for (const ticket of tickets.values()) {
      if (req.user.role === UserRole.ADMIN || 
          req.user.role === UserRole.SUPPORT || 
          ticket.created_by === req.user.id || 
          ticket.assigned_to === req.user.id) {
        
        const creator = users.get(ticket.created_by);
        const ticketWithInfo = {
          ...ticket,
          created_by_name: creator ? creator.full_name : 'Usuario desconocido'
        };

        if (ticket.assigned_to) {
          const assignee = users.get(ticket.assigned_to);
          ticketWithInfo.assigned_to_name = assignee ? assignee.full_name : 'Usuario desconocido';
        } else {
          ticketWithInfo.assigned_to_name = null;
        }

        userTickets.push(ticketWithInfo);
      }
    }

    res.json(userTickets);
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

app.get('/api/tickets/:id', authenticateToken, (req, res) => {
  try {
    const ticketId = req.params.id;
    const ticket = tickets.get(ticketId);

    if (!ticket) {
      return res.status(404).json({ detail: 'Ticket no encontrado' });
    }

    if (req.user.role !== UserRole.ADMIN && 
        req.user.role !== UserRole.SUPPORT && 
        ticket.created_by !== req.user.id && 
        ticket.assigned_to !== req.user.id) {
      return res.status(403).json({ detail: 'No tienes permisos para ver este ticket' });
    }

    const creator = users.get(ticket.created_by);
    const ticketWithInfo = {
      ...ticket,
      created_by_name: creator ? creator.full_name : 'Usuario desconocido'
    };

    if (ticket.assigned_to) {
      const assignee = users.get(ticket.assigned_to);
      ticketWithInfo.assigned_to_name = assignee ? assignee.full_name : 'Usuario desconocido';
    } else {
      ticketWithInfo.assigned_to_name = null;
    }

    res.json(ticketWithInfo);
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

app.put('/api/tickets/:id', [
  authenticateToken,
  body('title').optional().notEmpty().withMessage('Título no puede estar vacío'),
  body('description').optional().notEmpty().withMessage('Descripción no puede estar vacía'),
  body('status').optional().isIn(Object.values(TicketStatus)).withMessage('Estado inválido'),
  body('priority').optional().isIn(Object.values(TicketPriority)).withMessage('Prioridad inválida'),
  handleValidationErrors
], (req, res) => {
  try {
    const ticketId = req.params.id;
    const ticket = tickets.get(ticketId);

    if (!ticket) {
      return res.status(404).json({ detail: 'Ticket no encontrado' });
    }

    if (req.user.role !== UserRole.ADMIN && 
        req.user.role !== UserRole.SUPPORT && 
        ticket.created_by !== req.user.id && 
        ticket.assigned_to !== req.user.id) {
      return res.status(403).json({ detail: 'No tienes permisos para actualizar este ticket' });
    }

    const { title, description, status, priority, assigned_to } = req.body;

    if (title !== undefined) ticket.title = title;
    if (description !== undefined) ticket.description = description;
    if (status !== undefined) ticket.status = status;
    if (priority !== undefined) ticket.priority = priority;
    if (assigned_to !== undefined && (req.user.role === UserRole.ADMIN || req.user.role === UserRole.SUPPORT)) {
      ticket.assigned_to = assigned_to;
    }

    ticket.updated_at = new Date().toISOString();
    tickets.set(ticketId, ticket);

    res.json(ticket);
  } catch (error) {
    console.error('Update ticket error:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

app.post('/api/tickets/:id/comments', [
  authenticateToken,
  body('content').notEmpty().withMessage('Contenido del comentario es requerido'),
  handleValidationErrors
], (req, res) => {
  try {
    const ticketId = req.params.id;
    const ticket = tickets.get(ticketId);

    if (!ticket) {
      return res.status(404).json({ detail: 'Ticket no encontrado' });
    }

    if (req.user.role !== UserRole.ADMIN && 
        req.user.role !== UserRole.SUPPORT && 
        ticket.created_by !== req.user.id && 
        ticket.assigned_to !== req.user.id) {
      return res.status(403).json({ detail: 'No tienes permisos para comentar en este ticket' });
    }

    const commentId = generateId();
    const comment = {
      id: commentId,
      ticket_id: ticketId,
      user_id: req.user.id,
      content: req.body.content,
      created_at: new Date().toISOString()
    };

    comments.set(commentId, comment);

    res.status(201).json(comment);
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

app.get('/api/tickets/:id/comments', authenticateToken, (req, res) => {
  try {
    const ticketId = req.params.id;
    const ticket = tickets.get(ticketId);

    if (!ticket) {
      return res.status(404).json({ detail: 'Ticket no encontrado' });
    }

    if (req.user.role !== UserRole.ADMIN && 
        req.user.role !== UserRole.SUPPORT && 
        ticket.created_by !== req.user.id && 
        ticket.assigned_to !== req.user.id) {
      return res.status(403).json({ detail: 'No tienes permisos para ver los comentarios de este ticket' });
    }

    const ticketComments = [];
    for (const comment of comments.values()) {
      if (comment.ticket_id === ticketId) {
        const user = users.get(comment.user_id);
        const commentWithInfo = {
          ...comment,
          user_name: user ? user.full_name : 'Usuario desconocido'
        };
        ticketComments.push(commentWithInfo);
      }
    }

    ticketComments.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    res.json(ticketComments);
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

app.get('/api/admin/users', [authenticateToken, requireRole([UserRole.ADMIN])], (req, res) => {
  try {
    const userList = Array.from(users.values()).map(user => ({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      organization: user.organization,
      role: user.role,
      created_at: user.created_at,
      is_active: user.is_active
    }));

    res.json(userList);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

app.get('/api/support/users', [authenticateToken, requireRole([UserRole.ADMIN, UserRole.SUPPORT])], (req, res) => {
  try {
    const supportUsers = Array.from(users.values())
      .filter(user => user.role === UserRole.ADMIN || user.role === UserRole.SUPPORT)
      .map(user => ({
        id: user.id,
        full_name: user.full_name,
        role: user.role
      }));

    res.json(supportUsers);
  } catch (error) {
    console.error('Get support users error:', error);
    res.status(500).json({ detail: 'Error interno del servidor' });
  }
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ detail: 'Error interno del servidor' });
});

app.use((req, res) => {
  res.status(404).json({ detail: 'Endpoint no encontrado' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
  console.log(`📚 Sistema de Tickets de Soporte - Backend Node.js`);
});

module.exports = app;
