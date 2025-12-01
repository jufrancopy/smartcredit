console.log('Starting backend server...');
import express from 'express';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import userRoutes from './routes/users';
import loanRoutes from './routes/loans';
import paymentRoutes from './routes/payments';
import authRoutes from './routes/auth';
import path from 'path';

const app = express();
dotenv.config(); // Load environment variables
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

const uploadsPath = path.join(__dirname, '..', 'uploads');
console.log(`Serving static files from: ${uploadsPath}`);
app.use('/uploads', express.static(uploadsPath));

app.use('/api', userRoutes);
app.use('/api', loanRoutes);
app.use('/api', paymentRoutes);
app.use('/api', authRoutes);

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
