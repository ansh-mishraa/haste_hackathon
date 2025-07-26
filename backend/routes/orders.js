const express = require('express');
const { prisma } = require('../config/database');
const socketService = require('../services/socketService');
const router = express.Router();

// Get all orders
router.get('/', async (req, res) => {
  try {
    const { vendorId, supplierId, groupId, status, orderType, limit = 20 } = req.query;

    let whereClause = {};

    if (vendorId) whereClause.vendorId = vendorId;
    if (supplierId) whereClause.supplierId = supplierId;
    if (groupId) whereClause.groupId = groupId;
    if (status) whereClause.status = status;
    if (orderType) whereClause.orderType = orderType;

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            businessType: true,
            phone: true
          }
        },
        supplier: {
          select: {
            id: true,
            businessName: true,
            phone: true,
            rating: true
          }
        },
        group: {
          select: {
            id: true,
            name: true,
            status: true,
            pickupLocation: true
          }
        },
        items: {
          include: {
            product: true
          }
        },
        payments: true,
        bids: {
          include: {
            supplier: {
              select: {
                id: true,
                businessName: true,
                rating: true
              }
            }
          },
          orderBy: { totalAmount: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Create new order
router.post('/', async (req, res) => {
  try {
    const {
      vendorId,
      groupId,
      orderType = 'INDIVIDUAL',
      paymentMethod = 'PAY_LATER',
      items,
      notes,
      pickupTime
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Order must have at least one item' });
    }

    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => {
      return sum + (item.quantity * item.pricePerUnit);
    }, 0);

    // Create order with items
    const order = await prisma.order.create({
      data: {
        vendorId,
        groupId,
        orderType,
        totalAmount,
        paymentMethod,
        paymentStatus: 'PENDING', // Just for display, no actual processing
        isGroupOrder: orderType === 'GROUP',
        pickupTime: pickupTime ? new Date(pickupTime) : null,
        notes,
        items: {
          create: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unit: item.unit,
            pricePerUnit: item.pricePerUnit,
            totalPrice: item.quantity * item.pricePerUnit,
            notes: item.notes
          }))
        }
      },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            businessType: true
          }
        },
        items: {
          include: {
            product: true
          }
        }
      }
    });

    // Payment method is just stored in the order for supplier information
    // No actual payment processing needed

    // If it's a group order, notify group members
    if (groupId) {
      socketService.notifyGroup(groupId, 'new_order_added', {
        order,
        vendorName: order.vendor.name
      });
    }

    res.status(201).json(order);
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Get order by ID
router.get('/:id', async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            businessType: true,
            businessLocation: true,
            phone: true,
            trustScore: true
          }
        },
        supplier: {
          select: {
            id: true,
            businessName: true,
            contactPerson: true,
            phone: true,
            email: true,
            rating: true,
            businessAddress: true
          }
        },
        group: {
          include: {
            memberships: {
              include: {
                vendor: {
                  select: {
                    id: true,
                    name: true,
                    businessType: true
                  }
                }
              }
            }
          }
        },
        items: {
          include: {
            product: true
          }
        },
        payments: {
          orderBy: { createdAt: 'desc' }
        },
        bids: {
          include: {
            supplier: {
              select: {
                id: true,
                businessName: true,
                contactPerson: true,
                rating: true,
                deliveryAreas: true
              }
            }
          },
          orderBy: { totalAmount: 'asc' }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Update order status
router.put('/:id/status', async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status, supplierId, deliveredAt } = req.body;

    const updateData = { status };
    
    if (supplierId) updateData.supplierId = supplierId;
    if (deliveredAt) updateData.deliveredAt = new Date(deliveredAt);

    const order = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        vendor: {
          select: {
            id: true,
            name: true
          }
        },
        group: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Notify relevant parties
    if (order.groupId) {
      socketService.notifyGroup(order.groupId, 'order_status_updated', {
        orderId,
        status,
        vendorName: order.vendor.name
      });
    }

    // If order is delivered, update trust score, savings, and complete payments
    if (status === 'DELIVERED') {
      const vendor = await prisma.vendor.findUnique({
        where: { id: order.vendorId }
      });

      if (vendor) {
        // Calculate savings (assume 10% savings for delivered orders)
        const savings = order.totalAmount * 0.1;
        
        await prisma.vendor.update({
          where: { id: order.vendorId },
          data: {
            totalSavings: {
              increment: savings
            },
            trustScore: {
              increment: 2 // Increase trust score for successful orders
            }
          }
        });

        // No payment processing needed - just update order status
        // Payment method is for supplier information only
      }
    }

    res.json(order);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Add items to existing order
router.post('/:id/items', async (req, res) => {
  try {
    const orderId = req.params.id;
    const { items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Must provide at least one item' });
    }

    // Check if order exists and is modifiable
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'PENDING') {
      return res.status(400).json({ error: 'Cannot modify order in current status' });
    }

    // Calculate additional amount
    const additionalAmount = items.reduce((sum, item) => {
      return sum + (item.quantity * item.pricePerUnit);
    }, 0);

    // Add items to order
    const newItems = await Promise.all(
      items.map(item =>
        prisma.orderItem.create({
          data: {
            orderId,
            productId: item.productId,
            quantity: item.quantity,
            unit: item.unit,
            pricePerUnit: item.pricePerUnit,
            totalPrice: item.quantity * item.pricePerUnit,
            notes: item.notes
          },
          include: {
            product: true
          }
        })
      )
    );

    // Update order total
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        totalAmount: {
          increment: additionalAmount
        }
      }
    });

    // No credit processing needed - payment method is just for information

    res.status(201).json({
      items: newItems,
      newTotal: updatedOrder.totalAmount,
      additionalAmount
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add items to order' });
  }
});

