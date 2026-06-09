// PM2 process config for the Next.js production server.
// CommonJS (.cjs) because package.json sets "type": "module" and PM2 expects CJS.
// Next.js charge automatiquement le fichier .env du dossier (cwd) au démarrage.
module.exports = {
  apps: [
    {
      name: "the-hub-website",
      script: "node_modules/next/dist/bin/next",
      // Port 3100 : 3000 (vol-histoire) et 3001 (playbooks) sont déjà pris sur ce serveur.
      args: "start -p 3100",
      cwd: "/var/www/the-hub-website",
      instances: 1,
      autorestart: true,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: "3100",
      },
    },
  ],
};
