# Backend & MongoDB Integration Guide

## Overview
The frontend is now fully connected to the backend and MongoDB database. All signup, login, and profile operations persist data to MongoDB and reflect changes in real-time.

## Complete Data Flow

### 1. **SIGNUP FLOW**
```
Frontend (SignupUser/SignupOrganizer/SignupAdmin)
    ↓
apiClient.signup(email, password, firstName, lastName, phoneNumber, role, organizationName)
    ↓
POST /api/v1/user/signup (backend)
    ↓
Validation (email, password strength, phone format, organization name)
    ↓
Hash password with bcryptjs (salt rounds: 10)
    ↓
Create user in MongoDB (users/organizers/admins collection)
    ↓
Return userId, role, email, firstName
    ↓
Store in localStorage: userId, userRole, userName, userEmail
    ↓
Redirect to /dashboard/{role}
```

### 2. **LOGIN FLOW**
```
Frontend (LoginUser/LoginOrganizer/LoginAdmin)
    ↓
apiClient.signin(email, password, role)
    ↓
POST /api/v1/user/signin (backend)
    ↓
Find user in MongoDB by email and role
    ↓
Compare password using bcryptjs (secure comparison)
    ↓
Update lastLogin timestamp
    ↓
Return userId, role, email, firstName, lastName
    ↓
Store in localStorage: userId, userRole, userName, userEmail
    ↓
Redirect to /dashboard/{role}
```

### 3. **PROFILE FETCH FLOW**
```
Frontend (MyProfile/OrganizerProfile/AdminProfile useEffect)
    ↓
Get userId and userRole from localStorage
    ↓
apiClient.fetchProfile(userId, userRole)
    ↓
GET /api/v1/user/profile/{userId}/{role} (backend)
    ↓
Find user in MongoDB by ID and role
    ↓
Return full profile (excluding password)
    ↓
Display in dashboard with editable form
```

### 4. **PROFILE UPDATE FLOW**
```
Frontend (Click "Save Changes" in profile editor)
    ↓
Validate form data (required fields, phone format, etc.)
    ↓
apiClient.updateProfile(userId, userRole, profileData)
    ↓
PUT /api/v1/user/profile/{userId}/{role} (backend)
    ↓
Update document in MongoDB with new data
    ↓
Return updated profile
    ↓
Show success message
    ↓
Update form display with new data
```

## API Endpoints

### Authentication Endpoints

#### Signup
```
POST /api/v1/user/signup
Content-Type: application/json

Request Body:
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "1234567890",
  "role": "user",
  "organizationName": "Tech Corp" // Only for organizer role
}

Response (201 Created):
{
  "message": "User created successfully",
  "userId": "507f1f77bcf86cd799439011",
  "role": "user",
  "email": "user@example.com",
  "firstName": "John"
}
```

#### Signin
```
POST /api/v1/user/signin
Content-Type: application/json

Request Body:
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "role": "user"
}

Response (200 OK):
{
  "message": "Signin successful",
  "userId": "507f1f77bcf86cd799439011",
  "role": "user",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe"
}
```

### Profile Endpoints

#### Get Profile
```
GET /api/v1/user/profile/{userId}/{role}

Response (200 OK):
{
  "message": "Profile fetched successfully",
  "profile": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "1234567890",
    "bio": "...",
    "skills": ["JavaScript", "React"],
    "createdAt": "2026-01-17T...",
    "lastLogin": "2026-01-17T..."
    // password field is excluded
  }
}
```

#### Update Profile
```
PUT /api/v1/user/profile/{userId}/{role}
Content-Type: application/json

Request Body:
{
  "firstName": "Jonathan",
  "lastName": "Smith",
  "phoneNumber": "9876543210",
  "bio": "Senior Developer",
  "skills": ["JavaScript", "TypeScript", "React"],
  "organizationName": "New Company" // For organizers
}

Response (200 OK):
{
  "message": "Profile updated successfully",
  "profile": {
    // Updated profile data
  }
}
```

## MongoDB Collections

