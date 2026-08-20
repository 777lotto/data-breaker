import assert from "node:assert/strict";
import test from "node:test";
import {
  AdapterManifestSchema,
  loadAdapterManifest,
} from "../src/adapters/schema.js";

test("loads the local fixture adapter", async () => {
  const manifest = await loadAdapterManifest(
    "adapters/fake-broker/manifest.json",
  );

  assert.equal(manifest.id, "fake-broker");
  assert.equal(manifest.fixture, true);
  assert.equal(manifest.policyBasis, "voluntary");
});

test("rejects navigation outside declared domains", async () => {
  const manifest = await loadAdapterManifest(
    "adapters/fake-broker/manifest.json",
  );
  const candidate = structuredClone(manifest);
  const navigation = candidate.workflow.steps.find(
    (step) => step.type === "navigate",
  );
  assert.ok(navigation && navigation.type === "navigate");
  navigation.url = "https://unexpected.example/removal";

  const result = AdapterManifestSchema.safeParse(candidate);
  assert.equal(result.success, false);
});

test("rejects destructive clicks without a submission checkpoint", async () => {
  const manifest = await loadAdapterManifest(
    "adapters/fake-broker/manifest.json",
  );
  const candidate = structuredClone(manifest);
  candidate.workflow.steps = candidate.workflow.steps.filter(
    (step) => step.type !== "checkpoint",
  );

  const result = AdapterManifestSchema.safeParse(candidate);
  assert.equal(result.success, false);
});

test("rejects local network domains in production adapters", async () => {
  const manifest = await loadAdapterManifest(
    "adapters/fake-broker/manifest.json",
  );
  const candidate = structuredClone(manifest);
  candidate.fixture = false;
  candidate.homepage = "https://broker.example/removal";
  candidate.allowedDomains = ["broker.example"];
  candidate.resourceDomains = ["127.0.0.1"];
  for (const step of candidate.workflow.steps) {
    if (step.type === "navigate") {
      step.url = "https://broker.example/removal";
    }
  }

  const result = AdapterManifestSchema.safeParse(candidate);
  assert.equal(result.success, false);
});
