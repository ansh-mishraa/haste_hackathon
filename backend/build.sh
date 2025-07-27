#!/bin/bash

# Build script for Render deployment

echo "Starting build process..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Run database migrations (if needed)
echo "Running database migrations..."
npx prisma migrate deploy

echo "Build completed successfully!" 