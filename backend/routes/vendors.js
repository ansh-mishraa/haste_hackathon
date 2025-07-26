const express = require('express');
const { prisma } = require('../config/database');
const router = express.Router();

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
    console.error('Error fetching vendors:', error);
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

    // Validate required fields
    if (!phone || !name || !businessType || !businessLocation) {
      return res.status(400).json({ 
        error: 'Missing required fields: phone, name, businessType, businessLocation' 
      });
    }

    // Check if vendor with this phone already exists
    const existingVendor = await prisma.vendor.findUnique({
      where: { phone }
    });

    if (existingVendor) {
      return res.status(409).json({ 
        error: 'Vendor with this phone number already exists' 
      });
    }

    const vendor = await prisma.vendor.create({
      data: {
        phone,
        name,
        businessType,
        businessLocation,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        estimatedDailyPurchase: estimatedDailyPurchase ? parseFloat(estimatedDailyPurchase) : 1000,
        bankAccount: bankAccount || null,
        upiId: upiId || null
      }
    });

    res.status(201).json({
      message: 'Vendor created successfully',
      vendor: {
        id: vendor.id,
        name: vendor.name,
        businessType: vendor.businessType,
        businessLocation: vendor.businessLocation,
        trustScore: vendor.trustScore,
        availableCredit: vendor.availableCredit
      }
    });
  } catch (error) {
    console.error('Error creating vendor:', error);
    res.status(500).json({ error: 'Failed to create vendor' });
  }
});

// Get vendor by phone number (for login) - MUST come before /:id route
router.get('/by-phone/:phone', async (req, res) => {
  try {
    const { phone } = req.params;
    console.log('🔍 Searching for vendor with phone:', phone);
    
    // First, let's check if there are any vendors in the database
    const vendorCount = await prisma.vendor.count();
    console.log('📊 Total vendors in database:', vendorCount);
    
    // If there are vendors, let's see a sample of phone numbers
    if (vendorCount > 0) {
      const sampleVendors = await prisma.vendor.findMany({
        take: 3,
        select: { phone: true, name: true }
      });
      console.log('📱 Sample phone numbers in database:', sampleVendors);
    }
    
    const vendor = await prisma.vendor.findUnique({
      where: { phone },
      select: {
        id: true,
        name: true,
        phone: true,
        businessType: true,
        businessLocation: true,
        trustScore: true,
        isVerified: true,
        availableCredit: true,
        usedCredit: true
      }
    });

    console.log('🔎 Query result for phone', phone, ':', vendor ? 'FOUND' : 'NOT FOUND');

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found with this phone number' });
    }

    res.json(vendor);
  } catch (error) {
    console.error('❌ Error finding vendor by phone:', error);
    res.status(500).json({ error: 'Failed to find vendor' });
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