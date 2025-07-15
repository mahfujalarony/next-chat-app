// Environment variables configuration
export const ENV = {
  // API Configuration
  API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000",
  
  // Firebase Configuration
  FIREBASE: {
    API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
    AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
    PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
    STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
    MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
    APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  },
  
  // Development flags
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
} as const;

// Type for environment validation
export type EnvironmentConfig = typeof ENV;

// Environment validation
export const validateEnvironment = () => {
  const requiredEnvVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', 
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  ];

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missingVars.length > 0 && ENV.IS_PRODUCTION) {
    console.warn('⚠️ Missing environment variables:', missingVars);
  }

  // Log environment info in development
  if (ENV.IS_DEVELOPMENT) {
    console.log('🌐 Environment Configuration:');
    console.log('  API URL:', ENV.API_URL);
    console.log('  Socket URL:', ENV.SOCKET_URL);
    console.log('  Firebase Project:', ENV.FIREBASE.PROJECT_ID);
  }
};
