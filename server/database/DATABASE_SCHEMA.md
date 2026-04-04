# MongoDB Database Schema Documentation

## Overview
The database consists of three separate collections for different user roles:
- **Users Collection** - Regular participants
- **Organizers Collection** - Hackathon organizers
- **Admins Collection** - System administrators

---

## 1. Users Collection (users)

### Purpose
Regular users who participate in hackathons.

### Schema Fields

| Field | Type | Required | Validation | Description |
|-------|------|----------|-----------|-------------|
| email | String | ✓ | Unique, lowercase, trimmed | User's email address |
| password | String | ✓ | Strong password validation | Hashed password (min 8 chars, uppercase, lowercase, number, special char) |
| firstName | String | ✓ | Non-empty string | User's first name |
| lastName | String | ✓ | Non-empty string | User's last name |
| phoneNumber | String | ✓ | Exactly 10 digits | User's mobile number |
| role | String | ✓ | Enum: ['user'] | User role (immutable) |
| profilePicture | String | ✗ | URL | User's profile picture |
| bio | String | ✗ | Text | User's bio/description |
| skills | Array | ✗ | Array of strings | User's skills list |
| joinedHackathons | Array | ✗ | Array of ObjectIds | References to joined hackathons |
| favoriteHackathons | Array | ✗ | Array of ObjectIds | References to favorite hackathons |
| isActive | Boolean | ✗ | Default: true | Account status |
| lastLogin | Date | ✗ | DateTime | Last login timestamp |
| createdAt | Date | Auto | Timestamp | Account creation time |
| updatedAt | Date | Auto | Timestamp | Last update time |

### Example Document
```json
{
  "_id": "ObjectId",
  "email": "john@example.com",
  "password": "HashedPassword123!",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "9876543210",
  "role": "user",
  "profilePicture": "https://...",
  "bio": "Passionate developer",
  "skills": ["JavaScript", "React", "MongoDB"],
  "joinedHackathons": ["ObjectId1", "ObjectId2"],
  "favoriteHackathons": ["ObjectId3"],
  "isActive": true,
  "lastLogin": "2026-01-17T10:30:00Z",
  "createdAt": "2026-01-15T09:00:00Z",
  "updatedAt": "2026-01-17T10:30:00Z"
}
```

---

## 2. Organizers Collection (organizers)

### Purpose
Users who organize and manage hackathons.

### Schema Fields

| Field | Type | Required | Validation | Description |
|-------|------|----------|-----------|-------------|
| email | String | ✓ | Unique, lowercase, trimmed | Organizer's email |
| password | String | ✓ | Strong password validation | Hashed password |
| firstName | String | ✓ | Non-empty string | Organizer's first name |
| lastName | String | ✓ | Non-empty string | Organizer's last name |
| phoneNumber | String | ✓ | Exactly 10 digits | Contact number |
| role | String | ✓ | Enum: ['organizer'] | Role (immutable) |
| organizationName | String | ✓ | Non-empty string | Organization/Company name |
| organizationWebsite | String | ✗ | URL | Organization website |
| organizationLogo | String | ✗ | URL | Organization logo URL |
| bio | String | ✗ | Text | Organization description |
| hackathonsCreated | Array | ✗ | Array of ObjectIds | Hackathons created by organizer |
| hackathonsManaged | Array | ✗ | Array of ObjectIds | Hackathons being managed |
| isVerified | Boolean | ✗ | Default: false | Verification status |
| verificationDocument | String | ✗ | URL/Document | Verification document/certificate |
| isActive | Boolean | ✗ | Default: true | Account status |
| lastLogin | Date | ✗ | DateTime | Last login timestamp |
| createdAt | Date | Auto | Timestamp | Account creation time |
| updatedAt | Date | Auto | Timestamp | Last update time |

### Example Document
```json
{
  "_id": "ObjectId",
  "email": "organizer@company.com",
  "password": "HashedPassword123!",
  "firstName": "Jane",
  "lastName": "Smith",
  "phoneNumber": "9876543210",
  "role": "organizer",
  "organizationName": "TechCorp",
  "organizationWebsite": "https://techcorp.com",
  "organizationLogo": "https://...",
  "bio": "Leading hackathon organizer",
  "hackathonsCreated": ["ObjectId1", "ObjectId2", "ObjectId3"],
  "hackathonsManaged": ["ObjectId1", "ObjectId2"],
  "isVerified": true,
  "verificationDocument": "https://...",
  "isActive": true,
  "lastLogin": "2026-01-17T10:30:00Z",
  "createdAt": "2026-01-16T09:00:00Z",
  "updatedAt": "2026-01-17T10:30:00Z"
}
```

---

