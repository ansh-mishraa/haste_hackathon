const express = require('express');
const { PrismaClient } = require('@prisma/client');
const socketService = require('../services/socketService');
const router = express.Router();

const prisma = new PrismaClient();

// Get all suppliers
router.get('/', async (req, res) => {
  try {
    const { area, category, verified, limit = 20 } = req.query;

    let whereClause = {};

    if (area) {
      whereClause.deliveryAreas = {
        has: area
      };
    }

    if (category) {
      whereClause.productCategories = {
        has: category
      };
    }

    if (verified !== undefined) {
      whereClause.isVerified = verified === 'true';
    }

    const suppliers = await prisma.supplier.findMany({
      where: whereClause,
      select: {
        id: true,
        businessName: true,
        contactPerson: true,
        deliveryAreas: true,
        productCategories: true,
        rating: true,
        totalOrders: true,
        isVerified: true,
        businessAddress: true,
        profilePicture: true,
        createdAt: true
      },
      orderBy: { rating: 'desc' },
      take: parseInt(limit)
    });

    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
});

// Create new supplier
router.post('/', async (req, res) => {
  try {
    const {
      phone,
      businessName,
      businessRegNumber,
      gstNumber,
      contactPerson,
      email,
      deliveryAreas,
      productCategories,
      bankAccount,
      businessAddress,
      latitude,
      longitude
    } = req.body;

    const supplier = await prisma.supplier.create({
      data: {
        phone,
        businessName,
        businessRegNumber,
        gstNumber,
        contactPerson,
        email,
        deliveryAreas,
        productCategories,
        bankAccount,
        businessAddress,
        latitude,
        longitude,
        isVerified: true // Auto-verify for open website
      }
    });

    res.status(201).json(supplier);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Phone number already registered' });
    }
    res.status(500).json({ error: 'Failed to create supplier' });
  }
});

