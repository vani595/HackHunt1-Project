# 🧪 HackHunt Admin Dashboard - Testing & Verification Guide

## ✅ System Status

**Backend Server:** ✅ Running on `http://localhost:5000`
**Frontend Server:** ✅ Running on `http://localhost:5175`
**Database:** ✅ MongoDB connected
**CORS:** ✅ Configured for all required ports

---

## 📋 Test Credentials (Create These First)

### Option 1: Using Postman or curl to Create Test Users

#### 1. Create Test Admin Account
```bash
curl -X POST http://localhost:5000/api/v1/user/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hackhunt.com",
    "password": "Admin@123",
    "firstName": "Admin",
    "lastName": "User",
    "phoneNumber": "1234567890",
    "role": "admin"
  }'
```

#### 2. Create Test Organizer Account
```bash
curl -X POST http://localhost:5000/api/v1/user/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "organizer@hackhunt.com",
    "password": "Organizer@123",
    "firstName": "John",
    "lastName": "Organizer",
    "phoneNumber": "9876543210",
    "role": "organizer",
    "organizationName": "TechCorp Hackathons"
  }'
```

#### 3. Create Test User Account
```bash
curl -X POST http://localhost:5000/api/v1/user/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@hackhunt.com",
    "password": "User@123",
    "firstName": "Jane",
    "lastName": "Developer",
    "phoneNumber": "5555555555"
  }'
```

---

## 🧪 Testing Checklist

### Phase 1: Authentication & Login (15 mins)

- [ ] **Test Admin Login**
  - Go to `http://localhost:5175`
  - Click "Login" dropdown → Select "Admin"
  - Enter: `admin@hackhunt.com` / `Admin@123`
  - Expected: Redirects to `/admin-dashboard`
  - Verify: Admin sidebar with all menu items visible

- [ ] **Test Organizer Login**
  - Click "Login" dropdown → Select "Organizer"
  - Enter: `organizer@hackhunt.com` / `Organizer@123`
  - Expected: Redirects to `/organizer-dashboard`
  - Verify: Organizer sidebar with create hackathon option

- [ ] **Test User Login**
  - Click "Login" dropdown → Select "User"
  - Enter: `user@hackhunt.com` / `User@123`
  - Expected: Redirects to `/user-dashboard`
  - Verify: User dashboard with Browse/Track options

---

### Phase 2: Admin Dashboard (30 mins)

#### ✅ Platform Overview Section
- [ ] Page loads without errors
- [ ] Stats display (Users, Organizers, Hackathons count)
- [ ] No "Cannot access 'fetchPlatformStats' before initialization" error
- [ ] Stats update when data changes

#### ✅ My Profile Section
- [ ] View admin profile (name, email, role)
- [ ] Edit profile form appears
- [ ] Update name successfully
- [ ] Update email successfully
- [ ] Change password successfully

#### ✅ Hackathon Approvals Section
- [ ] See list of pending hackathons submitted by organizers
- [ ] Each hackathon shows: title, description, organizer, status
- [ ] **Approve** button works → Changes status to "approved"
- [ ] **Reject** button works → Changes status to "rejected"
- [ ] Activity log records the approval/rejection
- [ ] Page updates without refresh

#### ✅ Manage Users & Organizers Section
- [ ] Filter tabs: "All Users" / "All Organizers"
- [ ] See list of all users with: name, email, status
- [ ] See list of all organizers with: name, organization, status
- [ ] **Delete User** button works
- [ ] **Block/Unblock User** toggle works
- [ ] Status changes immediately
- [ ] Delete confirms before removing

#### ✅ Activity Log Section
- [ ] Shows all admin actions with timestamps
- [ ] Color-coded by action type: (Approved=green, Rejected=red, Deleted=red, etc.)
- [ ] Shows action performer, target user/hackathon, timestamp
- [ ] Pagination works (if applicable)
- [ ] Updates in real-time

#### ✅ UI/UX Verification
- [ ] Sidebar menu items are clickable and switch sections
- [ ] No "Live Team Feed" section visible
- [ ] **Only sidebar logout button** present (bottom left) ✅
- [ ] No logout button in header
- [ ] Logout button works → Returns to home page

---

### Phase 3: Organizer Dashboard (20 mins)

#### ✅ Create Hackathon
- [ ] Click "Manage Hackathons" in sidebar
- [ ] "Add New Hackathon" button appears
- [ ] Form opens with fields: title, description, location
- [ ] **Location Map Input** works:
  - [ ] Click on map to select location
  - [ ] "Auto Track Location" button uses geolocation
  - [ ] Coordinates display (latitude/longitude)
  - [ ] Address field populates via reverse geocoding
- [ ] Submit form successfully
- [ ] Hackathon appears in pending status
- [ ] Admin sees it in "Hackathon Approvals"

#### ✅ My Profile (Organizer)
- [ ] View organization profile
- [ ] Update organization details
- [ ] View hackathons created

---

### Phase 4: User Dashboard (20 mins)

