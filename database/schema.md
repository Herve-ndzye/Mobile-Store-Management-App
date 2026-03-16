# Database Schema

## MongoDB Collections

### 1. cards Collection

Stores RFID card information and current balances.

**Collection Name**: `cards`

**Schema**:
```javascript
{
  _id: ObjectId,                    // MongoDB auto-generated ID
  card_uid: String,                 // Card UID (unique, indexed)
  uid: String,                      // Alias for card_uid (backwards compatibility)
  holderName: String,               // Cardholder's name
  balance: Number,                  // Current balance in cents
  lastTopup: Number,                // Last top-up amount in cents
  createdAt: Date,                  // Card creation timestamp
  updatedAt: Date                   // Last update timestamp
}
```

**Indexes**:
- `card_uid`: Unique index
- `uid`: Unique index

**Example Document**:
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "card_uid": "A1B2C3D4",
  "uid": "A1B2C3D4",
  "holderName": "John Doe",
  "balance": 10000,
  "lastTopup": 5000,
  "createdAt": "2024-03-16T10:00:00.000Z",
  "updatedAt": "2024-03-16T12:30:00.000Z"
}
```

**Field Details**:
- `balance`: Stored in cents (10000 = $100.00)
- `lastTopup`: Amount of most recent top-up in cents
- `card_uid` and `uid`: Always kept in sync
- `holderName`: Default is "New User" for auto-created cards

**Constraints**:
- `card_uid` must be unique
- `holderName` is required
- `balance` defaults to 0
- `lastTopup` defaults to 0

---

### 2. transactions Collection

Records all financial transactions (top-ups and payments).

**Collection Name**: `transactions`

**Schema**:
```javascript
{
  _id: ObjectId,                    // MongoDB auto-generated ID
  card_uid: String,                 // Card UID (indexed)
  uid: String,                      // Alias for card_uid (indexed)
  amount: Number,                   // Transaction amount in cents
  type: String,                     // "TOPUP" or "PAYMENT"
  balanceBefore: Number,            // Balance before transaction (cents)
  balanceAfter: Number,             // Balance after transaction (cents)
  description: String,              // Human-readable description
  productId: ObjectId,              // Reference to product (payments only)
  productName: String,              // Product name (payments only)
  timestamp: Date                   // Transaction timestamp
}
```

**Indexes**:
- `card_uid`: Non-unique index for fast lookups
- `uid`: Non-unique index for backwards compatibility
- `timestamp`: For sorting by date

**Example Documents**:

**Top-up Transaction**:
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "card_uid": "A1B2C3D4",
  "uid": "A1B2C3D4",
  "amount": 5000,
  "type": "TOPUP",
  "balanceBefore": 5000,
  "balanceAfter": 10000,
  "description": "Top-up of 5000",
  "timestamp": "2024-03-16T12:30:00.000Z"
}
```

**Payment Transaction**:
```json
{
  "_id": "507f1f77bcf86cd799439013",
  "card_uid": "A1B2C3D4",
  "uid": "A1B2C3D4",
  "amount": 1000,
  "type": "PAYMENT",
  "balanceBefore": 10000,
  "balanceAfter": 9000,
  "description": "Payment for Coffee x2",
  "productId": "507f1f77bcf86cd799439020",
  "productName": "Coffee",
  "timestamp": "2024-03-16T13:00:00.000Z"
}
```

**Field Details**:
- `amount`: Always positive, stored in cents
- `type`: Enum - only "TOPUP" or "PAYMENT"
- `balanceBefore`/`balanceAfter`: Audit trail for balance changes
- `productId`: Only present for PAYMENT transactions
- `productName`: Denormalized for faster queries
- `timestamp`: Auto-set to current time

**Constraints**:
- `card_uid` is required
- `amount` must be positive
- `type` must be "TOPUP" or "PAYMENT"
- `balanceBefore` and `balanceAfter` are required
- `productId` required for PAYMENT type

---

### 3. products Collection

Catalog of products available for purchase.

**Collection Name**: `products`

**Schema**:
```javascript
{
  _id: ObjectId,                    // MongoDB auto-generated ID
  name: String,                     // Product name
  price: Number,                    // Price in cents
  category: String,                 // Product category
  emoji: String,                    // Emoji icon for UI
  active: Boolean                   // Whether product is available
}
```