// Get order analytics for vendor
router.get('/analytics/:vendorId', async (req, res) => {
  try {
    const vendorId = req.params.vendorId;
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const [
      totalOrders,
      totalSpent,
      totalSavings,
      ordersByStatus,
      topProducts,
      monthlyTrend
    ] = await Promise.all([
      // Total orders count
      prisma.order.count({
        where: {
          vendorId,
          createdAt: { gte: startDate }
        }
      }),
      
      // Total amount spent
      prisma.order.aggregate({
        where: {
          vendorId,
          createdAt: { gte: startDate }
        },
        _sum: { totalAmount: true }
      }),
      
      // Total savings (from vendor record)
      prisma.vendor.findUnique({
        where: { id: vendorId },
        select: { totalSavings: true }
      }),
      
      // Orders by status
      prisma.order.groupBy({
        by: ['status'],
        where: {
          vendorId,
          createdAt: { gte: startDate }
        },
        _count: { status: true }
      }),
      
      // Top products ordered
      prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
          order: {
            vendorId,
            createdAt: { gte: startDate }
          }
        },
        _sum: { quantity: true, totalPrice: true },
        _count: { productId: true },
        orderBy: {
          _sum: { totalPrice: 'desc' }
        },
        take: 10
      }),
      
      // Monthly spending trend
      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('day', "createdAt") as date,
          COUNT(*) as order_count,
          SUM("totalAmount") as total_amount
        FROM orders 
        WHERE "vendorId" = ${vendorId} 
          AND "createdAt" >= ${startDate}
        GROUP BY DATE_TRUNC('day', "createdAt")
        ORDER BY date ASC
      `
    ]);

    // Get product details for top products
    const productIds = topProducts.map(p => p.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } }
    });

    const topProductsWithDetails = topProducts.map(tp => {
      const product = products.find(p => p.id === tp.productId);
      return {
        product,
        totalQuantity: tp._sum.quantity,
        totalSpent: tp._sum.totalPrice,
        orderCount: tp._count.productId
      };
    });

    const analytics = {
      summary: {
        totalOrders,
        totalSpent: totalSpent._sum.totalAmount || 0,
        totalSavings: totalSavings?.totalSavings || 0,
        averageOrderValue: totalOrders > 0 ? (totalSpent._sum.totalAmount || 0) / totalOrders : 0
      },
      ordersByStatus: ordersByStatus.reduce((acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
      }, {}),
      topProducts: topProductsWithDetails,
      monthlyTrend: monthlyTrend.map(item => ({
        date: item.date,
        orderCount: parseInt(item.order_count),
        totalAmount: parseFloat(item.total_amount) || 0
      }))
    };

    res.json(analytics);
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch order analytics' });
  }
});

module.exports = router; 