#### ✅ Browse Hackathons
- [ ] See approved hackathons in list/cards
- [ ] Can view details of each hackathon
- [ ] Can register for hackathons

#### ✅ Track Hackathons (NEW FEATURE!) 🗺️
- [ ] Click "Track Hackathons" in sidebar
- [ ] **Interactive map appears** showing:
  - [ ] Green markers = Active hackathons
  - [ ] Red markers = Ended hackathons
  - [ ] Yellow markers = Online hackathons
  - [ ] Blue markers = Upcoming hackathons
- [ ] **Click on marker** → Navigate to hackathon detail page
- [ ] **Legend shows** color meanings
- [ ] **List below map** shows hackathons with same filters

#### ✅ My Registrations
- [ ] Shows hackathons user registered for
- [ ] Can unregister if needed
- [ ] Status updates correctly

#### ✅ My Profile (User)
- [ ] View profile info
- [ ] Update name/email
- [ ] Update skills/bio

---

### Phase 5: API Endpoint Verification (20 mins)

Use Postman or curl to verify all endpoints:

#### Admin Routes - Health Check
```bash
curl http://localhost:5000/api/v1/health
```
Expected: `{"status":"ok","message":"Server is running"}`

#### Admin Routes - Platform Stats
```bash
curl -X POST http://localhost:5000/api/v1/admin/stats \
  -H "Content-Type: application/json" \
  -d '{"adminId":"<admin_id>"}'
```
Expected: `{"users":3,"organizers":1,"hackathons":0,...}`

#### Admin Routes - Get All Users
```bash
curl "http://localhost:5000/api/v1/admin/users?adminId=<admin_id>" 
```
Expected: Array of user objects

#### Admin Routes - Get Activity Logs
```bash
curl "http://localhost:5000/api/v1/admin/activity-logs?adminId=<admin_id>"
```
Expected: Array of activity log entries

---

### Phase 6: Real-Time Features (10 mins)

- [ ] When admin approves a hackathon, organizer sees status update
- [ ] When user registers, organizer sees count update
- [ ] Activity log updates without page refresh
- [ ] User count updates when new user registers

---

### Phase 7: Error Handling (10 mins)

- [ ] Try accessing `/admin-dashboard` without login → Redirected to login
- [ ] Try accessing `/organizer-dashboard` with user account → Denied/redirected
- [ ] Try accessing `/user-dashboard` with admin account → Denied/redirected
- [ ] Try invalid login credentials → Error message "Invalid email/password"
- [ ] Try creating duplicate email → Error handling
- [ ] Network error handling (turn off backend, see error message)

---

### Phase 8: Database Operations (10 mins)

- [ ] Created users are in MongoDB `users` collection
- [ ] Created organizers are in MongoDB `organizers` collection
- [ ] Created admins are in MongoDB `admins` collection
- [ ] Created hackathons are in MongoDB `hackathons` collection with status field
- [ ] Activity logs are stored in `activityLog` collection
- [ ] All timestamps are recorded correctly

---

## 🎯 Summary of Implemented Features

✅ **Authentication**
- JWT-based login with 3 roles (admin, organizer, user)
- Protected routes with middleware
- Session management

✅ **Admin Dashboard**
- Platform statistics and overview
- Admin profile management
- Hackathon approvals system
- User and organizer management
- Activity logging system
- Clean UI (removed Live Team Feed & top logout)

✅ **Organizer Dashboard**
- Create/edit hackathons with location mapping
- Auto-track geolocation feature
- View created hackathons

✅ **User Dashboard**
- Browse approved hackathons
- **NEW: Track hackathons on interactive map**
- Register for hackathons
- View my registrations

✅ **Backend APIs**
- RESTful endpoints for all operations
- Proper error handling
- CORS configured
- MongoDB integration

---

## 🐛 Known Issues & Fixes Applied

✅ **Fixed:** Cannot access 'fetchPlatformStats' before initialization
   - Solution: Wrapped in useMemo with proper null checks

✅ **Fixed:** Missing PATCH in CORS
   - Solution: Added PATCH to allowed methods

✅ **Fixed:** Import paths in adminController
   - Solution: Changed `../` to `../../` for correct relative paths

✅ **Removed:** Live Team Feed section
   - From AdminDashboard

✅ **Removed:** Top logout button
   - Kept only sidebar logout button

---

## 🚀 Next Steps (If Issues Found)

1. **Check backend logs** - Terminal where server is running
2. **Check browser console** - F12 → Console tab
3. **Check Network tab** - F12 → Network tab to see API calls
4. **Restart servers** if needed:
   - Backend: Stop `node index.js` and restart
   - Frontend: Stop `npm run dev` and restart

---

## 📞 Support

If you encounter issues:
1. Check the browser console for JavaScript errors
2. Check the backend terminal for server errors
3. Verify MongoDB is running
4. Ensure all required environment variables are set in `.env` file
5. Clear browser cache and hard refresh (Ctrl+Shift+R)

---

**Happy Testing! 🎉**
