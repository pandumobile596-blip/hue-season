import { writeFileSync } from "node:fs";
import { it } from "vitest";
import { computeDimensions } from "@/lib/analysis/dimensions";
import { matchSeason } from "@/lib/seasons";
import { people } from "./fixtures";

// Run with CALIBRATE=1 (e.g. `CALIBRATE=1 npm run calibrate`) to write a table of scores to calibration.txt (handy when tuning lib/seasons.ts).
it.skipIf(!process.env.CALIBRATE)("writes a calibration table", () => {
  const lines = people.map((p) => {
    const d = computeDimensions(p.features);
    const m = matchSeason(d);
    const ok = p.expect.includes(m.top) ? "OK " : "BAD";
    return [ok, JSON.stringify(d), m.top, m.second, m.confidence, "|", p.name].join(" ");
  });
  writeFileSync("calibration.txt", lines.join("\n") + "\n");
});
