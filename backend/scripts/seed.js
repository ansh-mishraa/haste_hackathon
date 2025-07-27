const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Sample data arrays
const vendorData = [
  {
    phone: '+919876543210',
    name: 'Rajesh Kumar',
    businessType: 'Street Food',
    businessLocation: 'Mumbai Central',
    latitude: 19.0760,
    longitude: 72.8777,
    operatingHours: '6:00 AM - 10:00 PM',
    estimatedDailyPurchase: 5000,
    profilePicture: 'https://example.com/vendor1.jpg',
    isVerified: true,
    trustScore: 95,
    availableCredit: 8000,
    usedCredit: 2000,
    totalSavings: 15000,
    bankAccount: '1234567890',
    upiId: 'rajesh@upi'
  },
  {
    phone: '+919876543211',
    name: 'Priya Sharma',
    businessType: 'Tea Stall',
    businessLocation: 'Andheri West',
    latitude: 19.1197,
    longitude: 72.8464,
    operatingHours: '5:00 AM - 9:00 PM',
    estimatedDailyPurchase: 3000,
    profilePicture: 'https://example.com/vendor2.jpg',
    isVerified: true,
    trustScore: 88,
    availableCredit: 6000,
    usedCredit: 1000,
    totalSavings: 8000,
    bankAccount: '1234567891',
    upiId: 'priya@upi'
  },
  {
    phone: '+919876543212',
    name: 'Amit Patel',
    businessType: 'Snack Corner',
    businessLocation: 'Bandra East',
    latitude: 19.0596,
    longitude: 72.8295,
    operatingHours: '7:00 AM - 11:00 PM',
    estimatedDailyPurchase: 4500,
    profilePicture: 'https://example.com/vendor3.jpg',
    isVerified: false,
    trustScore: 75,
    availableCredit: 5000,
    usedCredit: 0,
    totalSavings: 5000,
    bankAccount: '1234567892',
    upiId: 'amit@upi'
  },
  {
    phone: '+919876543213',
    name: 'Sunita Devi',
    businessType: 'Fruit Juice',
    businessLocation: 'Kurla West',
    latitude: 19.0759,
    longitude: 72.8777,
    operatingHours: '8:00 AM - 8:00 PM',
    estimatedDailyPurchase: 2500,
    profilePicture: 'https://example.com/vendor4.jpg',
    isVerified: true,
    trustScore: 92,
    availableCredit: 7000,
    usedCredit: 1500,
    totalSavings: 12000,
    bankAccount: '1234567893',
    upiId: 'sunita@upi'
  },
  {
    phone: '+919876543214',
    name: 'Vikram Singh',
    businessType: 'Pizza Corner',
    businessLocation: 'Juhu',
    latitude: 19.0760,
    longitude: 72.8777,
    operatingHours: '11:00 AM - 12:00 AM',
    estimatedDailyPurchase: 8000,
    profilePicture: 'https://example.com/vendor5.jpg',
    isVerified: true,
    trustScore: 85,
    availableCredit: 10000,
    usedCredit: 3000,
    totalSavings: 20000,
    bankAccount: '1234567894',
    upiId: 'vikram@upi'
  },
  {
    phone: '+919876543215',
    name: 'Lakshmi Iyer',
    businessType: 'South Indian Food',
    businessLocation: 'Chembur',
    latitude: 19.0596,
    longitude: 72.8295,
    operatingHours: '6:00 AM - 10:00 PM',
    estimatedDailyPurchase: 4000,
    profilePicture: 'https://example.com/vendor6.jpg',
    isVerified: false,
    trustScore: 70,
    availableCredit: 4000,
    usedCredit: 0,
    totalSavings: 3000,
    bankAccount: '1234567895',
    upiId: 'lakshmi@upi'
  },
  {
    phone: '+919876543216',
    name: 'Ramesh Gupta',
    businessType: 'Chinese Food',
    businessLocation: 'Goregaon',
    latitude: 19.1197,
    longitude: 72.8464,
    operatingHours: '12:00 PM - 11:00 PM',
    estimatedDailyPurchase: 6000,
    profilePicture: 'https://example.com/vendor7.jpg',
    isVerified: true,
    trustScore: 90,
    availableCredit: 9000,
    usedCredit: 2500,
    totalSavings: 18000,
    bankAccount: '1234567896',
    upiId: 'ramesh@upi'
  },
  {
    phone: '+919876543217',
    name: 'Meera Joshi',
    businessType: 'Ice Cream',
    businessLocation: 'Santacruz',
    latitude: 19.0760,
    longitude: 72.8777,
    operatingHours: '10:00 AM - 11:00 PM',
    estimatedDailyPurchase: 3500,
    profilePicture: 'https://example.com/vendor8.jpg',
    isVerified: true,
    trustScore: 87,
    availableCredit: 6000,
    usedCredit: 1000,
    totalSavings: 9000,
    bankAccount: '1234567897',
    upiId: 'meera@upi'
  },
  {
    phone: '+919876543218',
    name: 'Suresh Kumar',
    businessType: 'Biryani',
    businessLocation: 'Powai',
    latitude: 19.0596,
    longitude: 72.8295,
    operatingHours: '11:00 AM - 10:00 PM',
    estimatedDailyPurchase: 7000,
    profilePicture: 'https://example.com/vendor9.jpg',
    isVerified: false,
    trustScore: 78,
    availableCredit: 5000,
    usedCredit: 500,
    totalSavings: 7000,
    bankAccount: '1234567898',
    upiId: 'suresh@upi'
  },
  {
    phone: '+919876543219',
    name: 'Anjali Desai',
    businessType: 'Sandwich Corner',
    businessLocation: 'Vashi',
    latitude: 19.1197,
    longitude: 72.8464,
    operatingHours: '7:00 AM - 9:00 PM',
    estimatedDailyPurchase: 3000,
    profilePicture: 'https://example.com/vendor10.jpg',
    isVerified: true,
    trustScore: 93,
    availableCredit: 7000,
    usedCredit: 2000,
    totalSavings: 11000,
    bankAccount: '1234567899',
    upiId: 'anjali@upi'
  }
];

