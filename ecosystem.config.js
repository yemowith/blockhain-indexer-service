module.exports = {
  apps: [
    {
      name: "batch-run",
      script: "npm",
      args: "run task:batch",
      env: {
        NODE_ENV: "production",
      },
      cwd: "./",
      autorestart: true,
      watch: true,
      error: "./app1-err.log",
    },
  ],
};
