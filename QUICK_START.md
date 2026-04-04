# 🚀 HackHunt Admin Dashboard - Quick Start Guide

## ✅ System Status

| Component | Status | URL |
|-----------|--------|-----|
| **Backend API Server** | ✅ Running | `http://localhost:5000` |
| **Frontend Dev Server** | ✅ Running | `http://localhost:5175` |
| **Database** | ✅ Connected | MongoDB |
| **Test Accounts** | ✅ Created | (See credentials below) |

---

## 🔐 Test Credentials Ready to Use

### ADMIN LOGIN
```
Email:    admin@hackhunt.com
Password: Admin@123
Role:     Admin (Full access to dashboard)
```

### ORGANIZER LOGIN
```
Email:    organizer@hackhunt.com  
Password: Organizer@123
Role:     Organizer (Can create hackathons)
Organization: TechCorp Hackathons
```

### USER LOGIN
```
Email:    user@hackhunt.com
Password: User@123
Role:     User (Can browse and register for hackathons)
```

---

## 🎯 Next Steps - Test the Application

### Step 1: Open Frontend
👉 **Open your browser and go to:** `http://localhost:5175`

You'll see the HackHunt homepage with Login & Sign up buttons.

---

### Step 2: Test Admin Dashboard

1. Click **"Login"** dropdown → Select **"Admin"**
2. Enter credentials:
   - Email: `admin@hackhunt.com`
   - Password: `Admin@123`
3. Click **"Login"**

You should see the **Admin Dashboard** with sidebar menu:
```
✅ Platform Overview
✅ My Profile
✅ Hackathon Approvals
✅ Manage Users & Organizers
✅ Activity Log
✅ Logout (bottom left)
```

**What to verify:**
- ✅ Stats display (users, organizers, hackathons count)
- ✅ No errors in console
- ✅ Sidebar menu items are clickable
- ✅ Activities are logged

---

### Step 3: Test Organizer Dashboard

1. **Logout** from Admin (click sidebar logout button)
2. Click **"Login"** → Select **"Organizer"**
3. Enter credentials:
   - Email: `organizer@hackhunt.com`
   - Password: `Organizer@123`
4. Click **"Login"**

You should see the **Organizer Dashboard** with:
```
✅ My Profile
✅ Manage Hackathons (with location map input)
```

**What to verify:**
- ✅ Can create new hackathon
- ✅ Location map appears and is interactive
- ✅ Can place marker on map
- ✅ Auto-track location works (if you allow geolocation)
- ✅ Address field auto-populates

---

### Step 4: Test User Dashboard

1. **Logout** from Organizer
2. Click **"Login"** → Select **"User"**
3. Enter credentials:
   - Email: `user@hackhunt.com`
   - Password: `User@123`
4. Click **"Login"**

You should see the **User Dashboard** with:
```
✅ My Profile
✅ Browse Hackathons
✅ My Registrations
✅ Track Hackathons (NEW - with interactive map)
```

**What to verify:**
- ✅ Can view profile
- ✅ Can browse hackathons
- ✅ "Track Hackathons" section shows a map
- ✅ Map has color-coded markers:
  - 🟢 Green = Active hackathons
  - 🔴 Red = Ended hackathons
  - 🟡 Yellow = Online hackathons
  - 🔵 Blue = Upcoming hackathons
- ✅ Can click markers to view hackathon details

---

## 🔍 Test Key Features

### Testing Hackathon Approvals
1. **As Organizer:**
   - Create a new hackathon with location
   - Submit it
   
2. **As Admin:**
   - Go to "Hackathon Approvals" section
   - See the pending hackathon
   - Click "Approve" → Hackathon status changes to "approved"
   - Check Activity Log → Action recorded

### Testing User Management
1. **As Admin:**
   - Go to "Manage Users & Organizers" section
   - See all users and organizers
   - Test "Block" users
   - Check Activity Log updates

### Testing Profile Updates
1. **As any role:**
   - Go to "My Profile"
   - Edit name/email
   - Changes should reflect immediately
   - Activity log records updates

---

## 🐛 Troubleshooting

### Issue: Page shows blank/not loading
**Solution:** 
```bash
# Hard refresh the browser
Ctrl + Shift + R  (Windows/Linux)
Cmd + Shift + R   (Mac)
```

