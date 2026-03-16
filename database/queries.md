# Common Database Queries

This document contains common MongoDB queries used by the backend API.

## Cards Queries

### Get all cards
```javascript
db.cards.find().sort({ updatedAt: -1 })
```

### Find card by UID
```javascript
db.cards.findOne({ uid: "A1B2C3D4" })
```

### Get cards with low balance (< $10)
```javascript
db.cards.find({ balance: { $lt: 1000 } })
```

### Get total balance across all cards
```javascript
db.cards.aggregate([
  {
    $group: {
      _id: null,
      totalBalance: { $sum: "$balance" },
      totalCards: { $sum: 1 }
    }
  }
])
```

### Find cards by holder name (case-insensitive)
```javascript
db.cards.find({ 
  holderName: { $regex: "john", $options: "i" } 
})
```

### Get recently updated cards (last 24 hours)
```javascript
const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
db.cards.find({ 
  updatedAt: { $gte: yesterday } 
}).sort({ updatedAt: -1 })
```

---

## Transactions Queries

### Get all transactions for a card
```javascript
db.transactions.find({ 
  uid: "A1B2C3D4" 
}).sort({ timestamp: -1 })
```

### Get recent transactions (last 50)
```javascript
db.transactions.find()
  .sort({ timestamp: -1 })
  .limit(50)
```

### Get transactions by type
```javascript
// Top-ups only
db.transactions.find({ type: "TOPUP" })

// Payments only
db.transactions.find({ type: "PAYMENT" })
```

### Get transactions in date range
```javascript
db.transactions.find({
  timestamp: {
    $gte: new Date("2024-03-01"),
    $lte: new Date("2024-03-31")
  }
}).sort({ timestamp: -1 })
```

### Calculate total top-ups for a card
```javascript
db.transactions.aggregate([
  { $match: { uid: "A1B2C3D4", type: "TOPUP" } },
  { $group: { _id: null, total: { $sum: "$amount" } } }
])
```

### Calculate total payments for a card
```javascript
db.transactions.aggregate([
  { $match: { uid: "A1B2C3D4", type: "PAYMENT" } },
  { $group: { _id: null, total: { $sum: "$amount" } } }
])
```

### Get transaction count by type
```javascript
db.transactions.aggregate([
  {
    $group: {
      _id: "$type",
      count: { $sum: 1 },
      totalAmount: { $sum: "$amount" }
    }
  }
])
```

### Get daily transaction summary
```javascript
db.transactions.aggregate([
  {
    $group: {
      _id: {
        date: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
        type: "$type"
      },
      count: { $sum: 1 },
      totalAmount: { $sum: "$amount" }
    }
  },
  { $sort: { "_id.date": -1 } }
])
```

### Find large transactions (> $50)
```javascript
db.transactions.find({ 
  amount: { $gt: 5000 } 
}).sort({ amount: -1 })
```

---

## Products Queries

### Get all active products
```javascript
db.products.find({ active: true }).sort({ price: 1 })
```

### Get products by category
```javascript
db.products.find({ 
  category: "Beverages",
  active: true 
}).sort({ price: 1 })
```

### Get products in price range
```javascript
// Products between $5 and $10
db.products.find({
  price: { $gte: 500, $lte: 1000 },
  active: true
})
```

### Get most expensive products
```javascript
db.products.find({ active: true })
  .sort({ price: -1 })
  .limit(10)
```

### Get product categories
```javascript
db.products.distinct("category")
```

### Count products by category
```javascript
db.products.aggregate([
  { $match: { active: true } },
  {
    $group: {
      _id: "$category",
      count: { $sum: 1 },
      avgPrice: { $avg: "$price" }
    }
  },
  { $sort: { count: -1 } }
])
```

---

## Analytics Queries

### Dashboard statistics
```javascript
// Get all stats in one query
db.cards.aggregate([
  {
    $facet: {
      cardStats: [
        {
          $group: {
            _id: null,
            totalCards: { $sum: 1 },
            totalBalance: { $sum: "$balance" }
          }
        }
      ],
      transactionStats: [
        {
          $lookup: {
            from: "transactions",
            pipeline: [],
            as: "allTransactions"
          }
        },
        { $unwind: "$allTransactions" },
        {
          $group: {
            _id: "$allTransactions.type",
            count: { $sum: 1 }
          }
        }
      ]
    }
  }
])
```

