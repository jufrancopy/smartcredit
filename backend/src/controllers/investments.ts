import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  userId?: number;
  userRole?: string;
}

// Obtener productos con detalle de inventario
export const getProducts = async (req: AuthRequest, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      where: { activo: true },
      include: {
        investments: {
          include: {
            user: { select: { id: true, nombre: true, apellido: true } },
            salesReports: true
          }
        }
      },
      orderBy: { categoria: 'asc' }
    });

    const productsWithDetails = products.map(product => {
      const inventoryDetails = product.investments.map(inv => {
        const vendido = inv.salesReports.reduce((sum, sale) => sum + Number(sale.cantidad_vendida), 0);
        const disponible = Number(inv.cantidad_comprada) - vendido;
        return {
          cliente: `${inv.user.nombre} ${inv.user.apellido}`,
          cantidad_total: inv.cantidad_comprada,
          cantidad_vendida: vendido,
          cantidad_disponible: disponible,
          tipo_pago: inv.tipo_pago,
          pagado: inv.pagado,
          fecha_limite: inv.fecha_limite_pago,
          vencido: inv.fecha_limite_pago && new Date() > inv.fecha_limite_pago && !inv.pagado
        };
      }).filter(detail => detail.cantidad_disponible > 0);

      const totalEnClientes = inventoryDetails.reduce((sum, detail) => sum + detail.cantidad_disponible, 0);

      return {
        ...product,
        ganancia_potencial: product.precio_venta_sugerido - product.precio_compra,
        margen_porcentaje: ((product.precio_venta_sugerido - product.precio_compra) / product.precio_compra * 100).toFixed(1),
        total_en_clientes: totalEnClientes,
        detalle_inventario: inventoryDetails,
        microcreditos_pendientes: inventoryDetails.filter(d => !d.pagado).length
      };
    });

    res.json(productsWithDetails);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
};