### Issue: Login fails with "Invalid credentials"
**Solution:**
- Verify you're using exact credentials from above
- Check that both servers are still running
- Check browser console (F12) for errors

### Issue: Map not showing in location input
**Solution:**
- Check browser console for errors
- Verify Leaflet library loaded (check Network tab)
- Try hard refresh

### Issue: Backend connection error
**Solution:**
```bash
# Check if backend is running (should output JSON)
curl http://localhost:5000/api/v1/health

# If not, restart backend:
# 1. Stop current backend (Ctrl+C in terminal)
# 2. Run: node "c:\Users\YASHII\Desktop\hack\hack\HackHunt1-Project\server\index.js"
```

---

## 📊 Implemented Features Checklist

### ✅ Authentication & Authorization
- [x] JWT-based login system
- [x] 3 user roles: Admin, Organizer, User
- [x] Role-based route protection
- [x] Login error handling

### ✅ Admin Dashboard
- [x] Platform statistics (users, organizers, hackathons)
- [x] Admin profile management
- [x] Hackathon approvals system
- [x] User & organizer management
- [x] Activity logging
- [x] Block/Unblock users
- [x] Delete users functionality
- [x] Real-time data updates

### ✅ Organizer Dashboard
- [x] Create hackathons with details
- [x] Interactive location map
- [x] Auto-track geolocation feature
- [x] Address auto-population (reverse geocoding)
- [x] Edit/Delete hackathons
- [x] Organization profile management

### ✅ User Dashboard
- [x] Browse approved hackathons
- [x] View hackathon details
- [x] Register for hackathons
- [x] New: **Track Hackathons on Map** 🗺️
- [x] Color-coded hackathon markers
- [x] Click-to-navigate to hackathon

### ✅ Backend APIs
- [x] User authentication endpoints
- [x] Admin management endpoints
- [x] Hackathon CRUD operations
- [x] Activity logging endpoints
- [x] Real-time data updates
- [x] Proper error handling
- [x] CORS configured

### ✅ Database
- [x] MongoDB schemas (User, Admin, Organizer, Hackathon, ActivityLog)
- [x] Location fields (latitude, longitude, address)
- [x] Timestamps on all records
- [x] Data validation

### ✅ UI/UX Improvements
- [x] Removed "Live Team Feed" section ❌
- [x] Removed top logout button ❌
- [x] Kept sidebar logout button ✅
- [x] Clean, modern design
- [x] Responsive layout
- [x] Loading states
- [x] Error messages

---

## 📜 Complete Testing Checklist

See **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** for comprehensive testing checklist with all scenarios.

---

## 📁 Important Files

| File | Purpose |
|------|---------|
| `src/pages/AdminDashboard.jsx` | Admin dashboard main component |
| `src/pages/OrganizerDashboard.jsx` | Organizer dashboard main component |
| `src/pages/UserDashboard.jsx` | User dashboard with hackathon tracking |
| `src/components/HackathonTrackingMap.jsx` | Interactive map for user dashboard |
| `src/components/LocationMapInput.jsx` | Map input for hackathon location |
| `server/routes/admin.js` | Admin API endpoints |
| `server/utils/controllers/adminController.js` | Admin business logic |
| `server/database/activityLog.js` | Activity log schema |

---

## 🎓 API Endpoints Reference

### Health Check
```bash
GET http://localhost:5000/api/v1/health
```

### Admin Endpoints
```bash
# Platform stats
POST /api/v1/admin/stats

# Admin profile
GET /api/v1/admin/profile/:adminId
PUT /api/v1/admin/profile/:adminId

# Users management
GET /api/v1/admin/users
DELETE /api/v1/admin/users/:userId
PATCH /api/v1/admin/users/:userId/block

# Activity logs
GET /api/v1/admin/activity-logs
```

---

## ✨ Summary

Your HackHunt admin dashboard is **fully functional** with:
- ✅ Complete backend API
- ✅ Connected database (MongoDB)
- ✅ Responsive frontend UI
- ✅ Real-time data updates
- ✅ Interactive maps for location selection and hackathon discovery
- ✅ Comprehensive activity logging
- ✅ Role-based access control

---

**Happy Testing!** 🎉

For any issues, check the browser console (F12) and backend terminal logs.
