# MQTT Topics Documentation

## Overview

The SmartStorePay system uses MQTT (Message Queuing Telemetry Transport) for communication between the Arduino/ESP8266 RFID reader and the backend server.

## MQTT Broker Configuration

```
Host: 157.173.101.159
Port: 1883
Protocol: MQTT over TCP
Team ID: Mavics
```

## Topic Structure

All topics follow the pattern: `rfid/{TEAM_ID}/{category}/{action}`

Where:
- `{TEAM_ID}` = "Mavics"
- `{category}` = card | device
- `{action}` = specific operation

## Topics

### 1. Card Status Topic
**Topic**: `rfid/Mavics/card/status`  
**Direction**: Arduino → Backend  
**Purpose**: Notify when an RFID card is detected

**Payload**:
```json
{
  "uid": "ABC123DEF456",
  "balance": 5000,
  "status": "detected",
  "ts": 1234567890
}
```

**Fields**:
- `uid` (string): Unique card identifier (hex format, uppercase)
- `balance` (number): Current card balance in cents (simulated on Arduino)
- `status` (string): Always "detected" for card scans
- `ts` (number): Unix timestamp

**Example**:
```json
{
  "uid": "A1B2C3D4",
  "balance": 5000,
  "status": "detected",
  "ts": 1710614400
}
```

---

### 2. Card Balance Topic
**Topic**: `rfid/Mavics/card/balance`  
**Direction**: Arduino → Backend  
**Purpose**: Confirm balance updates after top-up or payment

**Payload**:
```json
{
  "uid": "ABC123DEF456",
  "new_balance": 10000,
  "status": "success",
  "ts": 1234567890
}
```

**Fields**:
- `uid` (string): Card identifier
- `new_balance` (number): Updated balance in cents
- `status` (string): "success" or "error"
- `ts` (number): Unix timestamp

**Example**:
```json
{
  "uid": "A1B2C3D4",
  "new_balance": 10000,
  "status": "success",
  "ts": 1710614401
}
```

---

### 3. Card Top-up Topic
**Topic**: `rfid/Mavics/card/topup`  
**Direction**: Backend → Arduino  
**Purpose**: Command to update card balance after top-up

**Payload**:
```json
{
  "uid": "ABC123DEF456",
  "amount": 5000,
  "newBalance": 10000
}
```

**Fields**:
- `uid` (string): Card identifier
- `amount` (number): Top-up amount in cents
- `newBalance` (number): New total balance in cents

**Example**:
```json
{
  "uid": "A1B2C3D4",
  "amount": 5000,
  "newBalance": 10000
}
```

**Flow**:
1. Backend receives HTTP POST to `/topup`
2. Backend updates database
3. Backend publishes to `rfid/Mavics/card/topup`
4. Arduino receives message
5. Arduino publishes confirmation to `rfid/Mavics/card/balance`

---

### 4. Card Payment Topic
**Topic**: `rfid/Mavics/card/pay`  
**Direction**: Backend → Arduino  
**Purpose**: Command to deduct payment from card balance

**Payload**:
```json
{
  "card_uid": "ABC123DEF456",
  "product_id": "507f1f77bcf86cd799439011",
  "quantity": 2,
  "amount": 1000,
  "newBalance": 9000
}
```

**Fields**:
- `card_uid` (string): Card identifier
- `product_id` (string): MongoDB ObjectId of product
- `quantity` (number): Number of items purchased
- `amount` (number): Total payment amount in cents
- `newBalance` (number): Remaining balance in cents

**Example**:
```json
{
  "card_uid": "A1B2C3D4",
  "product_id": "507f1f77bcf86cd799439011",
  "quantity": 2,
  "amount": 1000,
  "newBalance": 9000
}
```

**Flow**:
1. Backend receives HTTP POST to `/pay`
2. Backend validates product and balance
3. Backend updates database
4. Backend publishes to `rfid/Mavics/card/pay`
5. Arduino receives message
6. Arduino publishes confirmation to `rfid/Mavics/card/balance`

---

### 5. Device Health Topic
**Topic**: `rfid/Mavics/device/health`  
**Direction**: Arduino → Backend  
**Purpose**: Periodic health check (every 60 seconds)

**Payload**:
```json
{
  "status": "online",
  "ip": "10.11.74.149",
  "rssi": -45,
  "ts": 1234567890
}
```

**Fields**:
- `status` (string): "online" or "offline"
- `ip` (string): Arduino's IP address
- `rssi` (number): WiFi signal strength in dBm
- `ts` (number): Unix timestamp

**Example**:
```json
{
  "status": "online",
  "ip": "10.11.74.149",
  "rssi": -45,
  "ts": 1710614400
}
```

---

### 6. Device Status Topic (LWT)
**Topic**: `rfid/Mavics/device/status`  
**Direction**: Arduino → Backend (via MQTT broker)  
**Purpose**: Last Will and Testament - notifies when device disconnects

**Payload**:
```json
{
  "status": "offline",
  "ts": 1234567890
}
```

