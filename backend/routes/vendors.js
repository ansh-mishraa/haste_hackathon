const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();

const prisma = new PrismaClient();

// Get all vendors
router.get('/', async (req, res) => {
  try {
    const vendors = await prisma.vendor.findMany({
      select: {
        id: true,
        name: true,
        businessType: true,
        businessLocation: true,
        latitude: true,
        longitude: true,
        trustScore: true,
        isVerified: true,
        profilePicture: true,
        createdAt: true
      }
    });
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch vendors' });
  }
});

// Create new vendor
router.post('/', async (req, res) => {
  try {
    const {
      phone,
      name,
      businessType,
      businessLocation,
      latitude,
      longitude,
      estimatedDailyPurchase,
      bankAccount,
      upiId
    } = req.body;

    const vendor = await prisma.vendor.create({
      data: {
        phone,
        name,
        businessType,
        businessLocation,
        latitude,
        longitude,
        estimatedDailyPurchase,
        bankAccount,
        upiId,
        isVerified: true, // Auto-verify for open website
        phoneVerifiedAt: new Date(),
        locationVerifiedAt: new Date()
      }
    });

    res.status(201).json(vendor);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Phone number already registered' });
    }
    res.status(500).json({ error: 'Failed to create vendor' });
  }
});

// Get vendor by ID
router.get('/:id', async (req, res) => {
  try {
    const vendor = await prisma.vendor.findUnique({
      where: { id: req.params.id },
      include: {
        orders: {
          include: {
            items: {
              include: {
                product: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        groupMemberships: {
          include: {
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
            }
          },
          orderBy: { joinedAt: 'desc' }
        },
        creditTransactions: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    res.json(vendor);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch vendor' });
  }
});

// Update vendor
router.put('/:id', async (req, res) => {
  try {
    const vendorId = req.params.id;
    const updates = req.body;

    const vendor = await prisma.vendor.update({
      where: { id: vendorId },
      data: updates
    });

    res.json(vendor);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Vendor not found' });
    }
    res.status(500).json({ error: 'Failed to update vendor' });
  }
});

// Get vendor dashboard data
router.get('/:id/dashboard', async (req, res) => {
  try {
    const vendorId = req.params.id;

    // Get today's orders
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      todaysOrders,
      activeGroups,
      totalSavings,
      creditInfo,
      recentTransactions
    ] = await Promise.all([
      prisma.order.findMany({
        where: {
          vendorId,
          createdAt: {
            gte: today,
            lt: tomorrow
          }
        },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      }),
      prisma.groupMembership.findMany({
        where: {
          vendorId,
          group: {
            status: {
              in: ['FORMING', 'CONFIRMED', 'BIDDING']
            }
          }
        },
        include: {
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
          }
        }
      }),
      prisma.vendor.findUnique({
        where: { id: vendorId },
        select: { totalSavings: true }
      }),
      prisma.vendor.findUnique({
        where: { id: vendorId },
        select: {
          availableCredit: true,
          usedCredit: true,
          trustScore: true
        }
      }),
      prisma.payment.findMany({
        where: { vendorId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          order: {
            select: {
              id: true,
              totalAmount: true
            }
          }
        }
      })
    ]);

    const dashboardData = {
      todaysOrders,
      activeGroups,
      totalSavings: totalSavings?.totalSavings || 0,
      creditInfo,
      recentTransactions,
      stats: {
        todaysOrdersCount: todaysOrders.length,
        activeGroupsCount: activeGroups.length,
        todaysOrderValue: todaysOrders.reduce((sum, order) => sum + order.totalAmount, 0)
      }
    };

    res.json(dashboardData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get vendors near location for group formation
router.get('/nearby/:latitude/:longitude', async (req, res) => {
  try {
    const { latitude, longitude } = req.params;
    const radius = parseFloat(req.query.radius) || 2; // 2km default

    // Simple distance calculation (for production, use proper geospatial queries)
    const vendors = await prisma.vendor.findMany({
      where: {
        latitude: { not: null },
        longitude: { not: null },
        isVerified: true
      },
      select: {
        id: true,
        name: true,
        businessType: true,
        businessLocation: true,
        latitude: true,
        longitude: true,
        trustScore: true
      }
    });

    // Filter by distance (simplified calculation)
    const nearbyVendors = vendors.filter(vendor => {
      const distance = calculateDistance(
        parseFloat(latitude),
        parseFloat(longitude),
        vendor.latitude,
        vendor.longitude
      );
      return distance <= radius;
    });

    res.json(nearbyVendors);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch nearby vendors' });
  }
});

// Helper function to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance;
}

module.exports = router; 