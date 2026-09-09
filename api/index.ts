import app from "../server.js";

// Vercel serverless function entrypoint
// Routes all /api/* requests to Express instead of serving React index.html
export default app;
