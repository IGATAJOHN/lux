# AI-Powered Hospitality Platform - API Documentation

## Base URL
```
http://127.0.0.1:8000
```

## Authentication
Most endpoints require JWT authentication. Include the token in the `Authorization` header:
```
Authorization: Bearer <your_jwt_token>
```

---

## API Endpoints

### 🔐 Authentication (`/auth`)

#### **POST** `/auth/register`
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "phone": "+1234567890",
  "role": "guest",
  "unique_id": "PASSPORT123",
  "selfie_image": "base64_encoded_image"
}
```

**Response:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "John Doe",
  "role": "guest"
}
```

---

#### **POST** `/auth/login`
Login and receive JWT token.

**Request Body (Form Data):**
```
username: user@example.com
password: password123
```

**Response:**
```json
{
  "access_token": "eyJhbGciOi...",
  "token_type": "bearer"
}
```

---

#### **POST** `/auth/verify-id`
Verify unique ID for face matching.

**Request Body:**
```json
{
  "unique_id": "PASSPORT123"
}
```

**Response:**
```json
{
  "message": "ID verified",
  "user_id": 1
}
```

---

#### **POST** `/auth/face-match`
Match face against stored embeddings.

**Request Body:**
```json
{
  "unique_id": "PASSPORT123",
  "face_image": "base64_encoded_image"
}
```

**Response:**
```json
{
  "match": true,
  "confidence": 0.95,
  "user_id": 1
}
```

---

#### **POST** `/auth/face-enroll`
Enroll new face embedding for user. **Requires Auth**

**Request Body:**
```json
{
  "face_image": "base64_encoded_image"
}
```

**Response:**
```json
{
  "message": "Face enrolled successfully"
}
```

---

### 👤 User Management (`/user`)

#### **GET** `/user/me`
Get current user profile. **Requires Auth**

**Response:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "John Doe",
  "phone": "+1234567890",
  "role": "guest",
  "unique_id": "PASSPORT123"
}
```

---

### 🏨 Booking Management (`/booking`)

#### **POST** `/booking/create`
Create a new booking. **Requires Auth**

**Request Body:**
```json
{
  "check_in_date": "2024-01-15T14:00:00",
  "check_out_date": "2024-01-20T11:00:00",
  "room_type": "double",
  "preferences": "Ocean view preferred"
}
```

**Response:**
```json
{
  "id": 1,
  "user_id": 1,
  "check_in_date": "2024-01-15T14:00:00",
  "check_out_date": "2024-01-20T11:00:00",
  "room_type": "double",
  "status": "pending",
  "fraud_score": 15.5
}
```

---

#### **GET** `/booking/`
List all bookings for current user. **Requires Auth**

**Response:**
```json
[
  {
    "id": 1,
    "user_id": 1,
    "check_in_date": "2024-01-15T14:00:00",
    "status": "confirmed",
    "room_id": 101
  }
]
```

---

#### **POST** `/booking/{booking_id}/confirm`
Confirm a booking. **Requires Auth**

**Request Body:**
```json
{
  "room_id": 101
}
```

**Response:**
```json
{
  "message": "Booking confirmed",
  "booking_id": 1
}
```

---

#### **POST** `/booking/{booking_id}/checkin`
Check-in to booking. **Requires Auth**

**Response:**
```json
{
  "message": "Checked in successfully"
}
```

---

#### **POST** `/booking/{booking_id}/checkout`
Check-out from booking. **Requires Auth**

**Response:**
```json
{
  "message": "Checked out successfully"
}
```

---

### 🛏️ Room Management (`/rooms`)

#### **GET** `/rooms/`
List all available rooms.

**Query Params:** `status` (optional): "available", "occupied", "cleaning"

**Response:**
```json
[
  {
    "id": 1,
    "room_number": "101",
    "room_type": "double",
    "status": "available",
    "price_per_night": 150.0
  }
]
```

---

#### **POST** `/rooms/`
Create a new room. **Requires Auth (Admin)**

**Request Body:**
```json
{
  "room_number": "101",
  "room_type": "suite",
  "price_per_night": 300.0,
  "status": "available"
}
```

---

#### **POST** `/rooms/assign`
Assign room to booking. **Requires Auth**

**Request Body:**
```json
{
  "booking_id": 1,
  "room_id": 101
}
```

**Response:**
```json
{
  "message": "Room assigned",
  "room_id": 101
}
```

---

#### **PUT** `/rooms/{room_id}/status`
Update room status. **Requires Auth**

**Request Body:**
```json
{
  "status": "cleaning"
}
```

---

### 🎯 Guest Portal (`/guest`)

#### **GET** `/guest/dashboard`
Get guest dashboard data. **Requires Auth (Guest)**

**Response:**
```json
{
  "booking_status": "Checked-in",
  "current_room": "101",
  "active_requests": 2,
  "recommendations": [
    "Try the spa on floor 3",
    "Book early for dinner at rooftop restaurant"
  ]
}
```

---

#### **POST** `/guest/service-request`
Create a service request. **Requires Auth (Guest)**

**Request Body:**
```json
{
  "request_type": "room_service",
  "description": "Extra towels needed"
}
```

---

#### **GET** `/guest/requests`
List all service requests. **Requires Auth (Guest)**

**Response:**
```json
[
  {
    "id": 1,
    "request_type": "room_service",
    "status": "pending",
    "description": "Extra towels needed"
  }
]
```

---

### 🔧 Admin Portal (`/admin`)

#### **GET** `/admin/dashboard`
Get admin dashboard stats. **Requires Auth (Admin)**

**Response:**
```json
{
  "active_guests": 45,
  "open_requests": 12,
  "fraud_alerts": 2
}
```

---

#### **GET** `/admin/bookings`
List all bookings. **Requires Auth (Admin)**

---

#### **GET** `/admin/guests`
List all guests. **Requires Auth (Admin)**

---

#### **GET** `/admin/requests`
List all service requests. **Requires Auth (Admin)**

---

#### **PUT** `/admin/request/{request_id}`
Update service request status. **Requires Auth (Admin)**

**Request Body:**
```json
{
  "status": "completed"
}
```

---

### 🤖 AI Engine (`/ai`)

#### **POST** `/ai/fraud-score`
Get fraud risk score.

**Response:**
```json
{
  "fraud_score": 23.5
}
```

---

#### **POST** `/ai/anomaly`
Detect anomalies.

**Response:**
```json
{
  "is_anomaly": true,
  "confidence": 0.87
}
```

---

#### **POST** `/ai/recommendations`
Get AI recommendations.

**Response:**
```json
{
  "recommendations": ["Book spa early", "Try rooftop restaurant"]
}
```

---

#### **POST** `/ai/id-fraud`
Check ID fraud score.

**Request Body:**
```json
{
  "id_image": "base64_encoded_image"
}
```

---

#### **POST** `/ai/churn-prediction`
Predict customer churn.

**Request Body:**
```json
{
  "user_id": 1
}
```

---

### 👥 Staff Management (`/staff`)

#### **GET** `/staff/`
List all staff members.

---

#### **POST** `/staff/assign`
Assign staff to service request.

**Request Body:**
```json
{
  "request_id": 1,
  "staff_id": 5
}
```

---

### 🔔 Notifications (`/notify`)

#### **POST** `/notify/guest/{user_id}`
Send notification to guest.

**Request Body:**
```json
{
  "message": "Your room is ready"
}
```

---

#### **POST** `/notify/staff/{staff_id}`
Send notification to staff.

**Request Body:**
```json
{
  "message": "New service request"
}
```

---

## React Frontend Integration Guide

### 1. Setup Axios Instance

**File:** `src/services/api.js`
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
});

// Add JWT token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
```

