# User Dashboard Guide

## Overview
After a user logs in with the "User" role, they are automatically redirected to the User Dashboard at `/dashboard/user`.

## Dashboard Structure

### 1. Sidebar Navigation
- **Location**: Left side of the screen
- **Features**:
  - Logo and branding (HackHunt)
  - Current user info with avatar
  - Collapsible navigation menu (click the menu icon to toggle)
  - Three main navigation sections
  - Logout button at the bottom

### 2. Dashboard Sections

#### 2.1 My Profile Section
**Route**: `/dashboard/user` (Active by default)

**Features**:
- **View Profile**:
  - First Name
  - Last Name
  - Email (read-only)
  - Phone Number
  - Bio/Description
  - Skills (with add/remove functionality)
  - Profile Picture (placeholder)

- **Edit Profile**:
  - Click "Edit Profile" button to enter edit mode
  - All fields become editable except email
  - Add skills using the skill input field (Enter to add)
  - Remove skills by clicking the X button on each skill tag
  - Save changes or cancel to discard

- **Password Requirements**:
  - Minimum 8 characters
  - Must contain: uppercase, lowercase, number, special character (@$!%*?&)

#### 2.2 Browse Hackathons Section
**Route**: `/dashboard/user` (Select "Browse Hackathons" from sidebar)

**Features**:
- **Search Functionality**:
  - Search by hackathon name or description
  - Real-time filtering as you type

- **Filter Options**:
  - All Hackathons
  - Live Now (🔴 currently running)
  - Upcoming (📅 future events)

- **Hackathon Cards Display**:
  - Hackathon name and description
  - Status badge (Live/Upcoming)
  - Start and end dates
  - Location
  - Number of participants
  - Prize pool information
  - "View Details" button for each hackathon

- **Information Shown**:
  - Event dates
  - Location details
  - Participant count
  - Prize amount
  - Real-time status

#### 2.3 My Registrations Section
**Route**: `/dashboard/user` (Select "My Registrations" from sidebar)

**Features**:
- **Overview Statistics**:
  - Total registrations count
  - Active registrations (currently running)
  - Upcoming registrations (not started yet)

- **Registration Cards**:
  - Hackathon name and status
  - Registration date
  - Hackathon start and end dates
  - Location
  - Team name and member count
  - Team member avatars
  - View Details button
  - Unregister button (with confirmation)

- **Status Tracking**:
  - In Progress (🔴 currently active)
  - Upcoming (📅 future participation)

## User Flow

1. **Login**:
   - User navigates to `/login?role=user`
   - Enters email and password
   - Gets redirected to `/dashboard/user` on successful login

2. **Profile Management**:
   - Click "My Profile" in sidebar
   - View current profile
   - Click "Edit Profile" to make changes
   - Add/remove skills as needed
   - Click "Save Changes" to update

3. **Discover Hackathons**:
   - Click "Browse Hackathons" in sidebar
   - Search or filter hackathons
   - Click "View Details" to learn more about any hackathon
   - Register for a hackathon

4. **Manage Registrations**:
   - Click "My Registrations" in sidebar
   - View all registered hackathons
   - See registration status and details
   - Unregister from a hackathon if needed

## Key Features

### Responsive Design
- Sidebar collapses on smaller screens
- Grid layouts adapt to screen size
- Mobile-friendly navigation

### User Experience
- Smooth transitions and hover effects
- Color-coded status badges
- Clear visual hierarchy
- Confirmation dialogs for destructive actions
- Success/error messages for all actions

### Data Persistence
- User data stored in localStorage
- Role-based access control
- Automatic logout available

## API Integration

The dashboard is ready to connect to backend APIs:

- **Profile API**: `PUT /api/v1/user/profile/{userId}` - Update user profile
- **Hackathons API**: `GET /api/v1/hackathons` - Fetch available hackathons
- **Registrations API**: `GET /api/v1/user/{userId}/registrations` - Get user's registrations
- **Registration API**: `POST /api/v1/user/{userId}/register/{hackathonId}` - Register for hackathon
- **Unregister API**: `DELETE /api/v1/user/{userId}/registrations/{registrationId}` - Unregister

## Mock Data

Currently using mock data for:
- User profile information
- Hackathon listings
- User registrations

These can be replaced with real API calls by updating the component files:
- `src/components/Dashboard/MyProfile.jsx`
- `src/components/Dashboard/BrowseHackathons.jsx`
- `src/components/Dashboard/RegisteredHackathons.jsx`

## Future Enhancements

- Real-time notifications
- Team management features
- Submission tracking
- Leaderboards
- Hackathon analytics
- Social sharing
