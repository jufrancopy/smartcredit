import { Request, Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';

// Extend the Request interface to include user information, mirroring auth.ts
interface AuthRequest extends Request {
  userId?: number;
  userRole?: string;
}

const router = Router();
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
      adapter: 'postgresql',
    },
  },
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'backend/uploads/photos');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Create a new user
router.post('/users', authenticateToken, upload.single('foto'), async (req: AuthRequest, res) => {
  if (req.userRole !== 'cobrador' && req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Only cobrador or admin can create users.' });
  }
  const { nombre, apellido, cedula, fecha_nacimiento, tipo_comercio, whatsapp, role, email, password } = req.body;
  const foto_url = req.file ? `/uploads/photos/${req.file.filename}` : undefined;
  
  let hashedPassword = undefined;
  if (password) {
    hashedPassword = await bcrypt.hash(password, 10);
  }
  try {
    const user = await prisma.user.create({
      data: {
        nombre,
        apellido,
        cedula,
        fecha_nacimiento: new Date(fecha_nacimiento),
        tipo_comercio,
        foto_url,
        whatsapp,
        role: role.toLowerCase(),
        email,
        password: hashedPassword,
      },
    });
    res.json(user);
  } catch (error: any) {
    console.error('Error creating user:', error);
    if (error.code === 'P2002') {
      const target = error.meta?.target || 'unknown';
      res.status(409).json({ error: `Conflicto: Ya existe un usuario con este ${target}.` });
    } else {
      res.status(500).json({ error: 'Error creando usuario', details: error.message });
    }
  }
});

// Get all users
router.get('/users', authenticateToken, async (req: AuthRequest, res) => {
  if (req.userRole === 'deudor') {
    return res.status(403).json({ error: 'Forbidden: Deudor cannot view all users.' });
  }
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching users' });
  }
});

// Get a single user by ID
router.get('/users/:id', authenticateToken, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const userIdNum = parseInt(id);

  if (isNaN(userIdNum)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  // Allow a user to fetch their own profile, or if the requester is a cobrador/admin
  if (req.userId !== userIdNum && req.userRole !== 'cobrador' && req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: You can only view your own profile.' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userIdNum },
      // Exclude password from the returned object for security
      select: {
        id: true,
        nombre: true,
        apellido: true,
        cedula: true,
        fecha_nacimiento: true,
        tipo_comercio: true,
        foto_url: true,
        whatsapp: true,
        role: true,
        email: true,
        fondo_acumulado: true, // Include the new field
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Error fetching user details' });
  }
});

// Get user scoring
router.get('/users/:id/scoring', authenticateToken, async (req: AuthRequest, res) => {
  const { id } = req.params;
  try {
    const riskEvents = await prisma.riskEvent.findMany({
      where: { userId: parseInt(id) },
    });

    const score = riskEvents.reduce((acc: number, event: { score_impact: number }) => acc + event.score_impact, 100);

    res.json({ score });
  } catch (error) {
    res.status(500).json({ error: 'Error getting user scoring' });
  }
});

export default router;
