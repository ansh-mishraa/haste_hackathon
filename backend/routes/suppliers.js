const express = require('express');
const { prisma } = require('../config/database');
const socketService = require('../services/socketService');
const router = express.Router();

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

    // Convert latitude/longitude to proper types
    const processedLatitude = latitude && latitude !== '' ? parseFloat(latitude) : null;
    const processedLongitude = longitude && longitude !== '' ? parseFloat(longitude) : null;

    const supplier = await prisma.supplier.create({
      data: {
        phone,
        businessName,
        businessRegNumber: businessRegNumber || null,
        gstNumber: gstNumber || null,
        contactPerson,
        email: email || null,
        deliveryAreas,
        productCategories,
        bankAccount,
        businessAddress,
        latitude: processedLatitude,
        longitude: processedLongitude,
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

// Get supplier by phone number (for login) - MUST come before /:id route
router.get('/by-phone/:phone', async (req, res) => {
  try {
    const { phone } = req.params;
    console.log('🔍 Searching for supplier with phone:', phone);
    
    // First, let's check if there are any suppliers in the database
    const supplierCount = await prisma.supplier.count();
    console.log('📊 Total suppliers in database:', supplierCount);
    
    // If there are suppliers, let's see a sample of phone numbers
    if (supplierCount > 0) {
      const sampleSuppliers = await prisma.supplier.findMany({
        take: 3,
        select: { phone: true, businessName: true }
      });
      console.log('📱 Sample supplier phone numbers in database:', sampleSuppliers);
    }
    
    const supplier = await prisma.supplier.findUnique({
      where: { phone },
      select: {
        id: true,
        businessName: true,
        phone: true,
        contactPerson: true,
        email: true,
        deliveryAreas: true,
        productCategories: true,
        businessAddress: true,
        isVerified: true,
        rating: true
      }
    });

    console.log('🔎 Query result for phone', phone, ':', supplier ? 'FOUND' : 'NOT FOUND');

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found with this phone number' });
    }

    res.json(supplier);
  } catch (error) {
    console.error('❌ Error finding supplier by phone:', error);
    res.status(500).json({ error: 'Failed to find supplier' });
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
    const updates = { ...req.body };

    // Process latitude/longitude if they exist in updates
    if ('latitude' in updates) {
      updates.latitude = updates.latitude && updates.latitude !== '' ? parseFloat(updates.latitude) : null;
    }
    if ('longitude' in updates) {
      updates.longitude = updates.longitude && updates.longitude !== '' ? parseFloat(updates.longitude) : null;
    }

    // Process other optional fields
    if ('businessRegNumber' in updates && !updates.businessRegNumber) {
      updates.businessRegNumber = null;
    }
    if ('gstNumber' in updates && !updates.gstNumber) {
      updates.gstNumber = null;
    }
    if ('email' in updates && !updates.email) {
      updates.email = null;
    }

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

// Helper function to handle group bids
async function handleGroupBid(req, res) {
  try {
    const {
      orderId,
      supplierId,
      totalAmount,
      message,
      deliveryTime,
      validityHours = 24
    } = req.body;

    // Extract groupId from orderId (format: "group_{groupId}")
    const groupId = orderId.replace('group_', '');

    // Check if group exists and is confirmed
    const group = await prisma.buyingGroup.findUnique({
      where: { id: groupId },
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
          }
        }
      }
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (group.status !== 'CONFIRMED') {
      return res.status(400).json({ error: 'Group is not accepting bids' });
    }

    // Check if supplier already has a group bid
    const existingGroupBid = await prisma.bid.findFirst({
      where: {
        supplierId,
        order: {
          groupId: groupId
        }
      }
    });

    if (existingGroupBid) {
      return res.status(400).json({ error: 'Bid already exists for this group' });
    }

    // Create validity deadline
    const validUntil = new Date();
    validUntil.setHours(validUntil.getHours() + validityHours);

    // Create a bid for the first order in the group (representative bid)
    const firstOrder = group.orders[0];
    if (!firstOrder) {
      return res.status(400).json({ error: 'No orders found in group' });
    }

    const bid = await prisma.bid.create({
      data: {
        orderId: firstOrder.id,
        supplierId,
        totalAmount,
        message: message || `Group bid for ${group.name || 'group'} with ${group.orders.length} members`,
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

    // Notify all group members about the new bid
    socketService.notifyGroup(groupId, 'new_group_bid_received', {
      bid,
      groupId,
      supplierName: bid.supplier.businessName,
      memberCount: group.orders.length
    });

    res.status(201).json(bid);
  } catch (error) {
    console.error('Group bid creation error:', error);
    res.status(500).json({ error: 'Failed to create group bid' });
  }
}

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

    // Check if this is a group bid (orderId starts with "group_")
    if (orderId.startsWith('group_')) {
      return await handleGroupBid(req, res);
    }

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

    // Separate group orders from individual orders
    const groupOrders = {};
    const individualOrders = [];

    filteredOrders.forEach(order => {
      if (order.group && order.group.status === 'CONFIRMED') {
        const groupId = order.group.id;
        if (!groupOrders[groupId]) {
          groupOrders[groupId] = {
            id: `group_${groupId}`,
            type: 'GROUP',
            groupId: groupId,
            group: order.group,
            totalAmount: 0,
            consolidatedItems: {},
            memberCount: 0,
            orders: [],
            paymentMethods: new Set(),
            earliestCreatedAt: order.createdAt
          };
        }
        
        // Add this order to the group
        groupOrders[groupId].orders.push(order);
        groupOrders[groupId].totalAmount += order.totalAmount;
        groupOrders[groupId].memberCount++;
        groupOrders[groupId].paymentMethods.add(order.paymentMethod);
        
        // Track earliest created date
        if (order.createdAt < groupOrders[groupId].earliestCreatedAt) {
          groupOrders[groupId].earliestCreatedAt = order.createdAt;
        }

        // Consolidate items by product
        order.items.forEach(item => {
          const key = `${item.productId}_${item.unit}`;
          if (groupOrders[groupId].consolidatedItems[key]) {
            groupOrders[groupId].consolidatedItems[key].quantity += item.quantity;
            groupOrders[groupId].consolidatedItems[key].totalPrice += item.totalPrice;
          } else {
            groupOrders[groupId].consolidatedItems[key] = {
              productId: item.productId,
              product: item.product,
              quantity: item.quantity,
              unit: item.unit,
              totalPrice: item.totalPrice,
              pricePerUnit: item.pricePerUnit
            };
          }
        });
      } else {
        // Individual order
        individualOrders.push({
          ...order,
          type: 'INDIVIDUAL'
        });
      }
    });

    // Convert consolidated items to array for each group
    Object.values(groupOrders).forEach(group => {
      group.items = Object.values(group.consolidatedItems);
      delete group.consolidatedItems;
      
      // Convert payment methods set to array
      group.paymentMethods = Array.from(group.paymentMethods);
      
      // Use group's created date as the order date
      group.createdAt = group.earliestCreatedAt;
    });

    // Combine group orders and individual orders
    const consolidatedOrders = [
      ...Object.values(groupOrders),
      ...individualOrders
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(consolidatedOrders);
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