# VendorCircle 🏪

**Group Buying + Smart Credit Platform for Street Food Vendors**

VendorCircle is a comprehensive web application that empowers street food vendors to form buying groups for bulk purchasing while providing integrated "pay later" credit solutions. The platform connects vendors with suppliers and offers working capital solutions to help small businesses thrive.

## 🎯 Project Overview

### Core Features
- **Group Buying**: Vendors form groups with nearby vendors for bulk ingredient purchasing
- **Smart Credit System**: "Pay later" system allowing vendors to pay after daily sales
- **Supplier Network**: Verified suppliers bid on group orders with competitive pricing
- **Real-time Chat**: Group coordination and communication features
- **Trust Scoring**: Credit scoring system based on payment history and business stability
- **Mobile-First Design**: Optimized for smartphone users with 3G/4G connectivity

### User Types
1. **Street Food Vendors** (Primary Users) - Create orders, join groups, manage credit
2. **Suppliers/Wholesalers** - View orders, submit bids, manage deliveries
3. **Platform Admin** - Monitor operations, manage risk, oversee transactions

## 🏗 Technical Architecture

### Backend (Node.js + Express)
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Real-time**: Socket.io for group chat and notifications
- **Authentication**: JWT-based (simplified for demo - open website)
- **Payment Processing**: Razorpay integration (simulated for demo)
- **API Documentation**: RESTful APIs with comprehensive error handling

### Frontend (React + TypeScript)
- **Framework**: React 18 with TypeScript
- **Routing**: React Router for navigation
- **State Management**: React Query for server state, Zustand for client state
- **Styling**: Tailwind CSS with custom components
- **UI Components**: Headless UI with custom styling
- **Real-time**: Socket.io client for live updates
- **Mobile Optimization**: PWA-ready with offline support

### Key Technologies
- **Database**: PostgreSQL with comprehensive schema
- **ORM**: Prisma for type-safe database operations
- **WebSockets**: Real-time group communication
- **Geolocation**: Location-based group formation
- **Payment Gateway**: Razorpay (simulated)
- **SMS Service**: Twilio (configured)
- **File Upload**: Cloudinary (configured)

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL database
- npm or yarn package manager

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd haste_hackathon
```

2. **Backend Setup**
```bash
cd backend
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database and service credentials

# Run database migrations
npx prisma migrate dev
npx prisma generate

# Seed the database with sample products
npm run db:seed

# Start the backend server
npm run dev
```

3. **Frontend Setup**
```bash
cd ../frontend
npm install

# Start the frontend development server
npm start
```

### Environment Variables

Create `.env` file in the backend directory:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/vendorcircle_db"
JWT_SECRET="your-jwt-secret"
PORT=5000
NODE_ENV="development"

# Optional integrations (for production)
TWILIO_ACCOUNT_SID="your-twilio-sid"
TWILIO_AUTH_TOKEN="your-twilio-token"
RAZORPAY_KEY_ID="your-razorpay-key"
RAZORPAY_KEY_SECRET="your-razorpay-secret"
GOOGLE_MAPS_API_KEY="your-google-maps-key"
```

## 📱 Features Implemented

### ✅ Completed Features
- [x] **User Registration**: Vendor and Supplier onboarding with verification
- [x] **Product Catalog**: Comprehensive ingredient database with categories
- [x] **Order Management**: Create, track, and manage individual and group orders
- [x] **Group Formation**: Algorithm-based matching of vendors by proximity and needs
- [x] **Credit System**: Smart credit scoring with payment tracking
- [x] **Supplier Bidding**: Competitive bidding system for group orders
- [x] **Real-time Chat**: Group communication with Socket.io
- [x] **Payment Processing**: Integrated payment flows (simulated)
- [x] **Mobile-First UI**: Responsive design optimized for mobile devices
- [x] **Dashboard Analytics**: Vendor and supplier performance metrics