### Users Collection
```javascript
{
  _id: ObjectId,
  email: String (unique, lowercase),
  password: String (bcrypt hashed),
  firstName: String,
  lastName: String,
  phoneNumber: String,
  role: "user",
  profilePicture: String (URL),
  bio: String,
  skills: Array<String>,
  joinedHackathons: Array<ObjectId>,
  favoriteHackathons: Array<ObjectId>,
  isActive: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Organizers Collection
```javascript
{
  _id: ObjectId,
  email: String (unique, lowercase),
  password: String (bcrypt hashed),
  firstName: String,
  lastName: String,
  phoneNumber: String,
  role: "organizer",
  organizationName: String,
  organizationWebsite: String,
  organizationLogo: String,
  bio: String,
  hackathonsCreated: Array<ObjectId>,
  hackathonsManaged: Array<ObjectId>,
  isVerified: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Admins Collection
```javascript
{
  _id: ObjectId,
  email: String (unique, lowercase),
  password: String (bcrypt hashed),
  firstName: String,
  lastName: String,
  phoneNumber: String,
  role: "admin",
  adminLevel: "super_admin" | "moderator" | "support",
  department: String,
  permissions: Array<String>,
  usersManaged: Array<ObjectId>,
  activityLog: Array<{
    action: String,
    targetId: ObjectId,
    targetType: String,
    timestamp: Date
  }>,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## Testing the Integration

### Test Case 1: User Signup & Profile Update
1. Go to `http://localhost:5174/signup-user`
2. Fill in the form with:
   - First Name: John
   - Last Name: Doe
   - Email: john@example.com
   - Phone: 1234567890
   - Password: TestPass123!
3. Click "Create Account"
4. You should be redirected to `/dashboard/user`
5. Click "Edit Profile"
6. Change bio to "Software Developer"
7. Click "Save Changes"
8. Success message should appear
9. Open MongoDB Compass and check `users` collection for the document
10. Verify the bio field is updated

### Test Case 2: Organizer Signup & Profile Update
1. Go to `http://localhost:5174/signup-organizer`
2. Fill in the form with:
   - First Name: Jane
   - Last Name: Smith
   - Email: jane@example.com
   - Phone: 0987654321
   - Organization: Tech Innovators
   - Password: OrgPass123!
3. Click "Create Account"
4. You should be redirected to `/dashboard/organizer`
5. Verify data is saved in MongoDB `organizers` collection
6. Edit organization website and bio
7. Click "Save Changes"
8. Verify updates in MongoDB

### Test Case 3: Admin Signup & Profile Update
1. Go to `http://localhost:5174/signup-admin`
2. Fill in the form with:
   - First Name: Alex
   - Last Name: Admin
   - Email: admin@example.com
   - Phone: 5555555555
   - Password: AdminPass123!
3. Click "Create Account"
4. You should be redirected to `/admin`
5. Verify data is saved in MongoDB `admins` collection
6. Edit admin level and department
7. Click "Save Changes"
8. Verify updates in MongoDB

### Test Case 4: Login After Signup
1. Logout from current dashboard
2. Go to `/login-user`
3. Enter credentials from Test Case 1
4. Click "Sign In"
5. You should be redirected to `/dashboard/user`
6. Profile data should be loaded from MongoDB
7. Verify the bio shows the updated value from previous test

## Files Modified/Created

### Backend
- `server/routes/user.js` - Added GET /profile and PUT /profile endpoints
- New profile fetch and update functionality

### Frontend
- `src/api/client.js` - Added fetchProfile() and updateProfile() methods
- `src/components/Dashboard/MyProfile.jsx` - Connected to backend API
- `src/components/Dashboard/OrganizerProfile.jsx` - Connected to backend API
- `src/components/Dashboard/AdminProfile.jsx` - Connected to backend API
- `src/pages/UserDashboard.jsx` - Fetches profile on load
- `src/pages/OrganizerDashboard.jsx` - Fetches profile on load
- `src/pages/AdminDashboard.jsx` - Fetches profile on load

## Security Features

✅ **Password Hashing**: bcryptjs with 10 salt rounds
✅ **Password Comparison**: Secure bcrypt comparison on login
✅ **Password Protection**: Passwords never returned in API responses
✅ **Email Validation**: Format validation and unique constraint
✅ **Password Strength**: Minimum 8 characters with uppercase, lowercase, number, special character
✅ **Phone Number Validation**: Exactly 10 digits
✅ **Role-Based Access**: Each role has separate collection and redirect
✅ **LastLogin Tracking**: Updated on each successful signin

## Troubleshooting

### "Failed to connect to backend server"
- Ensure backend is running: `npm run server` in server directory
- Check if port 3000 is available
- Verify server is listening on correct port

### "User already exists"
- Check if email is already registered in the appropriate MongoDB collection
- Try signup with a different email

### Profile data not loading
- Check browser console for errors
- Ensure userId and userRole are in localStorage
- Verify MongoDB connection is working
- Check backend logs for API errors

### Data not persisting
- Verify MongoDB is running
- Check MongoDB connection string in database/user.js
- Ensure appropriate write permissions to database
- Check MongoDB collections exist with correct schema

## Next Steps

1. ✅ Signup/Login with role-based collection storage
2. ✅ Profile fetch from MongoDB
3. ✅ Profile update in MongoDB
4. ⏳ Add Hackathon management API endpoints
5. ⏳ Connect ManageHackathons component to backend
6. ⏳ Add ManageUsers functionality for admin
7. ⏳ Implement search and filtering in ManageUsers
8. ⏳ Add activity logging for admin actions
