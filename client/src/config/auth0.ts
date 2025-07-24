// Auth0 Configuration
// Replace these with your actual Auth0 credentials

export const auth0Config = {
  // For development testing - replace with your actual values
  domain: import.meta.env.VITE_AUTH0_DOMAIN || "dev-example.us.auth0.com",
  clientId: import.meta.env.VITE_AUTH0_CLIENT_ID || "test-client-id", 
  audience: import.meta.env.VITE_AUTH0_AUDIENCE || "https://mira-api.example.com",
  redirectUri: window.location.origin,
  scope: "openid profile email",
};

// Debug logging for Auth0 configuration
console.log('🔧 Auth0 Config:', {
  domain: auth0Config.domain,
  clientId: auth0Config.clientId,
  audience: auth0Config.audience,
  redirectUri: auth0Config.redirectUri
});

// For production, set up your Auth0 credentials:
// 1. Create an Auth0 account at https://auth0.com
// 2. Create a Single Page Application
// 3. Create a .env file in the client directory with:
//    VITE_AUTH0_DOMAIN=your-tenant.us.auth0.com
//    VITE_AUTH0_CLIENT_ID=your-client-id
//    VITE_AUTH0_AUDIENCE=https://your-app-api

// For immediate testing, you can also hardcode values here temporarily:
// export const auth0Config = {
//   domain: "dev-example.us.auth0.com",
//   clientId: "your-client-id-here",
//   audience: "your-api-identifier-here",
//   redirectUri: window.location.origin,
//   scope: "openid profile email",
// }; 