// Comprar producto (crear inversión)
export const buyProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { productId, cantidad, tipo_pago, precio_reventa_cliente } = req.body;
    const userId = req.userId!;

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
    if (Number(product.stock_disponible) < parseFloat(cantidad)) return res.status(400).json({ error: 'Stock insuficiente' });

    const montoTotal = product.precio_venta_sugerido * parseFloat(cantidad);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    const esConsignacion = tipo_pago === 'microcredito';
    const fechaLimite = esConsignacion ? new Date(Date.now() + 48 * 60 * 60 * 1000) : null;

    // Para pago directo, verificar fondos
    if (!esConsignacion && (!user || user.fondo_acumulado < montoTotal)) {
      return res.status(400).json({ error: 'Fondos insuficientes' });
    }

    const investment = await prisma.$transaction(async (tx) => {
      const newInvestment = await tx.investment.create({
        data: {
          userId, productId, cantidad_comprada: parseFloat(cantidad),
          precio_unitario: product.precio_venta_sugerido, 
          precio_reventa_cliente: precio_reventa_cliente || product.precio_venta_sugerido,
          monto_total: montoTotal,
          tipo_pago: esConsignacion ? 'microcredito' : 'inmediato',
          fecha_limite_pago: fechaLimite,
          pagado: !esConsignacion // Pago directo = true, consignación = false
        },
        include: { product: true }
      });

      // Descontar fondos solo en pago directo
      if (!esConsignacion) {
        await tx.user.update({
          where: { id: userId },
          data: { fondo_acumulado: { decrement: montoTotal } }
        });
      }

      await tx.product.update({
        where: { id: productId },
        data: { stock_disponible: { decrement: parseFloat(cantidad) } }
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

    // Mostrar todas las inversiones (aprobadas y pendientes)
    const investmentsWithStats = investments.map(investment => {
      const totalVendido = investment.salesReports.reduce((sum, sale) => sum + Number(sale.cantidad_vendida), 0);
      const gananciasGeneradas = investment.salesReports.reduce((sum, sale) => sum + sale.ganancia_generada, 0);
      const cantidadRestante = Number(investment.cantidad_comprada) - totalVendido;
      const saldoPendiente = investment.monto_total - investment.monto_pagado;

      return {
        ...investment,
        cantidad_vendida: totalVendido,
        cantidad_restante: cantidadRestante,
        ganancias_generadas: gananciasGeneradas,
        ganancia_potencial_restante: cantidadRestante * (investment.product.precio_venta_sugerido - investment.precio_unitario),
        saldo_pendiente: saldoPendiente,
        porcentaje_pagado: (investment.monto_pagado / investment.monto_total) * 100,
        esta_aprobado: investment.pagado || (investment.tipo_pago === 'microcredito' && !investment.fecha_limite_pago)
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
    const totalVendido = investment.salesReports.reduce((sum, sale) => sum + Number(sale.cantidad_vendida), 0);
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
      const vendido = inv.salesReports.reduce((salesSum, sale) => salesSum + Number(sale.cantidad_vendida), 0);
      const restante = Number(inv.cantidad_comprada) - vendido;
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

// ADMIN: Crear producto
export const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const { nombre, descripcion, categoria, precio_compra, precio_venta_sugerido, stock_disponible, unidad, cantidad_por_unidad, imagen_url } = req.body;

    const product = await prisma.product.create({
      data: {
        nombre,
        descripcion,
        categoria,
        precio_compra: parseInt(precio_compra),
        precio_venta_sugerido: parseInt(precio_venta_sugerido),
        stock_disponible: parseFloat(stock_disponible),
        unidad,
        cantidad_por_unidad: parseFloat(cantidad_por_unidad),
        imagen_url
      }
    });

    res.json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Error al crear producto' });
  }
};

// ADMIN: Actualizar producto
export const updateProduct = async (req: AuthRequest, res: Response) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const { id } = req.params;
    const { nombre, descripcion, categoria, precio_compra, precio_venta_sugerido, stock_disponible, unidad, cantidad_por_unidad, imagen_url } = req.body;

    const product = await prisma.product.update({
      where: { id: parseInt(id) },
      data: {
        nombre,
        descripcion,
        categoria,
        precio_compra: parseInt(precio_compra),
        precio_venta_sugerido: parseInt(precio_venta_sugerido),
        stock_disponible: parseFloat(stock_disponible),
        unidad,
        cantidad_por_unidad: parseFloat(cantidad_por_unidad),
        imagen_url
      }
    });

    res.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
};

// ADMIN: Actualizar stock
export const updateStock = async (req: AuthRequest, res: Response) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const { id } = req.params;
    const { stock_disponible } = req.body;

    const product = await prisma.product.update({
      where: { id: parseInt(id) },
      data: { stock_disponible }
    });

    res.json(product);
  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({ error: 'Error al actualizar stock' });
  }
};

// PÚBLICO: Obtener productos de un cliente
export const getClientProducts = async (req: Request, res: Response) => {
  try {
    const { clienteSlug } = req.params;

    // Obtener cliente por slug
    const client = await prisma.user.findUnique({
      where: { tienda_slug: clienteSlug },
      select: { id: true, nombre: true, apellido: true, whatsapp: true, tienda_nombre: true, tienda_activa: true }
    });

    if (!client || !client.tienda_activa) {
      return res.status(404).json({ error: 'Tienda no encontrada o inactiva' });
    }

    if (!client) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    // Obtener inversiones activas del cliente con productos SmartCredit 
    // (pagadas completamente O aprobadas con saldo pendiente)
    const investments = await prisma.investment.findMany({
      where: { 
        userId: client.id,
        estado: { in: ['activo', 'vendido_parcial'] },
        OR: [
          { pagado: true }, // Productos pagados completamente
          { 
            AND: [
              { tipo_pago: 'microcredito' }, // Consignaciones
              { pagado: false }, // Con saldo pendiente
              { fecha_limite_pago: null } // null = aprobada por cobrador
            ]
          }
        ]
      },
      include: {
        product: true,
        salesReports: true
      }
    });

    // Productos de SmartCredit disponibles
    const smartCreditProducts = investments.map(investment => {
      const totalVendido = investment.salesReports.reduce((sum, sale) => sum + Number(sale.cantidad_vendida), 0);
      const cantidadDisponible = Number(investment.cantidad_comprada) - totalVendido;
      
      return {
        ...investment.product,
        cantidad_disponible: cantidadDisponible,
        precio_cliente: investment.precio_reventa_cliente || investment.product.precio_venta_sugerido,
        investment_id: investment.id,
        tipo: 'smartcredit'
      };
    }).filter(product => product.cantidad_disponible > 0);

    // Productos propios del cliente
    const clientProducts = await prisma.clientProduct.findMany({
      where: { userId: client.id, activo: true, stock: { gt: 0 } }
    });

    const clientOwnProducts = clientProducts.map(product => ({
      ...product,
      cantidad_disponible: product.stock,
      precio_cliente: product.precio,
      tipo: 'propio'
    }));

    // Combinar ambos tipos de productos
    const allProducts = [...smartCreditProducts, ...clientOwnProducts];

    res.json({ client, products: allProducts });
  } catch (error) {
    console.error('Error fetching client products:', error);
    res.status(500).json({ error: 'Error al obtener productos del cliente' });
  }
};

// COBRADOR: Monitorear tiendas de sus clientes
export const getCollectorStores = async (req: AuthRequest, res: Response) => {
  try {
    if (req.userRole !== 'cobrador' && req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    // Obtener clientes con tiendas activas
    const clients = await prisma.user.findMany({
      where: {
        role: 'deudor',
        tienda_activa: true
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        tienda_slug: true,
        tienda_nombre: true,
        investments: {
          include: {
            product: true,
            salesReports: {
              orderBy: { createdAt: 'desc' },
              take: 5
            }
          }
        }
      }
    });

    // Calcular estadísticas por tienda
    const storesData = clients.map(client => {
      const totalInvestments = client.investments.length;
      
      // Calcular ventas totales
      const allSalesReports = client.investments.flatMap(inv => inv.salesReports);
      const totalSales = allSalesReports.reduce((sum, sale) => sum + Number(sale.monto_total_venta), 0);
      
      // Obtener ventas recientes ordenadas por fecha
      const recentSales = allSalesReports
        .sort((a, b) => new Date(b.fecha_venta || b.createdAt || 0).getTime() - new Date(a.fecha_venta || a.createdAt || 0).getTime())
        .slice(0, 3);

      return {
        cliente: {
          id: client.id,
          nombre: `${client.nombre} ${client.apellido}`,
          tienda_slug: client.tienda_slug,
          tienda_nombre: client.tienda_nombre
        },
        estadisticas: {
          total_inversiones: totalInvestments,
          total_ventas: totalSales,
          ventas_recientes: recentSales.length
        },
        ventas_recientes: recentSales
      };
    });

    res.json(storesData);
  } catch (error) {
    console.error('Error fetching collector stores:', error);
    res.status(500).json({ error: 'Error al obtener tiendas' });
  }
};

// CLIENTE: Configurar tienda
export const configureStore = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { tienda_nombre, tienda_slug } = req.body;

    // Verificar que el slug no esté en uso
    if (tienda_slug) {
      const existingStore = await prisma.user.findFirst({
        where: {
          tienda_slug,
          id: { not: userId }
        }
      });

      if (existingStore) {
        return res.status(400).json({ error: 'Este enlace ya está en uso' });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        tienda_nombre: tienda_nombre || null,
        tienda_slug: tienda_slug || null,
        tienda_activa: !!(tienda_nombre && tienda_slug)
      }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Error configuring store:', error);
    res.status(500).json({ error: 'Error al configurar tienda' });
  }
};

// Pagar microcrédito (parcial o total)
export const payMicrocredit = async (req: AuthRequest, res: Response) => {
  try {
    console.log('PayMicrocredit - Body:', req.body);
    console.log('PayMicrocredit - File:', req.file);
    
    const { investmentId, monto } = req.body;
    const userId = req.userId!;
    const comprobante = req.file;

    if (!investmentId) {
      return res.status(400).json({ error: 'Investment ID requerido' });
    }

    if (!monto) {
      return res.status(400).json({ error: 'Monto requerido' });
    }

    if (!comprobante) {
      return res.status(400).json({ error: 'Comprobante de transferencia requerido' });
    }

    const investment = await prisma.investment.findFirst({
      where: { id: parseInt(investmentId), userId, tipo_pago: 'microcredito' }
    });

    if (!investment) {
      return res.status(404).json({ error: 'Microcrédito no encontrado' });
    }

    const saldoPendiente = investment.monto_total - investment.monto_pagado;
    const montoPagar = parseFloat(monto);

    if (isNaN(montoPagar) || montoPagar <= 0) {
      return res.status(400).json({ error: 'Monto inválido' });
    }

    if (montoPagar > saldoPendiente) {
      return res.status(400).json({ error: 'Monto excede la deuda pendiente' });
    }

    const nuevoMontoPagado = investment.monto_pagado + montoPagar;
    const esPagoCompleto = nuevoMontoPagado >= investment.monto_total;
    const comprobanteUrl = `/uploads/receipts/${comprobante.filename}`;

    await prisma.$transaction(async (tx) => {
      // Actualizar inversión
      await tx.investment.update({
        where: { id: parseInt(investmentId) },
        data: { 
          monto_pagado: nuevoMontoPagado,
          pagado: esPagoCompleto,
          comprobante_pago: comprobanteUrl,
          estado: esPagoCompleto ? 'vendido_completo' : investment.estado
        }
      });

      // Si pago completo, crear reporte de venta automático
      if (esPagoCompleto) {
        const precioVenta = investment.precio_reventa_cliente || investment.precio_unitario;
        const montoTotalVenta = Number(investment.cantidad_comprada) * precioVenta;
        const gananciaGenerada = montoTotalVenta - investment.monto_total;

        await tx.salesReport.create({
          data: {
            userId,
            investmentId: parseInt(investmentId),
            cantidad_vendida: investment.cantidad_comprada,
            precio_venta: precioVenta,
            monto_total_venta: montoTotalVenta,
            ganancia_generada: gananciaGenerada,
            fecha_venta: new Date(),
            verificado: true // Auto-verificado por pago completo
          }
        });

        // Agregar ganancia al fondo del usuario
        await tx.user.update({
          where: { id: userId },
          data: {
            fondo_acumulado: { increment: gananciaGenerada }
          }
        });
      }
    });

    res.json({ 
      message: esPagoCompleto ? 'Microcrédito pagado completamente' : 'Pago parcial registrado',
      saldo_restante: investment.monto_total - nuevoMontoPagado
    });
  } catch (error) {
    console.error('Error paying microcredit:', error);
    res.status(500).json({ 
      error: 'Error al pagar microcrédito',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

// ADMIN/COBRADOR: Obtener consignaciones pendientes (no aprobadas aún)
export const getPendingConsignments = async (req: AuthRequest, res: Response) => {
  try {
    if (req.userRole !== 'admin' && req.userRole !== 'cobrador') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const pendingInvestments = await prisma.investment.findMany({
      where: { 
        pagado: false,
        tipo_pago: 'microcredito',
        fecha_limite_pago: { not: null } // Tiene fecha límite = pendiente de aprobación
      },
      include: {
        user: { select: { id: true, nombre: true, apellido: true, whatsapp: true } },
        product: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(pendingInvestments);
  } catch (error) {
    console.error('Error fetching pending consignments:', error);
    res.status(500).json({ error: 'Error al obtener consignaciones pendientes' });
  }
};

// ADMIN/COBRADOR: Obtener consignaciones aprobadas (pagadas y no pagadas)
export const getApprovedConsignments = async (req: AuthRequest, res: Response) => {
  try {
    if (req.userRole !== 'admin' && req.userRole !== 'cobrador') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const approvedInvestments = await prisma.investment.findMany({
      where: { 
        tipo_pago: 'microcredito',
        fecha_limite_pago: null, // Aprobadas
        estado: { in: ['activo', 'vendido_parcial'] }
      },
      include: {
        user: { select: { id: true, nombre: true, apellido: true, whatsapp: true } },
        product: true,
        salesReports: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(approvedInvestments);
  } catch (error) {
    console.error('Error fetching approved consignments:', error);
    res.status(500).json({ error: 'Error al obtener consignaciones aprobadas' });
  }
};

// ADMIN/COBRADOR: Obtener compras pagadas con fondo
export const getPaidPurchases = async (req: AuthRequest, res: Response) => {
  try {
    if (req.userRole !== 'admin' && req.userRole !== 'cobrador') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const paidPurchases = await prisma.investment.findMany({
      where: { 
        tipo_pago: 'inmediato',
        pagado: true,
        estado: { in: ['activo', 'vendido_parcial'] }
      },
      include: {
        user: { select: { id: true, nombre: true, apellido: true, whatsapp: true } },
        product: true,
        salesReports: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(paidPurchases);
  } catch (error) {
    console.error('Error fetching paid purchases:', error);
    res.status(500).json({ error: 'Error al obtener compras pagadas' });
  }
};

// ADMIN/COBRADOR: Aprobar consignación
export const approveConsignment = async (req: AuthRequest, res: Response) => {
  try {
    if (req.userRole !== 'admin' && req.userRole !== 'cobrador') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const { investmentId } = req.body;

    // Aprobar consignación: quitar fecha_limite_pago para indicar que está aprobada
    const updatedInvestment = await prisma.investment.update({
      where: { id: investmentId },
      data: { 
        fecha_limite_pago: null // null = aprobada, con fecha = pendiente
        // pagado sigue siendo false hasta que cliente pague
      }
    });

    res.json({ message: 'Consignación aprobada', investment: updatedInvestment });
  } catch (error) {
    console.error('Error approving consignment:', error);
    res.status(500).json({ error: 'Error al aprobar consignación' });
  }
};

// ADMIN/COBRADOR: Rechazar consignación
export const rejectConsignment = async (req: AuthRequest, res: Response) => {
  try {
    if (req.userRole !== 'admin' && req.userRole !== 'cobrador') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const { investmentId } = req.body;

    await prisma.$transaction(async (tx) => {
      const investment = await tx.investment.findUnique({
        where: { id: investmentId },
        include: { product: true }
      });

      if (!investment) {
        throw new Error('Inversión no encontrada');
      }

      // Devolver stock al producto
      await tx.product.update({
        where: { id: investment.productId },
        data: { stock_disponible: { increment: investment.cantidad_comprada } }
      });

      // Eliminar la inversión
      await tx.investment.delete({
        where: { id: investmentId }
      });
    });

    res.json({ message: 'Consignación rechazada y stock restaurado' });
  } catch (error) {
    console.error('Error rejecting consignment:', error);
    res.status(500).json({ error: 'Error al rechazar consignación' });
  }
};

// ADMIN: Eliminar producto
export const deleteProduct = async (req: AuthRequest, res: Response) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const { id } = req.params;

    // Obtener producto para eliminar imagen
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) }
    });

    if (product?.imagen_url) {
      // Eliminar imagen del servidor
      const { deleteProductImage } = require('../controllers/upload');
      deleteProductImage(product.imagen_url);
    }

    await prisma.product.update({
      where: { id: parseInt(id) },
      data: { activo: false }
    });

    res.json({ message: 'Producto eliminado' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
};

// Actualizar precio de reventa de inversión
export const updateInvestmentPrice = async (req: AuthRequest, res: Response) => {
  try {
    const { investmentId, nuevoPrecio } = req.body;
    const userId = req.userId!;

    // Verificar que la inversión pertenece al usuario
    const investment = await prisma.investment.findFirst({
      where: { id: investmentId, userId }
    });

    if (!investment) {
      return res.status(404).json({ error: 'Inversión no encontrada' });
    }

    // Actualizar precio de reventa
    const updatedInvestment = await prisma.investment.update({
      where: { id: investmentId },
      data: { precio_reventa_cliente: nuevoPrecio }
    });

    res.json({ message: 'Precio actualizado exitosamente', investment: updatedInvestment });
  } catch (error) {
    console.error('Error updating investment price:', error);
    res.status(500).json({ error: 'Error al actualizar precio' });
  }
};

// ADMIN/COBRADOR: Cancelar compra
export const cancelInvestment = async (req: AuthRequest, res: Response) => {
  try {
    if (req.userRole !== 'admin' && req.userRole !== 'cobrador') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const { investmentId } = req.body;

    await prisma.$transaction(async (tx) => {
      const investment = await tx.investment.findUnique({
        where: { id: investmentId },
        include: { user: true, product: true }
      });

      if (!investment) {
        throw new Error('Inversión no encontrada');
      }

      // Restaurar stock del producto
      await tx.product.update({
        where: { id: investment.productId },
        data: { stock_disponible: { increment: investment.cantidad_comprada } }
      });

      // Devolver fondos si fue pago inmediato
      if (investment.tipo_pago === 'inmediato' || investment.monto_pagado > 0) {
        await tx.user.update({
          where: { id: investment.userId },
          data: { fondo_acumulado: { increment: investment.monto_pagado } }
        });
      }

      // Eliminar la inversión
      await tx.investment.delete({
        where: { id: investmentId }
      });
    });

    res.json({ message: 'Compra cancelada exitosamente' });
  } catch (error) {
    console.error('Error canceling investment:', error);
    res.status(500).json({ error: 'Error al cancelar compra' });
  }
};

// ADMIN/COBRADOR: Obtener historial de pagos de productos
export const getProductPayments = async (req: AuthRequest, res: Response) => {
  try {
    if (req.userRole !== 'admin' && req.userRole !== 'cobrador') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const productPayments = await prisma.investment.findMany({
      where: {
        tipo_pago: 'microcredito',
        monto_pagado: { gt: 0 },
        comprobante_pago: { not: null }
      },
      include: {
        user: { select: { id: true, nombre: true, apellido: true } },
        product: { select: { nombre: true, unidad: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });

    const formattedPayments = productPayments.map(investment => ({
      id: investment.id,
      investmentId: investment.id,
      cliente: `${investment.user.nombre} ${investment.user.apellido}`,
      producto: investment.product.nombre,
      monto_pagado: investment.monto_pagado,
      monto_total: investment.monto_total,
      cantidad: investment.cantidad_comprada,
      unidad: investment.product.unidad,
      comprobante_url: investment.comprobante_pago,
      fecha_pago: investment.updatedAt,
      pagado_completo: investment.pagado
    }));

    res.json(formattedPayments);
  } catch (error) {
    console.error('Error fetching product payments:', error);
    res.status(500).json({ error: 'Error al obtener pagos de productos' });
  }
};

// ADMIN: Corregir precios de inversiones existentes
export const fixInvestmentPrices = async (req: AuthRequest, res: Response) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Obtener inversiones que necesitan corrección
      const investments = await tx.investment.findMany({
        include: { product: true }
      });

      let corrected = 0;
      
      for (const investment of investments) {
        // Si el precio_unitario es igual al precio_compra del producto, corregir
        if (investment.precio_unitario === investment.product.precio_compra) {
          const newPrecioUnitario = investment.product.precio_venta_sugerido;
          const newMontoTotal = Number(investment.cantidad_comprada) * newPrecioUnitario;
          
          await tx.investment.update({
            where: { id: investment.id },
            data: {
              precio_unitario: newPrecioUnitario,
              monto_total: newMontoTotal
            }
          });
          
          corrected++;
        }
      }
      
      return corrected;
    });

    res.json({ 
      message: `Se corrigieron ${result} inversiones`,
      corrected: result
    });
  } catch (error) {
    console.error('Error fixing investment prices:', error);
    res.status(500).json({ error: 'Error al corregir precios' });
  }
};

// Solicitar restock de producto agotado
export const requestRestock = async (req: AuthRequest, res: Response) => {
  try {
    const { productId } = req.body;
    const userId = req.userId!;

    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Verificar si ya existe una solicitud pendiente
    const existingRequest = await prisma.restockRequest.findFirst({
      where: {
        userId,
        productId,
        estado: 'pendiente'
      }
    });

    if (existingRequest) {
      return res.status(400).json({ error: 'Ya tienes una solicitud pendiente para este producto' });
    }

    // Crear solicitud de restock
    const restockRequest = await prisma.restockRequest.create({
      data: {
        userId,
        productId,
        estado: 'pendiente'
      }
    });

    res.json({ message: 'Solicitud de restock enviada exitosamente' });
  } catch (error) {
    console.error('Error al solicitar restock:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ADMIN/COBRADOR: Obtener solicitudes de restock
export const getRestockRequests = async (req: AuthRequest, res: Response) => {
  try {
    if (req.userRole !== 'admin' && req.userRole !== 'cobrador') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const requests = await prisma.restockRequest.findMany({
      where: { estado: 'pendiente' },
      include: {
        user: { select: { id: true, nombre: true, apellido: true, whatsapp: true } },
        product: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(requests);
  } catch (error) {
    console.error('Error al obtener solicitudes de restock:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};