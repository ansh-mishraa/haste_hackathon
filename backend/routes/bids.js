const express = require('express');
const { prisma } = require('../config/database');
const router = express.Router();

// Accept a bid
router.put('/:bidId/accept', async (req, res) => {
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
router.put('/:bidId/reject', async (req, res) => {
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

module.exports = router; 