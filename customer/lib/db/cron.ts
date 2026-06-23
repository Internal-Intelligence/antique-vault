import { getSql } from "./index";
import { newId } from "./ids";

export async function logCronRun(jobName: string, result: unknown) {
  const sql = getSql();
  await sql`
    INSERT INTO cron_runs (id, job_name, result_json)
    VALUES (${newId("CRON")}, ${jobName}, ${JSON.stringify(result)}::jsonb)
  `;
}