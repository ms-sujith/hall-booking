import "dotenv/config";

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const env = {
  // Database configuration
  DATABASE_URL: getRequiredEnv("DATABASE_URL"),

  // Authentication configuration
  JWT_SECRET: getRequiredEnv("JWT_SECRET"),

  // Frontend configuration
  FRONTEND_URL: getRequiredEnv("FRONTEND_URL"),

  // Server configuration
  PORT: process.env.PORT || "5000",

  // Razorpay configuration
  // Optional at startup; validate before using Razorpay endpoints.
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
};
