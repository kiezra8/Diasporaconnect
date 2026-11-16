# Diaspora Connect - API Specification & Integration Guide

Base URL: `https://api.diasporaconnectt.com`

---

## 1. Authentication & Authorization

### `POST /auth/login`
Authenticates a user and returns their JWT token with their role and assigned portal route.
* **Payload**:
  ```json
  {
    "email": "member@diasporaconnectt.com",
    "password": "SecretPassword123!"
  }
  ```
* **Response**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "usr-uuid",
      "email": "member@diasporaconnectt.com",
      "fullName": "David Mukasa",
      "role": "MEMBER",
      "memberNumber": "DC-MBR-00104"
    },
    "redirectTo": "/member"
  }
  ```

---

## 2. SACCO Dual-Control Deposit & Withdrawal Workflow

```
[MEMBER] -> Submits Deposit Request (Ref + Slip) -> Status: PENDING_VERIFICATION
                                                            ↓
[ACCOUNTANT] -> Verifies external bank/mobile money -> Status: VERIFIED_ACCOUNTANT
                                                            ↓
[ADMIN] -> Final Authorization -> Status: POSTED + Immutable General Ledger Entry
```

### `POST /sacco/deposit`
* **Role**: `MEMBER`
* **Payload**:
  ```json
  {
    "amountUGX": 1500000,
    "paymentMethod": "MTN_MOBILE_MONEY",
    "externalReference": "MTN-894109",
    "receiptEvidenceUrl": "receipt-894109.png"
  }
  ```

### `POST /sacco/transactions/:id/verify`
* **Role**: `ACCOUNTANT` (Dual Control Step 1)

### `POST /sacco/transactions/:id/authorize`
* **Role**: `ADMIN` (Dual Control Step 2 - Posts to General Ledger)

---

## 3. Double-Entry Accounting Engine

### `GET /accounting/trial-balance`
* **Role**: `ACCOUNTANT`, `ADMIN`, `BOARD_MEMBER`
* **Guarantees**: Real-time calculated `SUM(Debits) === SUM(Credits)` derived strictly from posted journal lines.

---

## 4. Farm & Cattle Operations

### `POST /farm/milk-logs`
* **Role**: `FARM_WORKER`, `ADMIN`
* **Payload**:
  ```json
  {
    "farmId": "farm-luwero-01",
    "morningLiters": 1120,
    "eveningLiters": 1010,
    "chillingTempCelsius": 3.8,
    "offTakerName": "Brookside Dairy Uganda",
    "ratePerLiterUGX": 1650
  }
  ```

---

## 5. Coffee Trading Desk

### `POST /coffee/purchases`
* **Role**: `FARM_WORKER`, `SECRETARY`, `ADMIN`
* **Validations**: Moisture content percentage check (< 13% for export standard), grading (AA/Screen 18).

### `POST /coffee/sales`
* **Role**: `ADMIN`
* **Validations**: Strict physical inventory verification — rejects sales orders exceeding available warehouse stock.

