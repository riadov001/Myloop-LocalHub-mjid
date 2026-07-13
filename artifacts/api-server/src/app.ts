import express, { type Express } from "express";
import cors from "cors";
import compression from "compression";
import pinoHttp from "pino-http";
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

export default app;
