const express = require('express');
const { prisma } = require('../config/database');
const router = express.Router();

// Get all products
router.get('/', async (req, res) => {
  try {
    const { category, search, limit = 50 } = req.query;

    let whereClause = {};

    if (category) {
      whereClause.category = {
        contains: category,
        mode: 'insensitive'
      };
    }

    if (search) {
      whereClause.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          description: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ];
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
      take: parseInt(limit)
    });

    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get product categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.product.findMany({
      select: {
        category: true
      },
      distinct: ['category'],
      orderBy: {
        category: 'asc'
      }
    });

    const categoryList = categories.map(c => c.category);
    res.json(categoryList);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get popular products (most ordered)
router.get('/popular', async (req, res) => {
  try {
    const popularProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: {
        quantity: true
      },
      _count: {
        productId: true
      },
      orderBy: {
        _sum: {
          quantity: 'desc'
        }
      },
      take: 20
    });

    const productIds = popularProducts.map(p => p.productId);
    
    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds
        }
      }
    });

    // Add order statistics to products
    const productsWithStats = products.map(product => {
      const stats = popularProducts.find(p => p.productId === product.id);
      return {
        ...product,
        totalOrderedQuantity: stats._sum.quantity,
        orderCount: stats._count.productId
      };
    });

    // Sort by total ordered quantity
    productsWithStats.sort((a, b) => b.totalOrderedQuantity - a.totalOrderedQuantity);

    res.json(productsWithStats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch popular products' });
  }
});

// Create new product
router.post('/', async (req, res) => {
  try {
    const {
      name,
      category,
      unit,
      description,
      imageUrl,
      marketPrice
    } = req.body;

    const product = await prisma.product.create({
      data: {
        name,
        category,
        unit,
        description,
        imageUrl,
        marketPrice
      }
    });

    res.status(201).json(product);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Product with this name already exists' });
    }
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        orderItems: {
          include: {
            order: {
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
          },
          orderBy: { order: { createdAt: 'desc' } },
          take: 10
        }
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Calculate average price from recent orders
    const recentOrders = product.orderItems.slice(0, 5);
    const avgPrice = recentOrders.length > 0 
      ? recentOrders.reduce((sum, item) => sum + item.pricePerUnit, 0) / recentOrders.length
      : product.marketPrice;

    res.json({
      ...product,
      averagePrice: avgPrice,
      recentOrdersCount: product.orderItems.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Update product
router.put('/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    const updates = req.body;

    const product = await prisma.product.update({
      where: { id: productId },
      data: updates
    });

    res.json(product);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Seed products with common street food ingredients
router.post('/seed', async (req, res) => {
  try {
    const commonProducts = [
      // Vegetables
      { name: 'Onions', category: 'Vegetables', unit: 'kg', marketPrice: 30, description: 'Fresh red onions' },
      { name: 'Tomatoes', category: 'Vegetables', unit: 'kg', marketPrice: 40, description: 'Fresh tomatoes' },
      { name: 'Potatoes', category: 'Vegetables', unit: 'kg', marketPrice: 25, description: 'Fresh potatoes' },
      { name: 'Green Chilies', category: 'Vegetables', unit: 'kg', marketPrice: 80, description: 'Fresh green chilies' },
      { name: 'Coriander Leaves', category: 'Vegetables', unit: 'bunch', marketPrice: 10, description: 'Fresh coriander' },
      { name: 'Ginger', category: 'Vegetables', unit: 'kg', marketPrice: 120, description: 'Fresh ginger' },
      { name: 'Garlic', category: 'Vegetables', unit: 'kg', marketPrice: 200, description: 'Fresh garlic' },
      
      // Cooking Oils
      { name: 'Sunflower Oil', category: 'Oils', unit: 'liter', marketPrice: 150, description: 'Refined sunflower oil' },
      { name: 'Mustard Oil', category: 'Oils', unit: 'liter', marketPrice: 180, description: 'Pure mustard oil' },
      
      // Spices
      { name: 'Turmeric Powder', category: 'Spices', unit: 'kg', marketPrice: 250, description: 'Pure turmeric powder' },
      { name: 'Red Chili Powder', category: 'Spices', unit: 'kg', marketPrice: 300, description: 'Red chili powder' },
      { name: 'Cumin Powder', category: 'Spices', unit: 'kg', marketPrice: 400, description: 'Cumin powder' },
      { name: 'Garam Masala', category: 'Spices', unit: 'kg', marketPrice: 500, description: 'Mixed spice powder' },
      { name: 'Salt', category: 'Spices', unit: 'kg', marketPrice: 20, description: 'Iodized salt' },
      
      // Grains & Flour
      { name: 'Rice', category: 'Grains', unit: 'kg', marketPrice: 60, description: 'Basmati rice' },
      { name: 'Wheat Flour', category: 'Grains', unit: 'kg', marketPrice: 35, description: 'Wheat flour' },
      { name: 'Chickpea Flour', category: 'Grains', unit: 'kg', marketPrice: 80, description: 'Besan/Gram flour' },
      
      // Dairy
      { name: 'Milk', category: 'Dairy', unit: 'liter', marketPrice: 55, description: 'Fresh milk' },
      { name: 'Paneer', category: 'Dairy', unit: 'kg', marketPrice: 300, description: 'Fresh paneer' },
      { name: 'Butter', category: 'Dairy', unit: 'kg', marketPrice: 450, description: 'Fresh butter' },
      
      // Street Food Specific
      { name: 'Pav Bread', category: 'Bread', unit: 'pieces', marketPrice: 3, description: 'Pav bread for bhaji' },
      { name: 'Dosa Batter', category: 'Ready-to-Cook', unit: 'kg', marketPrice: 60, description: 'Ready dosa batter' },
      { name: 'Chaat Masala', category: 'Spices', unit: 'kg', marketPrice: 350, description: 'Tangy chaat masala' },
      { name: 'Tamarind', category: 'Ingredients', unit: 'kg', marketPrice: 120, description: 'Tamarind for chutneys' },
      { name: 'Jaggery', category: 'Sweeteners', unit: 'kg', marketPrice: 80, description: 'Natural jaggery' }
    ];

    // Create products if they don't exist
    const createdProducts = [];
    for (const productData of commonProducts) {
      try {
        const product = await prisma.product.create({
          data: productData
        });
        createdProducts.push(product);
      } catch (error) {
        if (error.code === 'P2002') {
          // Product already exists, skip
          continue;
        } else {
          throw error;
        }
      }
    }

    res.status(201).json({
      message: `Seeded ${createdProducts.length} products`,
      products: createdProducts
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to seed products' });
  }
});

// Delete product
router.delete('/:id', async (req, res) => {
  try {
    await prisma.product.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Product not found' });
    }
    if (error.code === 'P2003') {
      return res.status(400).json({ error: 'Cannot delete product - it has associated orders' });
    }
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router; 