/** @type {import('next').NextConfig} */

// Start local SQLite bridge in development when no PostgreSQL DATABASE_URL is configured
if (process.env.NODE_ENV !== 'production' && !process.env.DATABASE_URL) {
  try {
    const { startSqliteBridge } = require('./lib/db/sqliteBridge');
    startSqliteBridge().catch((err) => {
      console.error('[next.config.js] Failed to start local SQLite bridge:', err);
    });
  } catch (err) {
    console.error('[next.config.js] SQLite bridge module failed to initialize:', err);
  }
}

const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(Array.isArray(config.externals) ? config.externals : []), 'better-sqlite3'];
    }
    return config;
  },
};

module.exports = nextConfig;
