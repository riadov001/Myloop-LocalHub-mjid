/**
 * PM2 Ecosystem — LocalMarket API Server
 * Usage : pm2 start ecosystem.config.cjs
 */
module.exports = {
  apps: [
    {
      name: "localmarket-api",
      script: "./index.mjs",
      instances: "max",          // 1 worker par cœur CPU
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 8080,
      },
      // Redémarre l'app si elle consomme plus de 500 Mo
      max_memory_restart: "500M",
      // Logs
      out_file: "./logs/api-out.log",
      error_file: "./logs/api-error.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      // Redémarre automatiquement si le serveur plante
      autorestart: true,
      watch: false,
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
    },
  ],
};
