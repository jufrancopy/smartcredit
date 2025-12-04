import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  userId?: number;
  userRole?: string;
}

// Obtener todos los productos disponibles (MiniTienda)
export const getProducts = async (req: AuthRequest, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      where: { activo: true },
      orderBy: { categoria: 'asc' },
    });

    const productsWithProfitability = products.map(product => ({
      ...product,
      ganancia_potencial: product.precio_venta_sugerido - product.precio_compra,
      margen_porcentaje: ((product.precio_venta_sugerido - product.precio_compra) / product.precio_compra * 100).toFixed(1)
    }));

    res.json(productsWithProfitability);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
};

// Comprar producto (crear inversión)
export const buyProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { productId, cantidad } = req.body;
    const userId = req.userId!;

    // Verificar que el producto existe y tiene stock
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    if (product.stock_disponible < cantidad) {
      return res.status(400).json({ error: 'Stock insuficiente' });
    }

    const montoTotal = product.precio_compra * cantidad;

    // Verificar que el usuario tiene fondos suficientes
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.fondo_acumulado < montoTotal) {
      return res.status(400).json({ error: 'Fondos insuficientes' });
    }

    // Crear la inversión y actualizar fondos
    const investment = await prisma.$transaction(async (tx) => {
      // Crear inversión
      const newInvestment = await tx.investment.create({
        data: {
          userId,
          productId,
          cantidad_comprada: cantidad,
          precio_unitario: product.precio_compra,
          monto_total: montoTotal,
        },
        include: {
          product: true,
        }
      });

      // Descontar del fondo del usuario
      await tx.user.update({
        where: { id: userId },
        data: {
          fondo_acumulado: { decrement: montoTotal }
        }
      });

      // Reducir stock del producto
      await tx.product.update({
        where: { id: productId },
        data: {
          stock_disponible: { decrement: cantidad }
        }
      });

      return newInvestment;
    });

    res.json(investment);
  } catch (error) {
    console.error('Error buying product:', error);
    res.status(500).json({ error: 'Error al comprar producto' });
  }
};

// Obtener inversiones del usuario
export const getUserInvestments = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const investments = await prisma.investment.findMany({
      where: { userId },
      include: {
        product: true,
        salesReports: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    const investmentsWithStats = investments.map(investment => {
      const totalVendido = investment.salesReports.reduce((sum, sale) => sum + sale.cantidad_vendida, 0);
      const gananciasGeneradas = investment.salesReports.reduce((sum, sale) => sum + sale.ganancia_generada, 0);
      const cantidadRestante = investment.cantidad_comprada - totalVendido;

      return {
        ...investment,
        cantidad_vendida: totalVendido,
        cantidad_restante: cantidadRestante,
        ganancias_generadas: gananciasGeneradas,
        ganancia_potencial_restante: cantidadRestante * (investment.product.precio_venta_sugerido - investment.precio_unitario)
      };
    });

    res.json(investmentsWithStats);
  } catch (error) {
    console.error('Error fetching user investments:', error);
    res.status(500).json({ error: 'Error al obtener inversiones' });
  }
};

// Reportar venta
export const reportSale = async (req: AuthRequest, res: Response) => {
  try {
    const { investmentId, cantidad_vendida, precio_venta, fecha_venta } = req.body;
    const userId = req.userId!;

    // Verificar que la inversión pertenece al usuario
    const investment = await prisma.investment.findFirst({
      where: { id: investmentId, userId },
      include: { salesReports: true }
    });

    if (!investment) {
      return res.status(404).json({ error: 'Inversión no encontrada' });
    }

    // Verificar que no venda más de lo que compró
    const totalVendido = investment.salesReports.reduce((sum, sale) => sum + sale.cantidad_vendida, 0);
    if (totalVendido + cantidad_vendida > investment.cantidad_comprada) {
      return res.status(400).json({ error: 'No puedes vender más de lo que compraste' });
    }

    const montoTotalVenta = cantidad_vendida * precio_venta;
    const costoOriginal = cantidad_vendida * investment.precio_unitario;
    const gananciaGenerada = montoTotalVenta - costoOriginal;

    // Crear reporte de venta y actualizar fondo
    const saleReport = await prisma.$transaction(async (tx) => {
      // Crear reporte de venta
      const newSaleReport = await tx.salesReport.create({
        data: {
          userId,
          investmentId,
          cantidad_vendida,
          precio_venta,
          monto_total_venta: montoTotalVenta,
          ganancia_generada: gananciaGenerada,
          fecha_venta: new Date(fecha_venta),
        }
      });

      // Agregar ganancia al fondo del usuario
      await tx.user.update({
        where: { id: userId },
        data: {
          fondo_acumulado: { increment: gananciaGenerada }
        }
      });

      // Actualizar estado de la inversión si se vendió todo
      const nuevoTotalVendido = totalVendido + cantidad_vendida;
      if (nuevoTotalVendido >= investment.cantidad_comprada) {
        await tx.investment.update({
          where: { id: investmentId },
          data: { estado: 'vendido_completo' }
        });
      } else if (nuevoTotalVendido > 0) {
        await tx.investment.update({
          where: { id: investmentId },
          data: { estado: 'vendido_parcial' }
        });
      }

      return newSaleReport;
    });

    res.json(saleReport);
  } catch (error) {
    console.error('Error reporting sale:', error);
    res.status(500).json({ error: 'Error al reportar venta' });
  }
};

// Dashboard de inversiones del usuario
export const getInvestmentDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    // Obtener usuario con fondo actual
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    // Obtener estadísticas de inversiones
    const investments = await prisma.investment.findMany({
      where: { userId },
      include: {
        product: true,
        salesReports: true,
      }
    });

    const totalInvertido = investments.reduce((sum, inv) => sum + inv.monto_total, 0);
    const totalGanancias = investments.reduce((sum, inv) => 
      sum + inv.salesReports.reduce((salesSum, sale) => salesSum + sale.ganancia_generada, 0), 0
    );

    const inversionesActivas = investments.filter(inv => inv.estado === 'activo' || inv.estado === 'vendido_parcial').length;
    
    // Calcular ganancia potencial de productos no vendidos
    const gananciaPotencial = investments.reduce((sum, inv) => {
      const vendido = inv.salesReports.reduce((salesSum, sale) => salesSum + sale.cantidad_vendida, 0);
      const restante = inv.cantidad_comprada - vendido;
      const gananciaUnitaria = inv.product.precio_venta_sugerido - inv.precio_unitario;
      return sum + (restante * gananciaUnitaria);
    }, 0);

    const dashboard = {
      fondo_disponible: user?.fondo_acumulado || 0,
      total_invertido: totalInvertido,
      total_ganancias: totalGanancias,
      inversiones_activas: inversionesActivas,
      ganancia_potencial: gananciaPotencial,
      roi_porcentaje: totalInvertido > 0 ? ((totalGanancias / totalInvertido) * 100).toFixed(1) : '0'
    };

    res.json(dashboard);
  } catch (error) {
    console.error('Error fetching investment dashboard:', error);
    res.status(500).json({ error: 'Error al obtener dashboard de inversiones' });
  }
};