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
      id: vendor.id,
      name: vendor.name,
      phone: vendor.phone,
      businessType: vendor.businessType,
      businessLocation: vendor.businessLocation,
      trustScore: vendor.trustScore,
      isVerified: vendor.isVerified
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
    const updates = { ...req.body };

    // Process latitude/longitude if they exist in updates
    if ('latitude' in updates) {
      updates.latitude = updates.latitude && updates.latitude !== '' ? parseFloat(updates.latitude) : null;
    }
    if ('longitude' in updates) {
      updates.longitude = updates.longitude && updates.longitude !== '' ? parseFloat(updates.longitude) : null;
    }

    // Process other optional fields
    if ('estimatedDailyPurchase' in updates && updates.estimatedDailyPurchase) {
      updates.estimatedDailyPurchase = parseFloat(updates.estimatedDailyPurchase);
    }
    if ('bankAccount' in updates && !updates.bankAccount) {
      updates.bankAccount = null;
    }
    if ('upiId' in updates && !updates.upiId) {
      updates.upiId = null;
    }

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

// Get bids for vendor's orders
router.get('/:id/bids', async (req, res) => {
  try {
    const vendorId = req.params.id;
    const { status } = req.query;

    let whereClause = {
      order: {
        vendorId: vendorId
      }
    };

    if (status) {
      whereClause.status = status;
    }

    const bids = await prisma.bid.findMany({
      where: whereClause,
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
          select: {
            id: true,
            totalAmount: true,
            status: true,
            createdAt: true,
            items: {
              include: {
                product: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(bids);
  } catch (error) {
    console.error('Error fetching vendor bids:', error);
    res.status(500).json({ error: 'Failed to fetch bids' });
  }
});

// Accept a bid
router.put('/bids/:bidId/accept', async (req, res) => {
  try {
    const { bidId } = req.params;

    // Check if bid exists and get vendor info
    const bid = await prisma.bid.findUnique({
      where: { id: bidId },
      include: {
        order: {
          include: {
            vendor: true
          }
        },
        supplier: true
      }
    });

    if (!bid) {
      return res.status(404).json({ error: 'Bid not found' });
    }

    if (bid.status !== 'PENDING') {
      return res.status(400).json({ error: 'Bid is no longer pending' });
    }

    // Update bid status to accepted
    const updatedBid = await prisma.bid.update({
      where: { id: bidId },
      data: { status: 'ACCEPTED' },
      include: {
        supplier: true,
        order: true
      }
    });

    // Update order with supplier and status
    await prisma.order.update({
      where: { id: bid.orderId },
      data: {
        supplierId: bid.supplierId,
        status: 'CONFIRMED',
        totalAmount: bid.totalAmount
      }
    });

    // Reject all other bids for this order
    await prisma.bid.updateMany({
      where: {
        orderId: bid.orderId,
        id: { not: bidId },
        status: 'PENDING'
      },
      data: { status: 'REJECTED' }
    });

    res.json(updatedBid);
  } catch (error) {
    console.error('Error accepting bid:', error);
    res.status(500).json({ error: 'Failed to accept bid' });
  }
});

// Reject a bid
router.put('/bids/:bidId/reject', async (req, res) => {
  try {
    const { bidId } = req.params;

    const bid = await prisma.bid.findUnique({
      where: { id: bidId }
    });

    if (!bid) {
      return res.status(404).json({ error: 'Bid not found' });
    }

    if (bid.status !== 'PENDING') {
      return res.status(400).json({ error: 'Bid is no longer pending' });
    }

    const updatedBid = await prisma.bid.update({
      where: { id: bidId },
      data: { status: 'REJECTED' },
      include: {
        supplier: true,
        order: true
      }
    });

    res.json(updatedBid);
  } catch (error) {
    console.error('Error rejecting bid:', error);
    res.status(500).json({ error: 'Failed to reject bid' });
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