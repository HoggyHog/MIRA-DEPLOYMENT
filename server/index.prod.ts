import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import fileUpload from "express-fileupload";
import { registerRoutes } from "./routes";
import { createProxyMiddleware } from 'http-proxy-middleware';
import fs from "fs";
import path from "path";

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

      console.log(logLine);
    }
  });

  next();
});

// Production static file serving function
function serveStatic(app: express.Express) {
  const distPath = path.resolve(import.meta.dirname, "..", "dist", "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Register the proxy BEFORE static files
  app.use('/api', createProxyMiddleware({
    target: 'http://localhost:8001',  // FastAPI server
    changeOrigin: true,
    logLevel: 'debug',
    // no pathRewrite needed
    onProxyReq: (proxyReq, req, res) => {
      console.log(`🔀 Proxying ${req.method} ${req.path} to FastAPI`);
    },
    onProxyRes: (proxyRes, req, res) => {
      console.log(`✅ FastAPI response: ${proxyRes.statusCode} for ${req.method} ${req.path}`);
    },
    onError: (err, req, res) => {
      console.log(`❌ Proxy error for ${req.method} ${req.path}: ${err.message}`);
      res.status(500).json({ error: 'Proxy error', details: err.message });
    }
  }));

  // Serve static files for production
  serveStatic(app);

  // ALWAYS serve the app on port 3000
  const port = 3000;
  server.listen({
    port,
    host: "0.0.0.0"
  }, () => {
    console.log(`serving on port ${port}`);
  });
})(); 