import app from "./app";
import { logger } from "./lib/logger";
import { recoverInterruptedRuns } from "./lib/study-store";
import { ensureJudgeDemo } from "./lib/judge-demo";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

await recoverInterruptedRuns();
try {
  await ensureJudgeDemo();
} catch (error) {
  logger.error({ err: error }, "Could not initialize the development judge account");
}
app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
