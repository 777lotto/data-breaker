import { existsSync } from "node:fs";
import assert from "node:assert/strict";
import test from "node:test";
import {
  AdapterManifestSchema,
  loadAdapterManifest,
  type AdapterManifest,
} from "../../src/adapters/schema.js";
import { runAdapter } from "../../src/browser/runner.js";
import { startFixtureServer } from "../support/fixture-server.js";
import { syntheticProfile } from "../support/profile.js";

async function fixtureManifest(origin: string): Promise<AdapterManifest> {
  const manifest = await loadAdapterManifest(
    "adapters/fake-broker/manifest.json",
  );
  const candidate = structuredClone(manifest);
  candidate.homepage = origin + "/removal";
  for (const step of candidate.workflow.steps) {
    if (step.type === "navigate") {
      step.url = origin + "/removal";
    }
  }
  return AdapterManifestSchema.parse(candidate);
}

function localBrowserChannel(): string | undefined {
  const configured = process.env.DATA_BREAKER_TEST_BROWSER_CHANNEL;
  if (configured) {
    return configured;
  }
  return existsSync("/usr/bin/google-chrome") ? "chrome" : undefined;
}

test("fills the fixture and stops before unapproved submission", async () => {
  const fixture = await startFixtureServer();
  try {
    const manifest = await fixtureManifest(fixture.origin);
    const browserChannel = localBrowserChannel();
    const result = await runAdapter(manifest, syntheticProfile(), {
      ...(browserChannel ? { browserChannel } : {}),
    });

    assert.equal(result.status, "action-required");
    assert.equal(result.actionRequired?.kind, "submission");
    assert.equal(result.completedSteps, 10);
  } finally {
    await fixture.close();
  }
});

test("submits the fixture only after explicit approval", async () => {
  const fixture = await startFixtureServer();
  try {
    const manifest = await fixtureManifest(fixture.origin);
    const browserChannel = localBrowserChannel();
    const result = await runAdapter(manifest, syntheticProfile(), {
      approveSubmission: true,
      ...(browserChannel ? { browserChannel } : {}),
    });

    assert.equal(result.status, "completed");
    assert.equal(result.completedSteps, manifest.workflow.steps.length);
  } finally {
    await fixture.close();
  }
});