**Note**: This topic is configured as MQTT Last Will and Testament (LWT). The broker automatically publishes this message when the Arduino disconnects unexpectedly.

---

## Message Flow Diagrams

### Card Scan Flow
```
┌─────────┐         ┌──────────┐         ┌─────────┐
│ Arduino │         │   MQTT   │         │ Backend │
└────┬────┘         └────┬─────┘         └────┬────┘
     │                   │                    │
     │ Card detected     │                    │
     │                   │                    │
     │ PUBLISH           │                    │
     │ rfid/Mavics/card/status               │
     ├──────────────────>│                    │
     │                   │ FORWARD            │
     │                   ├───────────────────>│
     │                   │                    │
     │                   │                    │ Store in DB
     │                   │                    │ Emit Socket.IO
     │                   │                    │
```

### Top-up Flow
```
┌─────────┐         ┌──────────┐         ┌─────────┐
│ Arduino │         │   MQTT   │         │ Backend │
└────┬────┘         └────┬─────┘         └────┬────┘
     │                   │                    │
     │                   │                    │ HTTP POST /topup
     │                   │                    │ Update DB
     │                   │                    │
     │                   │ PUBLISH            │
     │                   │ rfid/Mavics/card/topup
     │                   │<───────────────────┤
     │ RECEIVE           │                    │
     │<──────────────────┤                    │
     │                   │                    │
     │ PUBLISH           │                    │
     │ rfid/Mavics/card/balance              │
     ├──────────────────>│                    │
     │                   │ FORWARD            │
     │                   ├───────────────────>│
     │                   │                    │
     │                   │                    │ Emit Socket.IO
```

### Payment Flow
```
┌─────────┐         ┌──────────┐         ┌─────────┐
│ Arduino │         │   MQTT   │         │ Backend │
└────┬────┘         └────┬─────┘         └────┬────┘
     │                   │                    │
     │                   │                    │ HTTP POST /pay
     │                   │                    │ Validate & Update DB
     │                   │                    │
     │                   │ PUBLISH            │
     │                   │ rfid/Mavics/card/pay
     │                   │<───────────────────┤
     │ RECEIVE           │                    │
     │<──────────────────┤                    │
     │                   │                    │
     │ PUBLISH           │                    │
     │ rfid/Mavics/card/balance              │
     ├──────────────────>│                    │
     │                   │ FORWARD            │
     │                   ├───────────────────>│
     │                   │                    │
     │                   │                    │ Emit Socket.IO
```

## QoS Levels

All topics use **QoS 0** (At most once delivery):
- Fast delivery
- No acknowledgment required
- Suitable for real-time card scanning
- Lost messages are acceptable (card can be scanned again)

## Retained Messages

**None of the topics use retained messages** to ensure:
- Fresh data only
- No stale card status
- Real-time operation

## Security Considerations

### Current Implementation
- No authentication (open broker)
- No encryption (plain TCP)
- Suitable for local/trusted networks only

### Production Recommendations
1. Enable MQTT authentication (username/password)
2. Use TLS/SSL encryption (port 8883)
3. Implement topic-level ACLs
4. Use client certificates for Arduino
5. Firewall rules to restrict broker access

## Testing MQTT Topics

### Using mosquitto_sub (Subscribe)
```bash
# Subscribe to all topics
mosquitto_sub -h 157.173.101.159 -p 1883 -t "rfid/Mavics/#" -v

# Subscribe to card status only
mosquitto_sub -h 157.173.101.159 -p 1883 -t "rfid/Mavics/card/status" -v

# Subscribe to device health
mosquitto_sub -h 157.173.101.159 -p 1883 -t "rfid/Mavics/device/health" -v
```

### Using mosquitto_pub (Publish)
```bash
# Simulate card scan
mosquitto_pub -h 157.173.101.159 -p 1883 \
  -t "rfid/Mavics/card/status" \
  -m '{"uid":"TEST1234","balance":5000,"status":"detected","ts":1710614400}'

# Simulate top-up command
mosquitto_pub -h 157.173.101.159 -p 1883 \
  -t "rfid/Mavics/card/topup" \
  -m '{"uid":"TEST1234","amount":5000,"newBalance":10000}'
```

## Troubleshooting

### Arduino not publishing
1. Check WiFi connection
2. Verify MQTT broker IP and port
3. Check topic names (case-sensitive)
4. Monitor serial output for errors

### Backend not receiving messages
1. Verify MQTT client is connected
2. Check subscription to correct topics
3. Test with mosquitto_sub
4. Check broker logs

### Messages not reaching Arduino
1. Verify Arduino is subscribed to topic
2. Check callback function is registered
3. Monitor serial output
4. Test with mosquitto_pub

## References

- MQTT Protocol: https://mqtt.org/
- Mosquitto Broker: https://mosquitto.org/
- PubSubClient Library: https://github.com/knolleary/pubsubclient
- MQTT.js: https://github.com/mqttjs/MQTT.js
