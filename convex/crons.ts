import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.daily(
  "collect live Indian footwear catalogs",
  { hourUTC: 0, minuteUTC: 30 },
  internal.dailyPipeline.syncDaily,
  {},
);

export default crons;
