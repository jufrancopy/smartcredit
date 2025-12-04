import express from 'express';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import userRoutes from './routes/users';
import loanRoutes from './routes/loans';
import paymentRoutes from './routes/payments';
import authRoutes from './routes/auth';
import pdfRoutes from './routes/pdf';
import investmentRoutes from './routes/investments';
import path from 'path';

const app = express();
dotenv.config(); // Load environment variables
const prisma = new PrismaClient();

app.use(cors({
  exposedHeaders: ['Content-Disposition']
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));


app.use('/api', userRoutes);
app.use('/api', loanRoutes);
app.use('/api', paymentRoutes);
app.use('/api', authRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/investments', investmentRoutes);

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
