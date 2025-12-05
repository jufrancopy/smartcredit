import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Extend the Request interface to include user information
interface AuthRequest extends Request {
  userId?: number;
  userRole?: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret'; // TODO: Move to .env

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  jwt.verify(token, JWT_SECRET, async (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido o expirado' });
    }

    try {
      // Special case for admin from env
      if (user.userId === 1 && user.role === 'admin') {
        req.userId = 1;
        req.userRole = 'admin';
      } else {
        // Verify user exists in DB and roles match
        const dbUser = await prisma.user.findUnique({
          where: { id: user.userId },
          select: { id: true, role: true }
        });

        if (!dbUser || dbUser.role !== user.role) {
          return res.status(403).json({ error: 'Usuario o rol inválido' });
        }

        req.userId = dbUser.id;
        req.userRole = dbUser.role;
      }
      next();
    } catch (error) {
      console.error('Error fetching user for authentication:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });
};
