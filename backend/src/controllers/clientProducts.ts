import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  userId?: number;
  userRole?: string;
}

// Obtener productos del cliente
export const getClientProducts = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const products = await prisma.clientProduct.findMany({
      where: { userId, activo: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json(products);
  } catch (error) {
    console.error('Error fetching client products:', error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
};

// Crear producto del cliente
export const createClientProduct = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { nombre, descripcion, categoria, precio, stock, imagen_url } = req.body;

    const product = await prisma.clientProduct.create({
      data: {
        userId,
        nombre,
        descripcion,
        categoria,
        precio: parseFloat(precio),
        stock: parseInt(stock),
        imagen_url
      }
    });

    res.json(product);
  } catch (error) {
    console.error('Error creating client product:', error);
    res.status(500).json({ error: 'Error al crear producto' });
  }
};

// Actualizar producto del cliente
export const updateClientProduct = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { nombre, descripcion, categoria, precio, stock, imagen_url } = req.body;

    const product = await prisma.clientProduct.update({
      where: { id: parseInt(id), userId },
      data: {
        nombre,
        descripcion,
        categoria,
        precio: parseFloat(precio),
        stock: parseInt(stock),
        imagen_url
      }
    });

    res.json(product);
  } catch (error) {
    console.error('Error updating client product:', error);
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
};

// Eliminar producto del cliente
export const deleteClientProduct = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    await prisma.clientProduct.update({
      where: { id: parseInt(id), userId },
      data: { activo: false }
    });

    res.json({ message: 'Producto eliminado' });
  } catch (error) {
    console.error('Error deleting client product:', error);
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
};

// Obtener categorías existentes
export const getCategories = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    // Obtener categorías de productos SmartCredit
    const smartCreditCategories = await prisma.product.findMany({
      where: { activo: true },
      select: { categoria: true },
      distinct: ['categoria']
    });

    // Obtener categorías de productos del cliente
    const clientCategories = await prisma.clientProduct.findMany({
      where: { userId, activo: true },
      select: { categoria: true },
      distinct: ['categoria']
    });

    // Combinar y eliminar duplicados
    const allCategories = [...new Set([
      ...smartCreditCategories.map(p => p.categoria),
      ...clientCategories.map(p => p.categoria)
    ])].sort();

    res.json(allCategories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
};