---

### 2. Authentication Context

**File:** `src/contexts/AuthContext.jsx`
```javascript
import React, { createContext, useState, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const login = async (email, password) => {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    
    const { data } = await api.post('/auth/login', formData);
    localStorage.setItem('token', data.access_token);
    
    // Fetch user profile
    const userResp = await api.get('/user/me');
    setUser(userResp.data);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

---

### 3. Example API Calls

#### **Login**
```javascript
import api from '../services/api';

const handleLogin = async (email, password) => {
  const formData = new FormData();
  formData.append('username', email);
  formData.append('password', password);
  
  const response = await api.post('/auth/login', formData);
  localStorage.setItem('token', response.data.access_token);
};
```

---

#### **Create Booking**
```javascript
const createBooking = async (bookingData) => {
  const response = await api.post('/booking/create', {
    check_in_date: new Date(bookingData.checkIn).toISOString(),
    check_out_date: new Date(bookingData.checkOut).toISOString(),
    room_type: bookingData.roomType,
    preferences: bookingData.preferences
  });
  return response.data;
};
```

---

#### **Get Dashboard Data**
```javascript
const fetchDashboard = async () => {
  const response = await api.get('/guest/dashboard');
  return response.data;
};
```

---

#### **Service Request**
```javascript
const createServiceRequest = async (type, description) => {
  const response = await api.post('/guest/service-request', {
    request_type: type,
    description: description
  });
  return response.data;
};
```

---

### 4. Error Handling

```javascript
try {
  const response = await api.post('/booking/create', bookingData);
  console.log('Success:', response.data);
} catch (error) {
  if (error.response) {
    // Server responded with error
    console.error('Error:', error.response.data.detail);
  } else {
    // Network error
    console.error('Network error');
  }
}
```

---

### 5. Protected Routes

```javascript
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

// Usage
<Route path="/dashboard" element={
  <PrivateRoute>
    <Dashboard />
  </PrivateRoute>
} />
```

---

## Testing with Swagger

Visit `http://127.0.0.1:8000/docs` for interactive API documentation and testing.

---

## Common Response Codes

- **200** - Success
- **201** - Created
- **400** - Bad Request (validation error)
- **401** - Unauthorized (missing/invalid token)
- **403** - Forbidden (insufficient permissions)
- **404** - Not Found
- **500** - Internal Server Error