**Indexes**:
- `active`: For filtering active products
- `category`: For category-based queries

**Example Document**:
```json
{
  "_id": "507f1f77bcf86cd799439020",
  "name": "Coffee",
  "price": 750,
  "category": "Beverages",
  "emoji": "☕",
  "active": true
}
```

**Field Details**:
- `price`: Stored in cents (750 = $7.50)
- `category`: Groups products (Beverages, Food, Snacks, etc.)
- `emoji`: Unicode emoji for mobile UI
- `active`: Soft delete flag (false = hidden from catalog)

**Constraints**:
- `name` is required
- `price` must be positive
- `category` defaults to "General"
- `emoji` defaults to "📦"
- `active` defaults to true

**Categories**:
- Beverages
- Food
- Snacks
- Stationery
- Electronics
- Personal Care
- Clothing
- Sports

---

## Relationships

```
┌─────────────┐
│   cards     │
│  (card_uid) │
└──────┬──────┘
       │
       │ 1:N
       │
       ↓
┌─────────────────┐
│  transactions   │
│   (card_uid)    │
└──────┬──────────┘
       │
       │ N:1
       │
       ↓
┌─────────────┐
│  products   │
│    (_id)    │
└─────────────┘
```

- One card can have many transactions
- One product can be in many transactions
- Transactions reference both cards and products

---

## Data Integrity Rules

### Atomicity
All wallet operations (top-up, payment) use MongoDB transactions to ensure:
- Card balance updates and transaction records are atomic
- No partial updates if operation fails
- Consistent state across collections

### Balance Consistency
- Card balance is the source of truth
- Transaction records provide audit trail
- `balanceBefore` + `amount` (TOPUP) = `balanceAfter`
- `balanceBefore` - `amount` (PAYMENT) = `balanceAfter`

### Validation Rules
1. **Top-up**:
   - Amount must be positive
   - Holder name required for new cards
   - Balance cannot exceed reasonable limits

2. **Payment**:
   - Product must exist and be active
   - Card must exist
   - Balance must be sufficient
   - Quantity must be positive

---

## Indexes for Performance

```javascript
// cards collection
db.cards.createIndex({ "card_uid": 1 }, { unique: true })
db.cards.createIndex({ "uid": 1 }, { unique: true })
db.cards.createIndex({ "updatedAt": -1 })

// transactions collection
db.transactions.createIndex({ "card_uid": 1 })
db.transactions.createIndex({ "uid": 1 })
db.transactions.createIndex({ "timestamp": -1 })
db.transactions.createIndex({ "type": 1 })

// products collection
db.products.createIndex({ "active": 1 })
db.products.createIndex({ "category": 1 })
db.products.createIndex({ "price": 1 })
```

---

## Data Size Estimates

### Per Document
- Card: ~200 bytes
- Transaction: ~300 bytes
- Product: ~150 bytes

### Growth Projections
- 1000 cards = ~200 KB
- 10,000 transactions/month = ~3 MB/month
- 100 products = ~15 KB

### Recommended Limits
- Max cards: 100,000 (20 MB)
- Max transactions: Keep last 12 months (~36 MB)
- Archive old transactions to separate collection

---

## Backup Strategy

### Recommended Approach
1. **Daily backups**: Full database dump
2. **Retention**: Keep 30 days of backups
3. **Testing**: Monthly restore tests
4. **Location**: Off-site storage

### MongoDB Backup Commands
```bash
# Backup entire database
mongodump --db smartstorepay --out /backup/$(date +%Y%m%d)

# Backup specific collection
mongodump --db smartstorepay --collection transactions --out /backup/transactions

# Restore database
mongorestore --db smartstorepay /backup/20240316/smartstorepay
```

---

## Migration Notes

### From Legacy System
If migrating from OldSmartPay:
1. Map old card IDs to new card_uid format
2. Convert balances to cents if stored in dollars
3. Migrate transaction history with proper timestamps
4. Update product prices to cents

### Schema Versioning
- Current version: 1.0
- Changes tracked in backend CHANGELOG.md
- Migrations handled by backend startup scripts
