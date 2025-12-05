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
import uploadRoutes from './routes/upload';
import clientProductRoutes from './routes/clientProducts';
import loanRenewalRoutes from './routes/loanRenewal';
import path from 'path';

const app = express();
dotenv.config(); // Load environment variables
const prisma = new PrismaClient();

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  exposedHeaders: ['Content-Disposition']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));


app.use('/api', userRoutes);
app.use('/api', loanRoutes);
app.use('/api', paymentRoutes);
app.use('/api', authRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/investments', investmentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/client-products', clientProductRoutes);
app.use('/api/loan-renewal', loanRenewalRoutes);

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