## 3. Admins Collection (admins)

### Purpose
System administrators who manage the platform.

### Schema Fields

| Field | Type | Required | Validation | Description |
|-------|------|----------|-----------|-------------|
| email | String | ✓ | Unique, lowercase, trimmed | Admin's email |
| password | String | ✓ | Strong password validation | Hashed password |
| firstName | String | ✓ | Non-empty string | Admin's first name |
| lastName | String | ✓ | Non-empty string | Admin's last name |
| role | String | ✓ | Enum: ['admin'] | Role (immutable) |
| adminLevel | String | ✗ | Enum: ['super_admin', 'moderator', 'support'] | Admin privilege level |
| profilePicture | String | ✗ | URL | Admin's profile picture |
| permissions | Array | ✗ | Array of strings | List of permissions granted |
| usersManaged | Array | ✗ | Array of ObjectIds | Users managed by this admin |
| activityLog | Array | ✗ | Array of objects | Log of admin actions |
| isActive | Boolean | ✗ | Default: true | Account status |
| lastLogin | Date | ✗ | DateTime | Last login timestamp |
| createdAt | Date | Auto | Timestamp | Account creation time |
| updatedAt | Date | Auto | Timestamp | Last update time |

### Activity Log Object Structure
```json
{
  "action": "delete_user | ban_hackathon | approve_organizer",
  "targetId": "ObjectId",
  "targetType": "user | hackathon | organizer",
  "timestamp": "2026-01-17T10:30:00Z"
}
```

### Example Document
```json
{
  "_id": "ObjectId",
  "email": "admin@platform.com",
  "password": "HashedPassword123!",
  "firstName": "Admin",
  "lastName": "User",
  "role": "admin",
  "adminLevel": "super_admin",
  "profilePicture": "https://...",
  "permissions": [
    "view_users",
    "view_hackathons",
    "delete_user",
    "ban_hackathon",
    "approve_organizer",
    "manage_admins"
  ],
  "usersManaged": ["ObjectId1", "ObjectId2"],
  "activityLog": [
    {
      "action": "delete_user",
      "targetId": "ObjectId1",
      "targetType": "user",
      "timestamp": "2026-01-17T10:30:00Z"
    }
  ],
  "isActive": true,
  "lastLogin": "2026-01-17T10:30:00Z",
  "createdAt": "2026-01-10T09:00:00Z",
  "updatedAt": "2026-01-17T10:30:00Z"
}
```

---

## Password Validation Rules

All passwords must meet the following criteria:
- **Minimum Length:** 8 characters
- **Uppercase Letters:** At least one (A-Z)
- **Lowercase Letters:** At least one (a-z)
- **Numbers:** At least one (0-9)
- **Special Characters:** At least one (@$!%*?&)

### Regex Pattern
```
^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$
```

### Examples
- ✓ Valid: `Password123!`
- ✓ Valid: `MyHack@2026`
- ✗ Invalid: `password123` (no uppercase, no special char)
- ✗ Invalid: `Pass@123` (too short - 8 chars minimum is required)

---

## API Endpoints

### Signup
**POST** `/api/v1/user/signup`

Request Body:
```json
{
  "email": "user@example.com",
  "password": "StrongPass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "9876543210",
  "role": "user",
  "organizationName": "Optional - for organizers only"
}
```

### Signin
**POST** `/api/v1/user/signin`

Request Body:
```json
{
  "email": "user@example.com",
  "password": "StrongPass123!",
  "role": "user"
}
```

---

## Database Indexes

For optimal performance, the following indexes are recommended:

```javascript
// Users Collection
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ joinedHackathons: 1 });
db.users.createIndex({ lastLogin: -1 });

// Organizers Collection
db.organizers.createIndex({ email: 1 }, { unique: true });
db.organizers.createIndex({ hackathonsCreated: 1 });
db.organizers.createIndex({ isVerified: 1 });

// Admins Collection
db.admins.createIndex({ email: 1 }, { unique: true });
db.admins.createIndex({ adminLevel: 1 });
```

---

## Validation Summary

| Field | Type Validation | Format Validation |
|-------|-----------------|-------------------|
| email | String | Must contain @ and domain |
| password | String | Must be strong password |
| firstName | String | Non-empty, text only |
| lastName | String | Non-empty, text only |
| phoneNumber | String | Exactly 10 digits, numeric only |
| organizationName | String | Non-empty, text (organizers only) |

---

## Notes

- All timestamps are in UTC format (ISO 8601)
- Passwords should be hashed using bcrypt or similar before storage
- Email addresses are automatically lowercased and trimmed
- Role field is immutable after creation
- Each user type has its own collection for better data organization
- Activity logs for admins help with audit trails
