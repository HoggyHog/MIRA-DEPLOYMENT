# Mira by Centum AI - Educational Management System

A comprehensive educational management platform for students, teachers, parents, and administrators.

## 🚀 Quick Start

### Setup Instructions
To run the application with Auth0 authentication:

1. **Set up Auth0** (follow `AUTH0_SETUP.md`)
2. **Configure credentials** in `client/src/config/auth0.ts`:
   ```typescript
   export const auth0Config = {
     domain: "your-tenant.us.auth0.com",
     clientId: "your-client-id-here",
     audience: "https://your-app-api",
     redirectUri: window.location.origin,
     scope: "openid profile email",
   };
   ```
3. **Install and Run**:
   ```bash
   npm install
   npm run dev
   ```
4. **Access** - Visit `http://localhost:5173` to see the login page

## 🏗️ Architecture

### Authentication System
- **Auth0 Integration**: Full Auth0 authentication with JWT verification
- **Role-Based Access**: Automatic redirection based on user roles
- **Database Integration**: User profiles stored in PostgreSQL/Neon

### Dashboard Routes
- `/student-dashboard` - Student portal (requires authentication)
- `/teacher-dashboard` - Teacher portal (requires authentication) 
- `/parent-dashboard` - Parent portal (direct access, no authentication)
- `/admin-dashboard` - Admin portal (direct access, no authentication)
- `/student-pilot` - Demo student features (public)
- `/teacher-pilot` - Demo teacher features (public)

### Tech Stack
- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL (Neon), Drizzle ORM
- **Authentication**: Auth0 (production) / Mock (development)
- **UI**: shadcn/ui components

## 🔧 Development

### Project Structure
```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Dashboard pages
│   │   ├── providers/     # Auth provider
│   │   └── config/        # Auth0 configuration
├── server/                # Express backend
│   ├── authRoutes.ts      # Authentication endpoints
│   ├── authMiddleware.ts  # JWT verification
│   └── storage.ts         # Database operations
└── shared/                # Shared types and schemas
```

### Environment Variables
```bash
# Database
DATABASE_URL=your-neon-postgres-url

# Auth0 (optional - leave empty for development mode)
AUTH0_DOMAIN=your-tenant.us.auth0.com
AUTH0_AUDIENCE=your-api-identifier

# Client Auth0 (optional)
VITE_AUTH0_DOMAIN=your-tenant.us.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
VITE_AUTH0_AUDIENCE=your-api-identifier
```

## 🎯 Features

### Student Dashboard
- AI-powered tutoring and doubt resolution
- Interactive practice playground
- Progress tracking and analytics
- Assignment and homework management
- Study schedule and calendar

### Teacher Dashboard
- AI exam generation
- Lesson planning and classroom management
- Student analytics and performance tracking
- Assignment interface
- Attendance and scheduling

### Parent Dashboard
- Child's academic progress monitoring
- Communication with teachers
- Attendance tracking
- Performance analytics

### Admin Dashboard
- User management and system monitoring
- Attendance and leave management
- Fee collection and reporting
- Communication center
- AI analytics dashboard

## 🔐 Security

- **JWT Token Verification**: Full Auth0 integration in production
- **Role-Based Access Control**: API endpoints protected by user roles
- **Database Security**: Parameterized queries and proper data validation
- **Environment Variables**: Sensitive data protected via environment configuration

## 📖 Getting Started

1. **Clone the repository**
2. **Set up Auth0**: Follow `AUTH0_SETUP.md` to configure authentication
3. **Install dependencies**: `npm install`
4. **Start development**: `npm run dev`
5. **Test the authentication**: Click Student or Teacher login buttons

The application uses Auth0 for secure authentication with role-based access control.

## 🤝 Contributing

The authentication system is fully functional with Auth0 integration. The pilot dashboards remain unchanged as requested, and all new authentication features work seamlessly.

For issues or feature requests, please create an issue in the repository. 