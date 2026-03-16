# Database Documentation

## Overview

MobileSmartStore connects to a MongoDB database managed by the NewSmartStorePay backend server. This folder contains documentation about the database schema and structure.

## Database Information

- **Database Name**: `smartstorepay`
- **Database Type**: MongoDB (NoSQL)
- **Connection**: Managed by backend server
- **Access**: Via REST API endpoints only

## Collections

The database contains three main collections:

### 1. cards
Stores RFID card information and balances.

### 2. transactions
Records all financial transactions (top-ups and payments).

### 3. products
Catalog of available products for purchase.

## Schema Details

See the following files for detailed schema information:
- `schema.md` - Complete schema definitions
- `sample_data.json` - Example data for testing
- `queries.md` - Common database queries

## Important Notes

- The mobile app does NOT directly access the database
- All database operations go through the backend REST API
- MongoDB connection string is stored in backend `.env` file
- Database is the single source of truth for all balances and transactions
