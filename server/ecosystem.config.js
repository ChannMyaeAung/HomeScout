module.exports = {
  apps: [
    {
      name: "homescout-server",
      script: "pnpm",
      args: "run start",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