const supplierData = [
  {
    phone: '+919876543220',
    businessName: 'Fresh Foods Supply Co.',
    businessRegNumber: 'REG123456',
    gstNumber: 'GST123456789',
    contactPerson: 'Arun Mehta',
    email: 'arun@freshfoods.com',
    deliveryAreas: ['Mumbai Central', 'Andheri', 'Bandra', 'Kurla'],
    productCategories: ['Vegetables', 'Fruits', 'Dairy', 'Grains'],
    bankAccount: '9876543210',
    businessAddress: '123 Supply Street, Mumbai',
    latitude: 19.0760,
    longitude: 72.8777,
    isVerified: true,
    rating: 4.5,
    totalOrders: 150,
    profilePicture: 'https://example.com/supplier1.jpg',
    businessPhotos: ['https://example.com/supplier1_1.jpg', 'https://example.com/supplier1_2.jpg']
  },
  {
    phone: '+919876543221',
    businessName: 'Quality Meat Suppliers',
    businessRegNumber: 'REG789012',
    gstNumber: 'GST987654321',
    contactPerson: 'Ravi Sharma',
    email: 'ravi@qualitymeat.com',
    deliveryAreas: ['Juhu', 'Chembur', 'Goregaon', 'Santacruz'],
    productCategories: ['Meat', 'Poultry', 'Seafood', 'Processed Foods'],
    bankAccount: '9876543211',
    businessAddress: '456 Meat Lane, Mumbai',
    latitude: 19.0596,
    longitude: 72.8295,
    isVerified: true,
    rating: 4.8,
    totalOrders: 200,
    profilePicture: 'https://example.com/supplier2.jpg',
    businessPhotos: ['https://example.com/supplier2_1.jpg', 'https://example.com/supplier2_2.jpg']
  }
];

