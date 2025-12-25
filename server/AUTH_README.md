# MeroGhar Authentication API

Complete authentication system with email verification, password reset, and token management.

## Features

✅ **User Registration** with email verification  
✅ **Email Verification** with secure tokens  
✅ **Login** with JWT authentication  
✅ **Password Reset** via email  
✅ **Refresh Tokens** for extended sessions  
✅ **Role-Based Access Control** (tenant, host, admin)  
✅ **Profile Management**  
✅ **Account Deletion**  
✅ **Logout** with token invalidation  


## API Endpoints

### Public Routes

#### 1. Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "tenant"  // Optional: tenant (default), host, admin
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully. Please check your email to verify your account.",
  "user": {
    "_id": "...",
    "username": "John Doe",
    "email": "john@example.com",
    "role": "tenant",
    "verified": false
  }
}
```

#### 2. Verify Email
```http
GET /api/auth/verify-email/:token
```

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully",
  "user": { ... }
}
```

#### 3. Resend Verification Email
```http
POST /api/auth/resend-verification
Content-Type: application/json

{
  "email": "john@example.com"
}
```

#### 4. Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "_id": "...",
    "username": "John Doe",
    "email": "john@example.com",
    "role": "tenant",
    "verified": true
  }
}
```

#### 5. Forgot Password
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "john@example.com"
}
```

#### 6. Reset Password
```http
POST /api/auth/reset-password/:token
Content-Type: application/json

{
  "password": "newPassword123"
}
```

#### 7. Refresh Token
```http
POST /api/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Protected Routes (Require Authentication)

Add the JWT token to the Authorization header:
```
Authorization: Bearer <your-token>
```

#### 8. Get Profile
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

#### 9. Update Profile
```http
PUT /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "Jane Doe",
  "email": "jane@example.com"
}
```

#### 10. Change Password
```http
PUT /api/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword456"
}
```

#### 11. Logout
```http
POST /api/auth/logout
Authorization: Bearer <token>
```

#### 12. Delete Account
```http
DELETE /api/auth/account
Authorization: Bearer <token>
```

## Middleware

### Authentication Middleware

```javascript
import { authenticate } from './middleware/authMiddleware.js';

// Protect routes that require authentication
router.get('/protected', authenticate, (req, res) => {
  // Access user info via req.userId, req.userEmail, req.userRole
});
```

### Role-Based Middleware

```javascript
import { authorize, isAdmin, isHost, isVerified } from './middleware/roleMiddleware.js';

// Only admins can access
router.get('/admin-only', authenticate, isAdmin, handler);

// Only hosts and admins can access
router.get('/host-only', authenticate, isHost, handler);

// Only verified users can access
router.get('/verified-only', authenticate, isVerified, handler);

// Multiple roles can access
router.get('/multi-role', authenticate, authorize('host', 'admin'), handler);
```

## User Roles

- **tenant** (default): Regular users looking for properties
- **host**: Users who can list properties
- **admin**: Full system access

## Token Management

### Access Token
- Expires in: 7 days
- Used for: API authentication
- Stored in: Client-side (localStorage/sessionStorage)

### Refresh Token
- Expires in: 30 days
- Used for: Generating new access tokens
- Stored in: Database and client-side

## Email Templates

The system sends three types of emails:

1. **Verification Email**: Sent after registration with 24-hour valid link
2. **Password Reset Email**: Sent on password reset request with 1-hour valid link
3. **Welcome Email**: Sent after successful email verification

## Security Features

✓ Password hashing with bcrypt  
✓ JWT token-based authentication  
✓ Email verification required before login  
✓ Secure password reset with expiring tokens  
✓ Refresh token rotation  
✓ Token invalidation on logout  
✓ Role-based access control  
✓ Protection against timing attacks in password reset  

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict (e.g., email already exists)
- `500` - Server Error

## Testing

Use tools like Postman or cURL to test the endpoints:

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"John","email":"john@example.com","password":"pass123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"pass123"}'

# Get Profile (with token)
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Running the Server

npm run dev