### Top spending cards
```javascript
db.transactions.aggregate([
  { $match: { type: "PAYMENT" } },
  {
    $group: {
      _id: "$uid",
      totalSpent: { $sum: "$amount" },
      transactionCount: { $sum: 1 }
    }
  },
  { $sort: { totalSpent: -1 } },
  { $limit: 10 },
  {
    $lookup: {
      from: "cards",
      localField: "_id",
      foreignField: "uid",
      as: "cardInfo"
    }
  }
])
```

### Most popular products
```javascript
db.transactions.aggregate([
  { $match: { type: "PAYMENT" } },
  {
    $group: {
      _id: "$productId",
      productName: { $first: "$productName" },
      timesSold: { $sum: 1 },
      revenue: { $sum: "$amount" }
    }
  },
  { $sort: { timesSold: -1 } },
  { $limit: 10 }
])
```

### Revenue by category
```javascript
db.transactions.aggregate([
  { $match: { type: "PAYMENT" } },
  {
    $lookup: {
      from: "products",
      localField: "productId",
      foreignField: "_id",
      as: "product"
    }
  },
  { $unwind: "$product" },
  {
    $group: {
      _id: "$product.category",
      revenue: { $sum: "$amount" },
      itemsSold: { $sum: 1 }
    }
  },
  { $sort: { revenue: -1 } }
])
```

### Monthly revenue trend
```javascript
db.transactions.aggregate([
  { $match: { type: "PAYMENT" } },
  {
    $group: {
      _id: {
        year: { $year: "$timestamp" },
        month: { $month: "$timestamp" }
      },
      revenue: { $sum: "$amount" },
      transactions: { $sum: 1 }
    }
  },
  { $sort: { "_id.year": -1, "_id.month": -1 } }
])
```

---

## Maintenance Queries

### Find duplicate cards
```javascript
db.cards.aggregate([
  {
    $group: {
      _id: "$uid",
      count: { $sum: 1 },
      ids: { $push: "$_id" }
    }
  },
  { $match: { count: { $gt: 1 } } }
])
```

### Find orphaned transactions (card doesn't exist)
```javascript
db.transactions.aggregate([
  {
    $lookup: {
      from: "cards",
      localField: "uid",
      foreignField: "uid",
      as: "card"
    }
  },
  { $match: { card: { $size: 0 } } }
])
```

### Find transactions with invalid products
```javascript
db.transactions.aggregate([
  { $match: { type: "PAYMENT" } },
  {
    $lookup: {
      from: "products",
      localField: "productId",
      foreignField: "_id",
      as: "product"
    }
  },
  { $match: { product: { $size: 0 } } }
])
```

### Archive old transactions (older than 1 year)
```javascript
const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);

// Copy to archive collection
db.transactions.find({ 
  timestamp: { $lt: oneYearAgo } 
}).forEach(doc => {
  db.transactions_archive.insert(doc);
});

// Delete from main collection
db.transactions.deleteMany({ 
  timestamp: { $lt: oneYearAgo } 
})
```

### Rebuild indexes
```javascript
db.cards.reIndex()
db.transactions.reIndex()
db.products.reIndex()
```

---

## Data Validation Queries

### Check for negative balances
```javascript
db.cards.find({ balance: { $lt: 0 } })
```

### Check for balance inconsistencies
```javascript
db.transactions.aggregate([
  { $sort: { uid: 1, timestamp: 1 } },
  {
    $group: {
      _id: "$uid",
      lastBalance: { $last: "$balanceAfter" }
    }
  },
  {
    $lookup: {
      from: "cards",
      localField: "_id",
      foreignField: "uid",
      as: "card"
    }
  },
  { $unwind: "$card" },
  {
    $project: {
      uid: "$_id",
      transactionBalance: "$lastBalance",
      cardBalance: "$card.balance",
      mismatch: {
        $ne: ["$lastBalance", "$card.balance"]
      }
    }
  },
  { $match: { mismatch: true } }
])
```

### Find transactions with invalid amounts
```javascript
db.transactions.find({
  $or: [
    { amount: { $lte: 0 } },
    { amount: null }
  ]
})
```

---

## Performance Tips

1. **Use indexes**: Ensure queries use indexed fields
2. **Limit results**: Always use `.limit()` for large datasets
3. **Project fields**: Only select needed fields with `.project()`
4. **Avoid $where**: Use native operators instead
5. **Use aggregation**: For complex queries, aggregation is faster
6. **Monitor slow queries**: Enable profiling to find bottlenecks

```javascript
// Enable profiling
db.setProfilingLevel(1, { slowms: 100 })

// View slow queries
db.system.profile.find().sort({ ts: -1 }).limit(10)
```