const productData = [
  { name: 'Tomatoes', category: 'Vegetables', unit: 'kg', description: 'Fresh red tomatoes', marketPrice: 40 },
  { name: 'Onions', category: 'Vegetables', unit: 'kg', description: 'Fresh onions', marketPrice: 30 },
  { name: 'Potatoes', category: 'Vegetables', unit: 'kg', description: 'Fresh potatoes', marketPrice: 25 },
  { name: 'Carrots', category: 'Vegetables', unit: 'kg', description: 'Fresh carrots', marketPrice: 35 },
  { name: 'Cabbage', category: 'Vegetables', unit: 'kg', description: 'Fresh cabbage', marketPrice: 20 },
  { name: 'Bananas', category: 'Fruits', unit: 'dozen', description: 'Fresh yellow bananas', marketPrice: 60 },
  { name: 'Apples', category: 'Fruits', unit: 'kg', description: 'Fresh red apples', marketPrice: 120 },
  { name: 'Oranges', category: 'Fruits', unit: 'kg', description: 'Fresh oranges', marketPrice: 80 },
  { name: 'Milk', category: 'Dairy', unit: 'liter', description: 'Fresh cow milk', marketPrice: 60 },
  { name: 'Cheese', category: 'Dairy', unit: 'kg', description: 'Fresh cheese', marketPrice: 400 },
  { name: 'Butter', category: 'Dairy', unit: 'kg', description: 'Fresh butter', marketPrice: 500 },
  { name: 'Rice', category: 'Grains', unit: 'kg', description: 'Basmati rice', marketPrice: 80 },
  { name: 'Wheat Flour', category: 'Grains', unit: 'kg', description: 'Fine wheat flour', marketPrice: 45 },
  { name: 'Chicken', category: 'Meat', unit: 'kg', description: 'Fresh chicken', marketPrice: 200 },
  { name: 'Mutton', category: 'Meat', unit: 'kg', description: 'Fresh mutton', marketPrice: 600 },
  { name: 'Fish', category: 'Seafood', unit: 'kg', description: 'Fresh fish', marketPrice: 300 },
  { name: 'Prawns', category: 'Seafood', unit: 'kg', description: 'Fresh prawns', marketPrice: 500 },
  { name: 'Eggs', category: 'Poultry', unit: 'dozen', description: 'Fresh eggs', marketPrice: 80 },
  { name: 'Bread', category: 'Processed Foods', unit: 'packet', description: 'Fresh bread', marketPrice: 30 },
  { name: 'Cooking Oil', category: 'Processed Foods', unit: 'liter', description: 'Refined cooking oil', marketPrice: 120 }
];

const groupData = [
  {
    name: 'Mumbai Central Group',
    status: 'CONFIRMED',
    targetPickupTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    pickupLocation: 'Mumbai Central Station',
    pickupLatitude: 19.0760,
    pickupLongitude: 72.8777,
    minMembers: 5,
    maxMembers: 15,
    totalValue: 15000,
    estimatedSavings: 3000,
    confirmationDeadline: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours from now
    isPaymentMixed: true
  },
  {
    name: 'Andheri West Group',
    status: 'FORMING',
    targetPickupTime: new Date(Date.now() + 48 * 60 * 60 * 1000), // Day after tomorrow
    pickupLocation: 'Andheri West Station',
    pickupLatitude: 19.1197,
    pickupLongitude: 72.8464,
    minMembers: 3,
    maxMembers: 10,
    totalValue: 8000,
    estimatedSavings: 1600,
    confirmationDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    isPaymentMixed: true
  },
  {
    name: 'Bandra Group',
    status: 'BIDDING',
    targetPickupTime: new Date(Date.now() + 36 * 60 * 60 * 1000), // 36 hours from now
    pickupLocation: 'Bandra Station',
    pickupLatitude: 19.0596,
    pickupLongitude: 72.8295,
    minMembers: 4,
    maxMembers: 12,
    totalValue: 12000,
    estimatedSavings: 2400,
    confirmationDeadline: new Date(Date.now() + 18 * 60 * 60 * 1000), // 18 hours from now
    isPaymentMixed: false
  }
];

