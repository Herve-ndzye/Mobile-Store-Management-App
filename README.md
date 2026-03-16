# MobileSmartStore

A React Native mobile application for the SmartStorePay system, providing interfaces for agents, salespersons, and system administrators.

## Overview

MobileSmartStore is a cross-platform mobile application built with React Native and Expo that enables:
- **Agent Interface**: Top-up RFID cards with credit
- **Salesperson Interface**: Process payments for products
- **Dashboard**: View system statistics and transaction history

## Architecture

```
┌─────────────────────────────────────────┐
│         MobileSmartStore App            │
│      (React Native + Expo)              │
└──────────────┬──────────────────────────┘
               │ HTTP REST + Socket.IO
               ↓
┌─────────────────────────────────────────┐
│      Backend Server (External)          │
│      http://10.11.74.149:8255           │
│      - REST API                         │
│      - Socket.IO (Real-time)            │
│      - MQTT Client                      │
└──────────────┬──────────────────────────┘
               │ MQTT
               ↓
┌─────────────────────────────────────────┐
│      MQTT Broker                        │
│      mqtt://157.173.101.159:1883       │
└──────────────┬──────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────┐
│      Arduino/ESP8266 + RFID Reader      │
└─────────────────────────────────────────┘
```

## Project Structure

```
MobileSmartStore/
├── mobile_app/              # React Native application
│   ├── app/                 # Expo Router screens
│   │   ├── agent/          # Agent top-up interface
│   │   ├── salesperson/    # Sales checkout interface
│   │   ├── dashboard/      # System dashboard
│   │   ├── index.tsx       # Login/role selection
│   │   └── _layout.tsx     # Root layout
│   └── src/
│       └── services/
│           └── api.ts      # API client & Socket.IO
├── docs/                    # Documentation
│   └── mqtt_topics.md      # MQTT topic specifications
├── package.json
├── tsconfig.json
└── README.md
```

## Features

### Agent Interface
- Real-time RFID card scanning
- Top-up cards with custom or quick amounts ($10, $25, $50, $100)
- Create new cardholder accounts
- View current card balance

### Salesperson Interface
- Multi-product selection with shopping cart
- Quantity controls for each product
- Real-time card scanning for payment
- Product catalog with prices and emojis
- Transaction confirmation

### Dashboard
- Total system balance across all cards
- Total cards registered
- Transaction count (Top-ups and Payments)
- Recent transaction history
- Real-time updates via Socket.IO

## Technology Stack

- **Framework**: React Native 0.81.5
- **Navigation**: Expo Router 6.0.23
- **UI**: React Native components with custom styling
- **State Management**: React Hooks (useState, useEffect)
- **Real-time**: Socket.IO Client 4.7.5
- **HTTP Client**: Fetch API
- **Styling**: StyleSheet API with dark theme

## Setup & Installation

### Prerequisites
- Node.js 16+ and npm
- Expo CLI
- iOS Simulator (Mac) or Android Emulator
- Expo Go app (for physical device testing)

### Installation

1. Install dependencies:
```bash
cd MobileSmartStore
npm install
```

2. Configure backend URL:
Edit `src/services/api.ts` and update the `BASE_URL`:
```typescript
export const BASE_URL = "http://YOUR_BACKEND_IP:8255";
```

3. Start the development server:
```bash
npm start
```

4. Run on device/emulator:
- **iOS**: Press `i` or scan QR code with Camera app
- **Android**: Press `a` or scan QR code with Expo Go
- **Web**: Press `w`

## Configuration

### Backend Connection

The app connects to an external backend server. Update the IP address in `src/services/api.ts`:

```typescript
// For local testing on same machine
export const BASE_URL = "http://localhost:8255";

// For testing on physical device (use computer's IP)
export const BASE_URL = "http://192.168.x.x:8255";

// For production
export const BASE_URL = "http://157.173.101.159:8255";
```

### Network Requirements

- Mobile device and backend server must be on the same network
- Backend server port 8255 must be accessible
- Firewall should allow connections on port 8255

## API Endpoints

The app communicates with the following backend endpoints:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/topup` | POST | Add credit to a card |
| `/pay` | POST | Process payment for products |
| `/products` | GET | Fetch available products |
| `/cards` | GET | Get all registered cards |
| `/transactions` | GET | Fetch transaction history |

## Socket.IO Events

### Listening Events
- `card-status`: Triggered when RFID card is scanned
- `transaction-update`: Real-time transaction notifications
- `connect`: Socket connection established
- `disconnect`: Socket connection lost

### Event Payloads

**card-status**:
```json
{
  "uid": "ABC123",
  "balance": 5000,
  "holderName": "John Doe",
  "status": "detected"
}
```

**transaction-update**:
```json
{
  "card_uid": "ABC123",
  "operation_type": "TOPUP" | "PAYMENT",
  "amount": 5000,
  "new_balance": 10000,
  "status": "success"
}
```

## Data Format

All monetary amounts are stored in cents:
- $5.00 = 500 cents
- $10.00 = 1000 cents
- $50.00 = 5000 cents

## Troubleshooting

### Cannot connect to backend
- Verify backend server is running
- Check IP address in `api.ts` matches your backend
- Ensure device and server are on same network
- Check firewall settings

### Card not detected
- Verify MQTT broker is running
- Check Arduino/ESP8266 is connected
- Ensure backend MQTT client is subscribed to topics

### Socket.IO not connecting
- Check backend Socket.IO server is running
- Verify CORS settings allow your device IP
- Check network connectivity

## Development

### Running Tests
```bash
npm test
```

### Building for Production
```bash
# iOS
npm run ios

# Android
npm run android
```

### Code Structure

- **Screens**: Each role has its own screen in `app/`
- **Services**: API and Socket.IO logic in `src/services/`
- **Styling**: Inline StyleSheet with consistent dark theme
- **Navigation**: File-based routing with Expo Router

## Contributing

1. Create a feature branch
2. Make your changes
3. Test on both iOS and Android
4. Submit a pull request

## License

MIT License

## Support

For issues or questions, please contact the development team.
