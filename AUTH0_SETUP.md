# Auth0 Setup Guide

This application uses Auth0 for authentication. Follow these steps to set up Auth0:

## 1. Create Auth0 Account

1. Go to [Auth0](https://auth0.com) and create a free account
2. Create a new tenant (e.g., `your-app-name`)

## 2. Create Auth0 Application

1. In your Auth0 dashboard, go to "Applications"
2. Click "Create Application"
3. Choose "Single Page Web Applications"
4. Select "React" as the technology

## 3. Configure Application Settings

In your Auth0 application settings:

### Allowed Callback URLs:
```
http://localhost:5173, http://localhost:3000, https://yourdomain.com
```

### Allowed Logout URLs:
```
http://localhost:5173, http://localhost:3000, https://yourdomain.com
```

### Allowed Web Origins:
```
http://localhost:5173, http://localhost:3000, https://yourdomain.com
```

## 4. Create API (Optional but Recommended)

1. Go to "APIs" in your Auth0 dashboard
2. Click "Create API"
3. Set a name and identifier (e.g., `https://your-app-api`)
4. Choose "RS256" as the signing algorithm

## 5. Configure Environment Variables

### Option 1: Environment Variables (Recommended)
Create a `.env` file in the `client` directory:

```env
VITE_AUTH0_DOMAIN=your-tenant.us.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
VITE_AUTH0_AUDIENCE=https://your-app-api
```

### Option 2: Direct Configuration (For Testing)
Edit `client/src/config/auth0.ts` and replace the placeholder values:

```typescript
export const auth0Config = {
  domain: "your-tenant.us.auth0.com",
  clientId: "your-client-id-here",
  audience: "https://your-app-api",
  redirectUri: window.location.origin,
  scope: "openid profile email",
};
```

## 6. Set Up User Roles (Optional)

To automatically assign roles during registration:

1. Go to "Actions" > "Flows" > "Login"
2. Create a new action with this code:

```javascript
exports.onExecutePostLogin = async (event, api) => {
  const { email } = event.user;
  
  // Assign role based on email domain or other logic
  if (email.includes('@teacher.')) {
    api.user.setAppMetadata('role', 'teacher');
  } else {
    api.user.setAppMetadata('role', 'student');
  }
};
```

## 7. Test the Setup

1. Start your development server: `npm run dev`
2. Navigate to the application
3. Try logging in as both student and teacher
4. Verify that users are redirected to the appropriate dashboards

## Troubleshooting

- **CORS errors**: Make sure your callback URLs are properly configured
- **Token validation errors**: Verify your API audience matches
- **Role assignment**: Check your Auth0 actions are properly configured

## Security Notes

- Never commit your Auth0 credentials to version control
- Use environment variables in production
- Regularly rotate your client secrets
- Monitor your Auth0 logs for suspicious activity 