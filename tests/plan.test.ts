import assert from "node:assert/strict";
import test from "node:test";
import { loadAdapterManifest } from "../src/adapters/schema.js";
import { createExecutionPlan } from "../src/core/plan.js";
import { syntheticProfile } from "./support/profile.js";

test("plans semantic fields without exposing profile values", async () => {
  const profile = syntheticProfile();
  const manifest = await loadAdapterManifest(
    "adapters/fake-broker/manifest.json",
  );
  const plan = createExecutionPlan(manifest, profile);
  const serialized = JSON.stringify(plan);

  assert.equal(plan.subject.jurisdiction, "US-GA");
  assert.ok(plan.fields.includes("subject.primaryEmail"));
  assert.ok(plan.fields.includes("subject.currentAddress.postalCode"));
  assert.doesNotMatch(serialized, /alex\.morgan@example\.invalid/i);
  assert.doesNotMatch(serialized, /100 Example Plaza/i);
  assert.doesNotMatch(serialized, /\+14045550100/);
});