// Get supplier by ID
router.get('/:id', async (req, res) => {
  try {
    const supplier = await prisma.supplier.findUnique({
      where: { id: req.params.id },
      include: {
        orders: {
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
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        bids: {
          include: {
            order: {
              include: {
                vendor: {
                  select: {
                    id: true,
                    name: true,
                    businessType: true
                  }
                },
                group: {
                  select: {
                    id: true,
                    name: true,
                    status: true
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        ratings: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    res.json(supplier);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch supplier' });
  }
});

// Update supplier
router.put('/:id', async (req, res) => {
  try {
    const supplierId = req.params.id;
    const updates = req.body;

    const supplier = await prisma.supplier.update({
      where: { id: supplierId },
      data: updates
    });

    res.json(supplier);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    res.status(500).json({ error: 'Failed to update supplier' });
  }
});

// Get supplier dashboard data
router.get('/:id/dashboard', async (req, res) => {
  try {
    const supplierId = req.params.id;

    // Get today's data
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      pendingBids,
      todaysOrders,
      totalRevenue,
      activeOrders,
      recentRatings
    ] = await Promise.all([
      prisma.bid.findMany({
        where: {
          supplierId,
          status: 'PENDING',
          validUntil: { gt: new Date() }
        },
        include: {
          order: {
            include: {
              vendor: {
                select: {
                  id: true,
                  name: true,
                  businessType: true
                }
              },
              group: {
                select: {
                  id: true,
                  name: true,
                  status: true
                }
              },
              items: {
                include: {
                  product: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.order.findMany({
        where: {
          supplierId,
          createdAt: {
            gte: today,
            lt: tomorrow
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
      }),
      prisma.order.aggregate({
        where: {
          supplierId,
          status: 'DELIVERED'
        },
        _sum: { totalAmount: true }
      }),
      prisma.order.findMany({
        where: {
          supplierId,
          status: {
            in: ['CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP']
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
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.rating.findMany({
        where: { supplierId },
        orderBy: { createdAt: 'desc' },
        take: 5
      })
    ]);

    const dashboardData = {
      pendingBids,
      todaysOrders,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      activeOrders,
      recentRatings,
      stats: {
        pendingBidsCount: pendingBids.length,
        todaysOrdersCount: todaysOrders.length,
        activeOrdersCount: activeOrders.length,
        todaysRevenue: todaysOrders.reduce((sum, order) => sum + order.totalAmount, 0)
      }
    };

    res.json(dashboardData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Create bid for an order
router.post('/bids', async (req, res) => {
  try {
    const {
      orderId,
      supplierId,
      totalAmount,
      message,
      deliveryTime,
      validityHours = 24
    } = req.body;

    // Check if order exists and is biddable
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        group: true
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'PENDING' && (!order.group || order.group.status !== 'CONFIRMED')) {
      return res.status(400).json({ error: 'Order is not accepting bids' });
    }

    // Check if supplier already has a bid for this order
    const existingBid = await prisma.bid.findFirst({
      where: {
        orderId,
        supplierId
      }
    });

    if (existingBid) {
      return res.status(400).json({ error: 'Bid already exists for this order' });
    }

    // Create validity deadline
    const validUntil = new Date();
    validUntil.setHours(validUntil.getHours() + validityHours);

    const bid = await prisma.bid.create({
      data: {
        orderId,
        supplierId,
        totalAmount,
        message,
        deliveryTime: new Date(deliveryTime),
        validUntil
      },
      include: {
        supplier: {
          select: {
            id: true,
            businessName: true,
            contactPerson: true,
            rating: true
          }
        },
        order: {
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
        }
      }
    });

    // Notify vendor about new bid
    if (order.groupId) {
      socketService.notifyGroup(order.groupId, 'new_bid_received', {
        bid,
        orderId,
        supplierName: bid.supplier.businessName
      });
    }

    res.status(201).json(bid);
  } catch (error) {
    console.error('Bid creation error:', error);
    res.status(500).json({ error: 'Failed to create bid' });
  }
});

// Get all bids for supplier
router.get('/:id/bids', async (req, res) => {
  try {
    const supplierId = req.params.id;
    const { status, limit = 20 } = req.query;

    let whereClause = { supplierId };

    if (status) {
      whereClause.status = status;
    }

    const bids = await prisma.bid.findMany({
      where: whereClause,
      include: {
        order: {
          include: {
            vendor: {
              select: {
                id: true,
                name: true,
                businessType: true
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
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    });

    res.json(bids);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bids' });
  }
});

// Update bid status
router.put('/bids/:bidId', async (req, res) => {
  try {
    const bidId = req.params.bidId;
    const { status } = req.body;

    const bid = await prisma.bid.update({
      where: { id: bidId },
      data: { status },
      include: {
        order: {
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
        },
        supplier: {
          select: {
            id: true,
            businessName: true
          }
        }
      }
    });

    // If bid is accepted, update order and reject other bids
    if (status === 'ACCEPTED') {
      // Update order with supplier
      await prisma.order.update({
        where: { id: bid.orderId },
        data: {
          supplierId: bid.supplierId,
          status: 'CONFIRMED'
        }
      });

      // Reject other pending bids for this order
      await prisma.bid.updateMany({
        where: {
          orderId: bid.orderId,
          id: { not: bidId },
          status: 'PENDING'
        },
        data: { status: 'REJECTED' }
      });

      // Update supplier's total orders
      await prisma.supplier.update({
        where: { id: bid.supplierId },
        data: {
          totalOrders: { increment: 1 }
        }
      });

      // Notify group if it's a group order
      if (bid.order.groupId) {
        socketService.notifyGroup(bid.order.groupId, 'bid_accepted', {
          orderId: bid.orderId,
          supplierName: bid.supplier.businessName,
          totalAmount: bid.totalAmount
        });
      }
    }

    res.json(bid);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Bid not found' });
    }
    res.status(500).json({ error: 'Failed to update bid' });
  }
});

// Get available orders for bidding
router.get('/:id/available-orders', async (req, res) => {
  try {
    const supplierId = req.params.id;
    const { area, category } = req.query;

    // Get supplier info to check delivery areas and categories
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
      select: {
        deliveryAreas: true,
        productCategories: true
      }
    });

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    // Find orders that don't have bids from this supplier
    const existingBids = await prisma.bid.findMany({
      where: { supplierId },
      select: { orderId: true }
    });

    const excludedOrderIds = existingBids.map(bid => bid.orderId);

    let whereClause = {
      id: { notIn: excludedOrderIds },
      OR: [
        { status: 'PENDING' },
        {
          group: {
            status: 'CONFIRMED'
          }
        }
      ]
    };

    const availableOrders = await prisma.order.findMany({
      where: whereClause,
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            businessType: true,
            businessLocation: true
          }
        },
        group: {
          select: {
            id: true,
            name: true,
            status: true,
            pickupLocation: true,
            targetPickupTime: true,
            totalValue: true
          }
        },
        items: {
          include: {
            product: true
          }
        },
        bids: {
          select: {
            id: true,
            totalAmount: true,
            supplier: {
              select: {
                businessName: true
              }
            }
          },
          orderBy: { totalAmount: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    // Filter by delivery area and product categories if needed
    let filteredOrders = availableOrders;

    if (area) {
      filteredOrders = filteredOrders.filter(order => 
        supplier.deliveryAreas.includes(area)
      );
    }

    if (category) {
      filteredOrders = filteredOrders.filter(order =>
        order.items.some(item => 
          supplier.productCategories.includes(item.product.category)
        )
      );
    }

    res.json(filteredOrders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch available orders' });
  }
});

// Supplier analytics
router.get('/:id/analytics', async (req, res) => {
  try {
    const supplierId = req.params.id;
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const [
      totalOrders,
      totalRevenue,
      avgRating,
      bidSuccessRate,
      topCategories,
      monthlyTrend
    ] = await Promise.all([
      // Total completed orders
      prisma.order.count({
        where: {
          supplierId,
          status: 'DELIVERED',
          createdAt: { gte: startDate }
        }
      }),
      
      // Total revenue
      prisma.order.aggregate({
        where: {
          supplierId,
          status: 'DELIVERED',
          createdAt: { gte: startDate }
        },
        _sum: { totalAmount: true }
      }),
      
      // Average rating
      prisma.rating.aggregate({
        where: {
          supplierId,
          createdAt: { gte: startDate }
        },
        _avg: { rating: true }
      }),
      
      // Bid success rate
      prisma.bid.groupBy({
        by: ['status'],
        where: {
          supplierId,
          createdAt: { gte: startDate }
        },
        _count: { status: true }
      }),
      
      // Top product categories
      prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
          order: {
            supplierId,
            status: 'DELIVERED',
            createdAt: { gte: startDate }
          }
        },
        _sum: { totalPrice: true },
        orderBy: {
          _sum: { totalPrice: 'desc' }
        },
        take: 10
      }),
      
      // Monthly revenue trend
      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('day', "createdAt") as date,
          COUNT(*) as order_count,
          SUM("totalAmount") as total_revenue
        FROM orders 
        WHERE "supplierId" = ${supplierId} 
          AND "status" = 'DELIVERED'
          AND "createdAt" >= ${startDate}
        GROUP BY DATE_TRUNC('day', "createdAt")
        ORDER BY date ASC
      `
    ]);

    // Calculate bid success rate
    const bidStats = bidSuccessRate.reduce((acc, item) => {
      acc[item.status] = item._count.status;
      return acc;
    }, {});

    const totalBids = Object.values(bidStats).reduce((sum, count) => sum + count, 0);
    const successRate = totalBids > 0 ? ((bidStats.ACCEPTED || 0) / totalBids) * 100 : 0;

    const analytics = {
      summary: {
        totalOrders,
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        avgRating: avgRating._avg.rating || 0,
        bidSuccessRate: successRate,
        totalBids
      },
      bidStats,
      monthlyTrend: monthlyTrend.map(item => ({
        date: item.date,
        orderCount: parseInt(item.order_count),
        totalRevenue: parseFloat(item.total_revenue) || 0
      }))
    };

    res.json(analytics);
  } catch (error) {
    console.error('Supplier analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

module.exports = router; 