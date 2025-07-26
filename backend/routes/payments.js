const express = require('express');
const { prisma } = require('../config/database');
const router = express.Router();

// Get all payments
router.get('/', async (req, res) => {
  try {
    const { vendorId, status, type, limit = 20 } = req.query;

    let whereClause = {};

    if (vendorId) whereClause.vendorId = vendorId;
    if (status) whereClause.status = status;
    if (type) whereClause.type = type;

    const payments = await prisma.payment.findMany({
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
        order: {
          select: {
            id: true,
            totalAmount: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    });

    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// Create payment (for pay-now orders)
router.post('/', async (req, res) => {
  try {
    const {
      vendorId,
      orderId,
      amount,
      method = 'UPI',
      type = 'ORDER_PAYMENT'
    } = req.body;

    // Validate order exists
    if (orderId) {
      const order = await prisma.order.findUnique({
        where: { id: orderId }
      });

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      if (order.paymentStatus === 'COMPLETED') {
        return res.status(400).json({ error: 'Order already paid' });
      }
    }

    // For demo purposes, we'll simulate payment processing
    // In production, integrate with Razorpay
    const razorpayOrderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const payment = await prisma.payment.create({
      data: {
        vendorId,
        orderId,
        amount,
        type,
        method,
        status: 'PROCESSING', // Will be updated after payment confirmation
        razorpayOrderId
      },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            businessType: true
          }
        },
        order: {
          select: {
            id: true,
            totalAmount: true
          }
        }
      }
    });

    // Simulate immediate payment success for demo
    setTimeout(async () => {
      try {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'COMPLETED',
            paidAt: new Date(),
            razorpayPaymentId: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          }
        });

        // Update order payment status
        if (orderId) {
          await prisma.order.update({
            where: { id: orderId },
            data: { paymentStatus: 'COMPLETED' }
          });
        }
      } catch (error) {
        console.error('Payment update error:', error);
      }
    }, 2000);

    res.status(201).json({
      ...payment,
      razorpayOrderId,
      message: 'Payment initiated successfully'
    });
  } catch (error) {
    console.error('Payment creation error:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

// Get payment by ID
router.get('/:id', async (req, res) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            businessType: true,
            businessLocation: true,
            phone: true
          }
        },
        order: {
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

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json(payment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payment' });
  }
});

// Update payment status
router.put('/:id/status', async (req, res) => {
  try {
    const paymentId = req.params.id;
    const { status, razorpayPaymentId, failureReason } = req.body;

    const updateData = { status };
    
    if (status === 'COMPLETED') {
      updateData.paidAt = new Date();
      if (razorpayPaymentId) updateData.razorpayPaymentId = razorpayPaymentId;
    }
    
    if (status === 'FAILED' && failureReason) {
      updateData.failureReason = failureReason;
    }

    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: updateData,
      include: {
        order: true
      }
    });

    // Update order payment status if applicable
    if (payment.orderId && status === 'COMPLETED') {
      await prisma.order.update({
        where: { id: payment.orderId },
        data: { paymentStatus: 'COMPLETED' }
      });
    }

    res.json(payment);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Payment not found' });
    }
    res.status(500).json({ error: 'Failed to update payment status' });
  }
});

