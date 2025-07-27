# Render Deployment Guide

## Prerequisites

1. A Render account
2. A PostgreSQL database (you can use Render's PostgreSQL service)
3. Environment variables configured

## Environment Variables Required

Set these in your Render service environment variables:

### Database
- `DATABASE_URL`: Your PostgreSQL connection string

### Security
- `JWT_SECRET`: A strong secret key for JWT tokens
- `NODE_ENV`: Set to "production"

### Frontend URL
- `CLIENT_URL`: Your frontend application URL

### Payment Gateway (Razorpay)
- `RAZORPAY_KEY_ID`: Your Razorpay key ID
- `RAZORPAY_KEY_SECRET`: Your Razorpay key secret

### SMS Service (Twilio)
- `TWILIO_ACCOUNT_SID`: Your Twilio account SID
- `TWILIO_AUTH_TOKEN`: Your Twilio auth token
- `TWILIO_PHONE_NUMBER`: Your Twilio phone number

### File Upload (Cloudinary)
- `CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name
- `CLOUDINARY_API_KEY`: Your Cloudinary API key
- `CLOUDINARY_API_SECRET`: Your Cloudinary API secret

### Redis (Optional)
- `REDIS_URL`: Your Redis connection URL

### Email Configuration (SMTP)
- `SMTP_HOST`: SMTP server host
- `SMTP_PORT`: SMTP server port
- `SMTP_USER`: SMTP username
- `SMTP_PASS`: SMTP password

### Rate Limiting
- `RATE_LIMIT_WINDOW_MS`: "900000" (15 minutes)
- `RATE_LIMIT_MAX_REQUESTS`: "100"

## Deployment Steps

1. **Connect your GitHub repository** to Render
2. **Create a new Web Service** in Render
3. **Configure the service**:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Environment: Node
4. **Set all environment variables** listed above
5. **Deploy the service**

## Database Setup

1. Create a PostgreSQL database in Render
2. Run migrations: `npx prisma migrate deploy`
3. Update your `DATABASE_URL` environment variable

## Health Check

Your API includes a health check endpoint at `/health` that you can use to verify the deployment.

## Notes

- The `render.yaml` file is configured for automatic deployment
- The build script is minimal since this is a JavaScript project
- Prisma client is generated during the postinstall step
- Make sure your database is accessible from Render's servers 