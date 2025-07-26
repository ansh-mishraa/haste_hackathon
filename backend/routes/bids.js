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
    const updatedOrder = await prisma.order.update({
      where: { id: bid.orderId },
      data: {
        supplierId: bid.supplierId,
        status: 'CONFIRMED',
        totalAmount: bid.totalAmount
      }
    });

    // Update payment record with final amount and status
    await prisma.payment.updateMany({
      where: { 
        orderId: bid.orderId,
        status: 'PENDING'
      },
      data: {
        amount: bid.totalAmount,
        status: updatedOrder.paymentMethod === 'CASH' ? 'PENDING' : 'PENDING'
      }
    });

    // If no payment record exists (edge case), create one
    const existingPayment = await prisma.payment.findFirst({
      where: { orderId: bid.orderId }
    });

    if (!existingPayment) {
      await prisma.payment.create({
        data: {
          vendorId: bid.order.vendorId,
          orderId: bid.orderId,
          amount: bid.totalAmount,
          type: 'ORDER_PAYMENT',
          method: updatedOrder.paymentMethod,
          status: 'PENDING'
        }
      });
    }

    // Update credit transaction if it's a pay-later order
    if (updatedOrder.paymentMethod === 'PAY_LATER') {
      await prisma.creditTransaction.updateMany({
        where: { 
          orderId: bid.orderId,
          type: 'CREDIT_USED'
        },
        data: {
          amount: bid.totalAmount,
          description: `Order #${bid.orderId.substring(0, 8)} - Final amount after bid acceptance`
        }
      });

      // Update vendor's credit balance if the amount changed
      const originalAmount = bid.order.totalAmount;
      const amountDifference = bid.totalAmount - originalAmount;
      
      if (amountDifference !== 0) {
        await prisma.vendor.update({
          where: { id: bid.order.vendorId },
          data: {
            usedCredit: {
              increment: amountDifference
            }
          }
        });
      }
    }

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