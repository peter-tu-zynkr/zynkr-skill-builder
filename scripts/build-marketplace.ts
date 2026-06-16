#!/usr/bin/env tsx

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  buildMarketplaceArtifacts,
  loadNormalizedSkills,
  writeMarketplaceArtifacts,
} from "./marketplace-lib.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const GENERATED_SKILLS_PATH = path.join(ROOT, "generated", "skills.json");
const GENERATED_DIR = path.join(ROOT, "generated");
const REDIRECTS_PATH = path.join(GENERATED_DIR, "id-redirects.json");
const WEBSITE_DATA_DIR = path.resolve(ROOT, "..", "zynkr-website-fe", "data");

/**
 * Self-heal `generated/id-redirects.json`. That file maps OLD (vacated) ids ->
 * the canonical id they moved to, so stale links keep working. But the FIFO id
 * allocator can later REUSE a vacated id for a brand-new skill — leaving that id
 * both LIVE and a redirect source, which silently shadows its install URL
 * (zynkr.ai/s/<id>.md). A live id must never redirect, so on every build we drop
 * any redirect entry whose key is now a live skill id. This keeps the map honest
 * with no manual maintenance and stops the collision from recurring.
 */
function loadLiveSkillIds(): Set<string> {
  const raw = JSON.parse(fs.readFileSync(GENERATED_SKILLS_PATH, "utf-8"));
  const rows: any[] = Array.isArray(raw) ? raw : (raw?.skills ?? []);
  return new Set(rows.map(r => r?.id).filter(Boolean));
}

function pruneRedirectCollisions(liveIds: Set<string>): void {
  if (!fs.existsSync(REDIRECTS_PATH)) return;
  const redirects = JSON.parse(fs.readFileSync(REDIRECTS_PATH, "utf-8")) as Record<string, string>;
  const collisions = Object.keys(redirects).filter(id => liveIds.has(id));
  if (collisions.length === 0) return;
  for (const id of collisions) delete redirects[id];
  fs.writeFileSync(REDIRECTS_PATH, JSON.stringify(redirects, null, 2) + "\n", "utf-8");
  console.log(
    `  → id-redirects.json: pruned ${collisions.length} stale redirect(s) for now-live id(s): ${collisions.join(", ")}`
  );
}
export function syncMarketplaceArtifacts(): void {
  if (!fs.existsSync(GENERATED_SKILLS_PATH)) {
    throw new Error(`Missing normalized skills artifact: ${GENERATED_SKILLS_PATH}`);
  }

  // Governance: keep id-redirects.json free of entries that collide with live ids.
  pruneRedirectCollisions(loadLiveSkillIds());

  const CANONICAL_REPO_URL = "https://github.com/peter-tu-zynkr/zynkr-skill-builder";
  const PUBLISH_ONLY_DONE = process.env.PUBLISH_ONLY_DONE === "1";

  const allSkills = loadNormalizedSkills(GENERATED_SKILLS_PATH).map(skill => ({
    ...skill,
    sourceRepo: CANONICAL_REPO_URL,
    sourceFile: skill.sourceFile ? `skills/${skill.sourceFile}` : skill.sourceFile,
  }));

  const normalizedSkills = PUBLISH_ONLY_DONE
    ? allSkills.filter(skill => skill.status === "Done")
    : allSkills;

  if (PUBLISH_ONLY_DONE) {
    const hidden = allSkills.length - normalizedSkills.length;
    if (hidden > 0) console.log(`  → PUBLISH_ONLY_DONE=1: hiding ${hidden} non-Done skill(s) from marketplace`);
  }

  const artifacts = buildMarketplaceArtifacts(normalizedSkills);

  writeMarketplaceArtifacts(GENERATED_DIR, artifacts);

  if (fs.existsSync(path.dirname(WEBSITE_DATA_DIR))) {
    writeMarketplaceArtifacts(WEBSITE_DATA_DIR, artifacts);
  }

  console.log(`  → generated/skills-index.json updated (${artifacts.index.length} published skills total)`);
  console.log(`  → generated/skills-detail.json updated`);

  if (fs.existsSync(path.dirname(WEBSITE_DATA_DIR))) {
    console.log(`  → ../zynkr-website-fe/data synchronized`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  syncMarketplaceArtifacts();
}
