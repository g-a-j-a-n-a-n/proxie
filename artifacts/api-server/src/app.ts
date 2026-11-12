import express, { type Express } from "express";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import { CLERK_PROXY_PATH, clerkProxyMiddleware, getClerkProxyHost } from "./middlewares/clerkProxyMiddleware";
import { requestSecurity } from "./middlewares/requestSecurity";

const app: Express = express();
app.disable("x-powered-by");

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
app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());
app.use("/api", requestSecurity);
app.use(express.json({ limit: "2mb", inflate: false }));
app.use(express.urlencoded({ extended: false, limit: "32kb", parameterLimit: 100, inflate: false }));
app.use(clerkMiddleware((req) => ({
  publishableKey: publishableKeyFromHost(getClerkProxyHost(req) ?? "", process.env.CLERK_PUBLISHABLE_KEY),
})));

app.use("/api", router);
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  req.log.error({ name: err?.name }, "Request failed");
  res.status(err?.status || 500).json({ error: err?.status ? err.message : "Something went wrong. Please try again." });
});

export default app;
