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
    return res.sendStatus(401); // No token, unauthorized
  }

  jwt.verify(token, JWT_SECRET, async (err: any, user: any) => {
    if (err) {
      return res.sendStatus(403); // Token is invalid or expired
    }

    try {
      // Verify user exists in DB and roles match
      const dbUser = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { id: true, role: true }
      });

      if (!dbUser || dbUser.role !== user.role) {
        return res.sendStatus(403); // User or role mismatch
      }

      req.userId = dbUser.id;
      req.userRole = dbUser.role;
      next();
    } catch (error) {
      console.error('Error fetching user for authentication:', error);
      res.sendStatus(500); // Internal server error
    }
  });
};
