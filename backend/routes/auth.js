const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prisma } = require('../config/database');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Login endpoint for vendors
router.post('/vendor/login', async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ error: 'Phone and password are required' });
    }

    // Find vendor by phone
    const vendor = await prisma.vendor.findUnique({
      where: { phone }
    });

    if (!vendor) {
      return res.status(401).json({ error: 'Invalid phone or password' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, vendor.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid phone or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: vendor.id, 
        phone: vendor.phone, 
        type: 'vendor' 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: vendor.id,
        name: vendor.name,
        phone: vendor.phone,
        businessType: vendor.businessType,
        businessLocation: vendor.businessLocation,
        type: 'vendor'
      }
    });
  } catch (error) {
    console.error('Vendor login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Login endpoint for suppliers
router.post('/supplier/login', async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ error: 'Phone and password are required' });
    }

    // Find supplier by phone
    const supplier = await prisma.supplier.findUnique({
      where: { phone }
    });

    if (!supplier) {
      return res.status(401).json({ error: 'Invalid phone or password' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, supplier.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid phone or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: supplier.id, 
        phone: supplier.phone, 
        type: 'supplier' 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: supplier.id,
        businessName: supplier.businessName,
        contactPerson: supplier.contactPerson,
        phone: supplier.phone,
        email: supplier.email,
        type: 'supplier'
      }
    });
  } catch (error) {
    console.error('Supplier login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Verify token endpoint
router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    let user;
    if (decoded.type === 'vendor') {
      user = await prisma.vendor.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          name: true,
          phone: true,
          businessType: true,
          businessLocation: true,
          trustScore: true,
          availableCredit: true,
          usedCredit: true,
          isVerified: true
        }
      });
      if (user) user.type = 'vendor';
    } else if (decoded.type === 'supplier') {
      user = await prisma.supplier.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          businessName: true,
          contactPerson: true,
          phone: true,
          email: true,
          rating: true,
          totalOrders: true,
          isVerified: true
        }
      });
      if (user) user.type = 'supplier';
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    res.json({
      valid: true,
      user
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Change password endpoint
router.post('/change-password', async (req, res) => {
  try {
    const { token, currentPassword, newPassword, userType } = req.body;

    if (!token || !currentPassword || !newPassword || !userType) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.type !== userType) {
      return res.status(401).json({ error: 'Invalid user type' });
    }

    let user;
    if (userType === 'vendor') {
      user = await prisma.vendor.findUnique({
        where: { id: decoded.id }
      });
    } else if (userType === 'supplier') {
      user = await prisma.supplier.findUnique({
        where: { id: decoded.id }
      });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    if (userType === 'vendor') {
      await prisma.vendor.update({
        where: { id: decoded.id },
        data: { password: hashedNewPassword }
      });
    } else if (userType === 'supplier') {
      await prisma.supplier.update({
        where: { id: decoded.id },
        data: { password: hashedNewPassword }
      });
    }

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

module.exports = router; 