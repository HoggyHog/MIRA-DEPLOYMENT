import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import fileUpload from "express-fileupload";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  useTempFiles: true,
  tempFileDir: '/tmp/'
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Register the proxy BEFORE Vite/static
  app.use('/api', createProxyMiddleware({
    target: 'http://localhost:8001',  // FastAPI server
    changeOrigin: true,
    logLevel: 'debug',
    // no pathRewrite needed
    onProxyReq: (proxyReq, req, res) => {
      log(`🔀 Proxying ${req.method} ${req.path} to FastAPI`);
    },
    onProxyRes: (proxyRes, req, res) => {
      log(`✅ FastAPI response: ${proxyRes.statusCode} for ${req.method} ${req.path}`);
    },
    onError: (err, req, res) => {
      log(`❌ Proxy error for ${req.method} ${req.path}: ${err.message}`);
      res.status(500).json({ error: 'Proxy error', details: err.message });
    }
  }));

  // Vite/static setup LAST
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 3000
  const port = 3000;
  server.listen({
    port,
    host: "0.0.0.0"
  }, () => {
    log(`serving on port ${port}`);
  });
})();