// Get vendor's payment history
router.get('/vendor/:vendorId/history', async (req, res) => {
  try {
    const vendorId = req.params.vendorId;
    const { limit = 20, offset = 0, status } = req.query;

    let whereClause = { vendorId };
    if (status) whereClause.status = status;

    const payments = await prisma.payment.findMany({
      where: whereClause,
      include: {
        order: {
          select: {
            id: true,
            totalAmount: true,
            status: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    const totalPayments = await prisma.payment.count({
      where: whereClause
    });

    res.json({
      payments,
      totalCount: totalPayments,
      hasMore: parseInt(offset) + payments.length < totalPayments
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
});

// Process credit repayment
router.post('/credit/repay', async (req, res) => {
  try {
    const { vendorId, amount, method = 'UPI' } = req.body;

    // Get vendor's current credit usage
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      select: {
        usedCredit: true,
        availableCredit: true
      }
    });

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    if (amount > vendor.usedCredit) {
      return res.status(400).json({ error: 'Repayment amount exceeds used credit' });
    }

    // Create repayment transaction
    const payment = await prisma.payment.create({
      data: {
        vendorId,
        amount,
        type: 'CREDIT_REPAYMENT',
        method,
        status: 'PROCESSING'
      }
    });

    // Simulate payment processing
    setTimeout(async () => {
      try {
        // Update payment status
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'COMPLETED',
            paidAt: new Date()
          }
        });

        // Create credit transaction
        await prisma.creditTransaction.create({
          data: {
            vendorId,
            amount,
            type: 'CREDIT_REPAID',
            description: `Credit repayment - Payment #${payment.id.substring(0, 8)}`,
            status: 'PAID',
            paidAt: new Date()
          }
        });

        // Update vendor's credit balance
        await prisma.vendor.update({
          where: { id: vendorId },
          data: {
            usedCredit: {
              decrement: amount
            }
          }
        });

        // Update overdue credit transactions
        await prisma.creditTransaction.updateMany({
          where: {
            vendorId,
            status: 'OVERDUE',
            amount: { lte: amount }
          },
          data: {
            status: 'PAID',
            paidAt: new Date()
          }
        });

      } catch (error) {
        console.error('Credit repayment processing error:', error);
      }
    }, 2000);

    res.status(201).json({
      ...payment,
      message: 'Credit repayment initiated successfully'
    });
  } catch (error) {
    console.error('Credit repayment error:', error);
    res.status(500).json({ error: 'Failed to process credit repayment' });
  }
});

// Get vendor's credit status
router.get('/credit/:vendorId', async (req, res) => {
  try {
    const vendorId = req.params.vendorId;

    const [vendor, creditTransactions, overdueTransactions] = await Promise.all([
      prisma.vendor.findUnique({
        where: { id: vendorId },
        select: {
          availableCredit: true,
          usedCredit: true,
          trustScore: true
        }
      }),
      prisma.creditTransaction.findMany({
        where: { vendorId },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),
      prisma.creditTransaction.findMany({
        where: {
          vendorId,
          status: 'OVERDUE',
          dueDate: { lt: new Date() }
        },
        orderBy: { dueDate: 'asc' }
      })
    ]);

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    const creditStatus = {
      availableCredit: vendor.availableCredit,
      usedCredit: vendor.usedCredit,
      remainingCredit: vendor.availableCredit - vendor.usedCredit,
      trustScore: vendor.trustScore,
      creditTransactions,
      overdueTransactions,
      overdueAmount: overdueTransactions.reduce((sum, txn) => sum + txn.amount, 0),
      utilizationRatio: vendor.availableCredit > 0 ? (vendor.usedCredit / vendor.availableCredit) * 100 : 0
    };

    res.json(creditStatus);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch credit status' });
  }
});

// Request credit limit increase
router.post('/credit/:vendorId/increase', async (req, res) => {
  try {
    const vendorId = req.params.vendorId;
    const { requestedAmount, reason } = req.body;

    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      select: {
        availableCredit: true,
        trustScore: true,
        totalSavings: true
      }
    });

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    // Simple credit scoring logic
    let approvedAmount = 0;
    let status = 'REJECTED';
    let reason_message = 'Credit score too low';

    if (vendor.trustScore >= 80) {
      approvedAmount = requestedAmount;
      status = 'APPROVED';
      reason_message = 'Credit limit increase approved';
    } else if (vendor.trustScore >= 60) {
      approvedAmount = Math.min(requestedAmount, vendor.availableCredit * 0.5);
      status = 'APPROVED';
      reason_message = 'Partial credit limit increase approved';
    }

    if (status === 'APPROVED' && approvedAmount > 0) {
      // Update vendor's credit limit
      await prisma.vendor.update({
        where: { id: vendorId },
        data: {
          availableCredit: {
            increment: approvedAmount
          }
        }
      });

      // Create transaction record
      await prisma.creditTransaction.create({
        data: {
          vendorId,
          amount: approvedAmount,
          type: 'CREDIT_LIMIT_INCREASE',
          description: `Credit limit increase: ${reason}`,
          status: 'ACTIVE'
        }
      });
    }

    res.json({
      status,
      requestedAmount,
      approvedAmount,
      message: reason_message,
      newCreditLimit: vendor.availableCredit + (status === 'APPROVED' ? approvedAmount : 0)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process credit increase request' });
  }
});

// Payment analytics
router.get('/analytics/:vendorId', async (req, res) => {
  try {
    const vendorId = req.params.vendorId;
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const [
      totalPayments,
      totalSpent,
      paymentsByMethod,
      paymentsByStatus,
      creditUtilization,
      monthlyTrend
    ] = await Promise.all([
      prisma.payment.count({
        where: {
          vendorId,
          createdAt: { gte: startDate }
        }
      }),
      prisma.payment.aggregate({
        where: {
          vendorId,
          status: 'COMPLETED',
          createdAt: { gte: startDate }
        },
        _sum: { amount: true }
      }),
      prisma.payment.groupBy({
        by: ['method'],
        where: {
          vendorId,
          createdAt: { gte: startDate }
        },
        _count: { method: true },
        _sum: { amount: true }
      }),
      prisma.payment.groupBy({
        by: ['status'],
        where: {
          vendorId,
          createdAt: { gte: startDate }
        },
        _count: { status: true }
      }),
      prisma.creditTransaction.aggregate({
        where: {
          vendorId,
          type: 'CREDIT_USED',
          createdAt: { gte: startDate }
        },
        _sum: { amount: true }
      }),
      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('day', "createdAt") as date,
          COUNT(*) as payment_count,
          SUM("amount") as total_amount
        FROM payments 
        WHERE "vendorId" = ${vendorId} 
          AND "status" = 'COMPLETED'
          AND "createdAt" >= ${startDate}
        GROUP BY DATE_TRUNC('day', "createdAt")
        ORDER BY date ASC
      `
    ]);

    const analytics = {
      summary: {
        totalPayments,
        totalSpent: totalSpent._sum.amount || 0,
        creditUsed: creditUtilization._sum.amount || 0,
        avgPaymentAmount: totalPayments > 0 ? (totalSpent._sum.amount || 0) / totalPayments : 0
      },
      paymentsByMethod: paymentsByMethod.reduce((acc, item) => {
        acc[item.method] = {
          count: item._count.method,
          amount: item._sum.amount || 0
        };
        return acc;
      }, {}),
      paymentsByStatus: paymentsByStatus.reduce((acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
      }, {}),
      monthlyTrend: monthlyTrend.map(item => ({
        date: item.date,
        paymentCount: parseInt(item.payment_count),
        totalAmount: parseFloat(item.total_amount) || 0
      }))
    };

    res.json(analytics);
  } catch (error) {
    console.error('Payment analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch payment analytics' });
  }
});

module.exports = router; 