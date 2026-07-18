import express, { type Express } from "express";
import cors from "cors";
import compression from "compression";
import pinoHttp from "pino-http";
import path from "path";
import { fileURLToPath } from "url";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// Replit serves this app behind a reverse proxy, so req.ip would otherwise resolve to the
// proxy's address for every request. Trusting the first hop lets express-rate-limit (and
// anything else keying off req.ip) see the real client IP instead of one shared IP for all users.
app.set("trust proxy", 1);

// Gzip compression for all responses
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers["x-no-compression"]) return false;
    return compression.filter(req, res);
  },
}));

// ⚠️ Webhook Stripe : doit être enregistré AVANT express.json() pour conserver le body brut
app.use("/api/webhooks/stripe", express.raw({ type: "application/json" }));

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// In production, serve the compiled frontend from dist/public/
// The build script copies the Vite output there alongside this bundle.
if (process.env.NODE_ENV === "production") {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const publicDir = path.join(__dirname, "public");
  app.use(express.static(publicDir));
  // SPA fallback: every non-API route returns index.html
  app.get("*", (_req, res) => {
    res.sendFile(path.join(publicDir, "index.html"));
  });
}

export default app;