### 🔄 In Progress
- [ ] **Advanced Group Matching**: ML-based vendor compatibility scoring
- [ ] **Offline Support**: PWA features for limited connectivity
- [ ] **Push Notifications**: Real-time alerts for mobile users

### 📋 Planned Features
- [ ] **Delivery Tracking**: GPS-based order tracking
- [ ] **Review System**: Vendor and supplier rating mechanisms
- [ ] **Advanced Analytics**: Business intelligence dashboard
- [ ] **Multi-language Support**: Regional language interfaces

## 🎨 Design System

### Color Palette
- **Primary Blue**: #2563eb (trust, reliability)
- **Success Green**: #059669 (savings, growth)
- **Warning Orange**: #f59e0b (attention, urgency)
- **Background**: Clean whites and subtle grays
- **Accent**: Warm orange for call-to-action elements

### Mobile-First Approach
- Touch-optimized interface elements
- Large fonts and high contrast for outdoor visibility
- Minimal data usage for 3G networks
- Offline functionality for core features
- Battery-efficient design patterns

## 💼 Business Model

### Revenue Streams
- **Transaction Fees**: 3% on pay-later transactions
- **Group Coordination**: 1% on successful group orders
- **Supplier Listing**: Premium supplier subscriptions
- **Credit Services**: Interest on extended payment terms
- **Data Insights**: Market intelligence for FMCG companies

### Unit Economics
- Average Order Value: ₹1,500
- Monthly Orders per Vendor: 25
- Monthly Revenue per Vendor: ₹1,125
- Customer Acquisition Cost: ₹500
- Payback Period: 0.5 months

## 📊 Database Schema

### Core Models
- **Vendors**: User profiles with business and credit information
- **Suppliers**: Wholesale vendors with delivery areas and categories
- **Products**: Ingredient catalog with pricing and descriptions
- **Orders**: Individual and group purchase orders
- **BuyingGroups**: Group coordination and member management
- **Payments**: Transaction tracking and credit management
- **Bids**: Supplier bidding system for group orders

### Key Relationships
- Vendors ↔ Groups (many-to-many through memberships)
- Orders → Products (one-to-many through order items)
- Groups → Orders (one-to-many for group purchases)
- Suppliers → Bids → Orders (bidding relationship)

## 🛡 Security & Compliance

### Data Protection
- Encrypted sensitive data in transit and at rest
- Minimal personal data collection
- PCI compliance for payment processing
- Regular security audits and updates

### Fraud Prevention
- Trust scoring algorithm
- Unusual pattern recognition
- Group guarantee system for credit risk
- Community-based dispute resolution

## 🚀 Deployment

### Production Setup
```bash
# Backend deployment
cd backend
npm run build
npm start

# Frontend deployment
cd frontend
npm run build
# Deploy build/ directory to CDN/hosting service
```

### Recommended Stack
- **Backend**: Railway, Heroku, or AWS EC2
- **Database**: PostgreSQL on Railway or AWS RDS
- **Frontend**: Vercel, Netlify, or AWS S3+CloudFront
- **Real-time**: Socket.io with Redis adapter
- **Monitoring**: Sentry for error tracking

## 📞 Support & Documentation

### API Documentation
- REST API endpoints with OpenAPI specification
- WebSocket event documentation
- Integration guides for payment gateways
- Mobile app development guidelines

### Community
- GitHub Issues for bug reports
- Feature requests and enhancement proposals
- Contributing guidelines for developers
- Code of conduct for community interaction

## 📈 Impact & Vision

### Target Metrics
- **2,500+ Active Vendors** by end of year 1
- **₹50L+ Money Saved** through group buying
- **150+ Verified Suppliers** in the network
- **800+ Groups Formed** with successful transactions

### Long-term Vision
VendorCircle aims to become the primary financial and operational infrastructure for India's street food ecosystem, empowering millions of micro-entrepreneurs with technology, credit access, and community support.

---

**Built with ❤️ for Street Food Vendors across India**

*VendorCircle v1.0 - Bringing Vendors Together*