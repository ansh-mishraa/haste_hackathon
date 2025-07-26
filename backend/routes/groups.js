const express = require('express');
const { prisma } = require('../config/database');
const socketService = require('../services/socketService');
const router = express.Router();

// Get all active groups
router.get('/', async (req, res) => {
  try {
    const { status, location, radius = 2 } = req.query;
    
    let whereClause = {};
    
    if (status) {
      whereClause.status = status;
    }

    const groups = await prisma.buyingGroup.findMany({
      where: whereClause,
      include: {
        memberships: {
          include: {
            vendor: {
              select: {
                id: true,
                name: true,
                businessType: true,
                trustScore: true
              }
            }
          }
        },
        orders: {
          include: {
            items: {
              include: {
                product: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

// Create new buying group
router.post('/', async (req, res) => {
  try {
    const {
      name,
      targetPickupTime,
      pickupLocation,
      pickupLatitude,
      pickupLongitude,
      minMembers = 3,
      maxMembers = 20,
      creatorVendorId,
      initialOrderItems = []
    } = req.body;

    // Create confirmation deadline (30 minutes from now)
    const confirmationDeadline = new Date();
    confirmationDeadline.setMinutes(confirmationDeadline.getMinutes() + 30);

    const group = await prisma.buyingGroup.create({
      data: {
        name,
        targetPickupTime: new Date(targetPickupTime),
        pickupLocation,
        pickupLatitude,
        pickupLongitude,
        minMembers,
        maxMembers,
        confirmationDeadline,
        memberships: {
          create: {
            vendorId: creatorVendorId,
            isConfirmed: true
          }
        }
      },
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
    });

    // Create initial order if items provided
    if (initialOrderItems.length > 0) {
      await prisma.order.create({
        data: {
          vendorId: creatorVendorId,
          groupId: group.id,
          orderType: 'GROUP',
          totalAmount: initialOrderItems.reduce((sum, item) => sum + (item.quantity * item.pricePerUnit), 0),
          paymentMethod: 'PAY_LATER',
          isGroupOrder: true,
          items: {
            create: initialOrderItems.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              unit: item.unit,
              pricePerUnit: item.pricePerUnit,
              totalPrice: item.quantity * item.pricePerUnit, // Add missing totalPrice field
              notes: item.notes || null
            }))
          }
        }
      });
    }

    // Notify nearby vendors about new group formation
    socketService.broadcast('new_group_formed', {
      groupId: group.id,
      pickupLocation,
      pickupLatitude,
      pickupLongitude,
      targetPickupTime
    });

    res.status(201).json(group);
  } catch (error) {
    console.error('Group creation error:', error);
    res.status(500).json({ error: 'Failed to create group' });
  }
});

// Get group by ID with full details
router.get('/:id', async (req, res) => {
  try {
    const group = await prisma.buyingGroup.findUnique({
      where: { id: req.params.id },
      include: {
        memberships: {
          include: {
            vendor: {
              select: {
                id: true,
                name: true,
                businessType: true,
                businessLocation: true,
                trustScore: true,
                profilePicture: true
              }
            }
          }
        },
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
            },
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
          }
        },
        chatMessages: {
          include: {
            vendor: {
              select: {
                id: true,
                name: true,
                profilePicture: true
              }
            }
          },
          orderBy: { createdAt: 'asc' },
          take: 50
        }
      }
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Calculate consolidated order totals
    const consolidatedOrder = consolidateGroupOrders(group.orders);
    group.consolidatedOrder = consolidatedOrder;

    res.json(group);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch group details' });
  }
});

// Join a buying group
router.post('/:id/join', async (req, res) => {
  try {
    const groupId = req.params.id;
    const { vendorId } = req.body;

    // Check if group exists and is joinable
    const group = await prisma.buyingGroup.findUnique({
      where: { id: groupId },
      include: {
        memberships: true
      }
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (group.status !== 'FORMING') {
      return res.status(400).json({ error: 'Group is no longer accepting members' });
    }

    if (group.memberships.length >= group.maxMembers) {
      return res.status(400).json({ error: 'Group is full' });
    }

    if (new Date() > group.confirmationDeadline) {
      return res.status(400).json({ error: 'Confirmation deadline has passed' });
    }

    // Validate that vendor exists
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      select: { id: true, name: true, businessType: true }
    });

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found. Please login again.' });
    }

    // Check if vendor is already in group
    const existingMembership = group.memberships.find(m => m.vendorId === vendorId);
    if (existingMembership) {
      return res.status(400).json({ error: 'Already a member of this group' });
    }

    console.log('✅ Vendor validation passed. Creating membership for:', vendor.name, '(', vendorId, ')');

    // Add vendor to group
    const membership = await prisma.groupMembership.create({
      data: {
        vendorId,
        groupId,
        isConfirmed: true
      },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            businessType: true
          }
        }
      }
    });

    // Notify group members
    socketService.notifyGroup(groupId, 'member_joined', {
      membership,
      totalMembers: group.memberships.length + 1
    });

    res.status(201).json(membership);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Already a member of this group' });
    }
    res.status(500).json({ error: 'Failed to join group' });
  }
});

// Leave a buying group
router.delete('/:id/leave', async (req, res) => {
  try {
    const groupId = req.params.id;
    const { vendorId } = req.body;

    const membership = await prisma.groupMembership.findFirst({
      where: {
        groupId,
        vendorId
      }
    });

    if (!membership) {
      return res.status(404).json({ error: 'Membership not found' });
    }

    await prisma.groupMembership.delete({
      where: { id: membership.id }
    });

    // Check if group should be cancelled (less than minimum members)
    const remainingMemberships = await prisma.groupMembership.count({
      where: { groupId }
    });

    const group = await prisma.buyingGroup.findUnique({
      where: { id: groupId }
    });

    if (remainingMemberships < group.minMembers) {
      await prisma.buyingGroup.update({
        where: { id: groupId },
        data: { status: 'CANCELLED' }
      });

      socketService.notifyGroup(groupId, 'group_cancelled', {
        reason: 'Insufficient members'
      });
    } else {
      socketService.notifyGroup(groupId, 'member_left', {
        vendorId,
        totalMembers: remainingMemberships
      });
    }

    res.json({ message: 'Left group successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to leave group' });
  }
});

// Confirm group (move to bidding phase)
router.post('/:id/confirm', async (req, res) => {
  try {
    const groupId = req.params.id;

    const group = await prisma.buyingGroup.findUnique({
      where: { id: groupId },
      include: {
        memberships: true,
        orders: {
          include: {
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

    if (group.status !== 'FORMING') {
      return res.status(400).json({ error: 'Group cannot be confirmed in current status' });
    }

    if (group.memberships.length < group.minMembers) {
      return res.status(400).json({ error: 'Insufficient members to confirm group' });
    }

    // Calculate total value and estimated savings
    const totalValue = group.orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const estimatedSavings = totalValue * 0.15; // 15% estimated savings

    const updatedGroup = await prisma.buyingGroup.update({
      where: { id: groupId },
      data: {
        status: 'CONFIRMED',
        totalValue,
        estimatedSavings
      }
    });

    // Notify all suppliers about new group order
    socketService.broadcast('group_ready_for_bids', {
      groupId,
      totalValue,
      pickupLocation: group.pickupLocation,
      targetPickupTime: group.targetPickupTime
    });

    // Notify group members
    socketService.notifyGroup(groupId, 'group_confirmed', {
      totalValue,
      estimatedSavings,
      status: 'CONFIRMED'
    });

    res.json(updatedGroup);
  } catch (error) {
    res.status(500).json({ error: 'Failed to confirm group' });
  }
});

// Get group chat messages
router.get('/:id/messages', async (req, res) => {
  try {
    const groupId = req.params.id;
    const { limit = 50, offset = 0 } = req.query;

    const messages = await prisma.chatMessage.findMany({
      where: { groupId },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            profilePicture: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    res.json(messages.reverse()); // Return in chronological order
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send group chat message
router.post('/:id/messages', async (req, res) => {
  try {
    const groupId = req.params.id;
    const { vendorId, message, messageType = 'TEXT', imageUrl } = req.body;

    const chatMessage = await prisma.chatMessage.create({
      data: {
        groupId,
        vendorId,
        message,
        messageType,
        imageUrl
      },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            profilePicture: true
          }
        }
      }
    });

    // Broadcast message to group members
    socketService.notifyGroup(groupId, 'new_message', chatMessage);

    res.status(201).json(chatMessage);
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get suggested groups for a vendor based on location and needs
router.get('/suggestions/:vendorId', async (req, res) => {
  try {
    const vendorId = req.params.vendorId;
    const { latitude, longitude, radius = 2 } = req.query;

    // Get vendor info
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId }
    });

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    // Find groups that are forming and within proximity
    const groups = await prisma.buyingGroup.findMany({
      where: {
        status: 'FORMING',
        confirmationDeadline: {
          gt: new Date()
        }
      },
      include: {
        memberships: {
          include: {
            vendor: {
              select: {
                id: true,
                name: true,
                businessType: true,
                latitude: true,
                longitude: true
              }
            }
          }
        }
      }
    });

    // Filter by proximity and exclude groups vendor is already in
    const suggestions = groups.filter(group => {
      // Check if vendor is already a member
      const isAlreadyMember = group.memberships.some(m => m.vendorId === vendorId);
      if (isAlreadyMember) return false;

      // Check proximity
      if (latitude && longitude && group.pickupLatitude && group.pickupLongitude) {
        const distance = calculateDistance(
          parseFloat(latitude),
          parseFloat(longitude),
          group.pickupLatitude,
          group.pickupLongitude
        );
        return distance <= parseFloat(radius);
      }

      return true;
    });

    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch group suggestions' });
  }
});

// Helper function to consolidate group orders
function consolidateGroupOrders(orders) {
  const consolidated = {};
  
  orders.forEach(order => {
    order.items.forEach(item => {
      const key = `${item.productId}_${item.unit}`;
      if (consolidated[key]) {
        consolidated[key].quantity += item.quantity;
        consolidated[key].totalPrice += item.totalPrice;
      } else {
        consolidated[key] = {
          productId: item.productId,
          product: item.product,
          quantity: item.quantity,
          unit: item.unit,
          totalPrice: item.totalPrice,
          vendors: []
        };
      }
      consolidated[key].vendors.push({
        vendorId: order.vendorId,
        quantity: item.quantity,
        price: item.totalPrice
      });
    });
  });

  return Object.values(consolidated);
}

// Helper function to calculate distance
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

module.exports = router; 