const chatMessages = [
  { message: 'Hi everyone! Ready for the group order?', messageType: 'TEXT' },
  { message: 'Yes, I am in! What time should we meet?', messageType: 'TEXT' },
  { message: 'I can pick up at 2 PM', messageType: 'TEXT' },
  { message: 'Perfect! Lets confirm the order', messageType: 'TEXT' },
  { message: 'Dont forget to bring cash', messageType: 'TEXT' },
  { message: "Ill bring UPI payment", messageType: "TEXT" },
  { message: 'Great! See you all tomorrow', messageType: 'TEXT' },
  { message: 'Remember to check the quality', messageType: 'TEXT' },
  { message: 'Ill bring my weighing scale', messageType: 'TEXT' },
  { message: 'Thanks for organizing this!', messageType: 'TEXT' }
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    console.log('🗑️ Clearing existing data...');
    await prisma.chatMessage.deleteMany();
    await prisma.groupMembership.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.bid.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.creditTransaction.deleteMany();
    await prisma.rating.deleteMany();
    await prisma.order.deleteMany();
    await prisma.buyingGroup.deleteMany();
    await prisma.product.deleteMany();
    await prisma.vendor.deleteMany();
    await prisma.supplier.deleteMany();

    // Create vendors
    console.log('👥 Creating vendors...');
    const vendors = [];
    for (const vendorDataItem of vendorData) {
      const vendor = await prisma.vendor.create({
        data: vendorDataItem
      });
      vendors.push(vendor);
    }
    console.log(`✅ Created ${vendors.length} vendors`);

    // Create suppliers
    console.log('🏪 Creating suppliers...');
    const suppliers = [];
    for (const supplierDataItem of supplierData) {
      const supplier = await prisma.supplier.create({
        data: supplierDataItem
      });
      suppliers.push(supplier);
    }
    console.log(`✅ Created ${suppliers.length} suppliers`);

    // Create products
    console.log('🛍️ Creating products...');
    const products = [];
    for (let i = 0; i < productData.length; i++) {
      const product = await prisma.product.create({
        data: {
          ...productData[i],
          supplierId: suppliers[i % suppliers.length].id
        }
      });
      products.push(product);
    }
    console.log(`✅ Created ${products.length} products`);

    // Create buying groups
    console.log('👥 Creating buying groups...');
    const groups = [];
    for (const groupDataItem of groupData) {
      const group = await prisma.buyingGroup.create({
        data: groupDataItem
      });
      groups.push(group);
    }
    console.log(`✅ Created ${groups.length} buying groups`);

    // Create group memberships
    console.log('🤝 Creating group memberships...');
    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      const numMembers = Math.min(5 + i, vendors.length); // 5, 6, 7 members respectively
      
      for (let j = 0; j < numMembers; j++) {
        await prisma.groupMembership.create({
          data: {
            vendorId: vendors[j].id,
            groupId: group.id,
            isConfirmed: Math.random() > 0.3 // 70% confirmed
          }
        });
      }
    }
    console.log('✅ Created group memberships');

    // Create orders
    console.log('📦 Creating orders...');
    const orders = [];
    
    // Individual orders
    for (let i = 0; i < 8; i++) {
      const order = await prisma.order.create({
        data: {
          vendorId: vendors[i].id,
          supplierId: suppliers[i % suppliers.length].id,
          orderType: 'INDIVIDUAL',
          status: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'DELIVERED'][Math.floor(Math.random() * 5)],
          totalAmount: Math.floor(Math.random() * 5000) + 1000,
          paymentMethod: ['CASH', 'PAY_LATER', 'UPI'][Math.floor(Math.random() * 3)],
          paymentStatus: ['PENDING', 'PROCESSING', 'COMPLETED'][Math.floor(Math.random() * 3)],
          isGroupOrder: false,
          pickupTime: new Date(Date.now() + Math.random() * 24 * 60 * 60 * 1000),
          notes: `Order ${i + 1} for ${vendors[i].name}`
        }
      });
      orders.push(order);
    }

    // Group orders
    for (let i = 0; i < groups.length; i++) {
      const order = await prisma.order.create({
        data: {
          groupId: groups[i].id,
          supplierId: suppliers[i % suppliers.length].id,
          orderType: 'GROUP',
          status: ['PENDING', 'CONFIRMED', 'PREPARING'][Math.floor(Math.random() * 3)],
          totalAmount: groups[i].totalValue,
          paymentMethod: ['CASH', 'PAY_LATER', 'UPI'][Math.floor(Math.random() * 3)],
          paymentStatus: ['PENDING', 'PROCESSING', 'COMPLETED'][Math.floor(Math.random() * 3)],
          isGroupOrder: true,
          pickupTime: groups[i].targetPickupTime,
          notes: `Group order for ${groups[i].name}`
        }
      });
      orders.push(order);
    }
    console.log(`✅ Created ${orders.length} orders`);

    // Create order items
    console.log('📋 Creating order items...');
    for (const order of orders) {
      const numItems = Math.floor(Math.random() * 5) + 1; // 1-5 items per order
      for (let i = 0; i < numItems; i++) {
        const product = products[Math.floor(Math.random() * products.length)];
        const quantity = Math.floor(Math.random() * 10) + 1;
        const pricePerUnit = product.marketPrice || 50;
        const totalPrice = quantity * pricePerUnit;
        
        await prisma.orderItem.create({
          data: {
            orderId: order.id,
            productId: product.id,
            quantity: quantity,
            unit: product.unit,
            pricePerUnit: pricePerUnit,
            totalPrice: totalPrice,
            notes: `Order item ${i + 1}`
          }
        });
      }
    }
    console.log('✅ Created order items');

    // Create bids
    console.log('💰 Creating bids...');
    for (let i = 0; i < 6; i++) {
      const order = orders[Math.floor(Math.random() * orders.length)];
      const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];
      
      await prisma.bid.create({
        data: {
          orderId: order.id,
          supplierId: supplier.id,
          totalAmount: order.totalAmount * (0.9 + Math.random() * 0.2), // 90-110% of order amount
          message: `Competitive bid from ${supplier.businessName}`,
          deliveryTime: new Date(Date.now() + Math.random() * 48 * 60 * 60 * 1000),
          validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
          status: ['PENDING', 'ACCEPTED', 'REJECTED'][Math.floor(Math.random() * 3)]
        }
      });
    }
    console.log('✅ Created bids');

    // Create payments
    console.log('💳 Creating payments...');
    for (let i = 0; i < 12; i++) {
      const vendor = vendors[Math.floor(Math.random() * vendors.length)];
      const order = orders[Math.floor(Math.random() * orders.length)];
      
      await prisma.payment.create({
        data: {
          vendorId: vendor.id,
          orderId: order.id,
          amount: Math.floor(Math.random() * 3000) + 500,
          type: ['ORDER_PAYMENT', 'CREDIT_REPAYMENT', 'REFUND'][Math.floor(Math.random() * 3)],
          method: ['CASH', 'PAY_LATER', 'UPI'][Math.floor(Math.random() * 3)],
          status: ['PENDING', 'PROCESSING', 'COMPLETED'][Math.floor(Math.random() * 3)],
          dueDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
          paidAt: Math.random() > 0.5 ? new Date() : null
        }
      });
    }
    console.log('✅ Created payments');

    // Create credit transactions
    console.log('💳 Creating credit transactions...');
    for (let i = 0; i < 15; i++) {
      const vendor = vendors[Math.floor(Math.random() * vendors.length)];
      const order = orders[Math.floor(Math.random() * orders.length)];
      
      await prisma.creditTransaction.create({
        data: {
          vendorId: vendor.id,
          amount: Math.floor(Math.random() * 2000) + 500,
          type: ['CREDIT_USED', 'CREDIT_REPAID', 'CREDIT_LIMIT_INCREASE'][Math.floor(Math.random() * 3)],
          description: `Credit transaction ${i + 1}`,
          orderId: order.id,
          interestRate: Math.random() > 0.7 ? 12.5 : null,
          dueDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
          paidAt: Math.random() > 0.6 ? new Date() : null,
          status: ['ACTIVE', 'PAID', 'OVERDUE'][Math.floor(Math.random() * 3)]
        }
      });
    }
    console.log('✅ Created credit transactions');

    // Create ratings
    console.log('⭐ Creating ratings...');
    for (let i = 0; i < 20; i++) {
      const fromVendor = vendors[Math.floor(Math.random() * vendors.length)];
      const toVendor = vendors[Math.floor(Math.random() * vendors.length)];
      const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];
      const order = orders[Math.floor(Math.random() * orders.length)];
      
      await prisma.rating.create({
        data: {
          fromVendorId: fromVendor.id,
          toVendorId: toVendor.id,
          supplierId: supplier.id,
          orderId: order.id,
          rating: Math.floor(Math.random() * 5) + 1,
          comment: `Great service! Rating ${i + 1}`
        }
      });
    }
    console.log('✅ Created ratings');

    // Create chat messages
    console.log('💬 Creating chat messages...');
    for (const group of groups) {
      const groupVendors = vendors.slice(0, Math.min(5, vendors.length));
      
      for (let i = 0; i < chatMessages.length; i++) {
        const vendor = groupVendors[i % groupVendors.length];
        const message = chatMessages[i];
        
        await prisma.chatMessage.create({
          data: {
            groupId: group.id,
            vendorId: vendor.id,
            message: message.message,
            messageType: message.messageType
          }
        });
      }
    }
    console.log('✅ Created chat messages');

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- ${vendors.length} vendors`);
    console.log(`- ${suppliers.length} suppliers`);
    console.log(`- ${products.length} products`);
    console.log(`- ${groups.length} buying groups`);
    console.log(`- ${orders.length} orders`);
    console.log(`- Multiple bids, payments, credit transactions, ratings, and chat messages`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedDatabase()
  .then(() => {
    console.log('✅ Seeding completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }); 