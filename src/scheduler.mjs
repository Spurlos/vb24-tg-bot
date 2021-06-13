import { AsyncTask, SimpleIntervalJob, ToadScheduler } from "toad-scheduler";

const scheduler = new ToadScheduler();

function scheduleTask(callback, interval) {
  const task = new AsyncTask("simple task", callback);
  const job = new SimpleIntervalJob({ seconds: interval }, task);

  scheduler.addSimpleIntervalJob(job);
}

// Enable graceful stop
process.once("SIGINT", () => scheduler.stop());
process.once("SIGTERM", () => scheduler.stop());

export default scheduleTask;
