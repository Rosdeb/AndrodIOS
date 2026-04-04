const env = {
  port: Number(process.env.PORT || 4000),
  nodeEnv: process.env.NODE_ENV || "development",
  adminApiKey: process.env.ADMIN_API_KEY || "dev-admin-key"
};

export { env };
