#!/usr/bin/env node

import { access } from "node:fs/promises";
import { parseArgs } from "node:util";
import { config as loadDotEnv } from "dotenv";
import { chromium } from "playwright";
import { ZodError } from "zod";
import { loadAdapterManifest } from "../adapters/schema.js";
import { runAdapter } from "../browser/runner.js";
import { loadProfileFromEnvironment } from "../config/profile.js";
import { createExecutionPlan } from "../core/plan.js";
import {
  safeErrorMessage,
  safeProfileSummary,
} from "../security/redaction.js";

const help = [
  "data-breaker",
  "",
  "Usage:",
  "  data-breaker doctor [--adapter PATH] [--env-file PATH]",
  "  data-breaker profile validate [--env-file PATH]",
  "  data-breaker plan [--adapter PATH] [--env-file PATH]",
  "  data-breaker run [--adapter PATH] [--env-file PATH] [--headed]",
  "                   [--approve-submit] [--browser-channel CHANNEL]",
  "",
  "The run command stops at submission checkpoints unless --approve-submit is set.",
  "",
].join("\n");

function printJson(value: unknown): void {
  process.stdout.write(JSON.stringify(value, null, 2) + "\n");
}

function adapterPath(option: string | undefined): string {
  return (
    option ??
    process.env.DATA_BREAKER_ADAPTER ??
    "adapters/fake-broker/manifest.json"
  );
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function doctor(path: string): Promise<void> {
  const bundledBrowser = chromium.executablePath();
  const systemChrome = "/usr/bin/google-chrome";
  const [nodeMajor = 0, nodeMinor = 0] = process.versions.node
    .split(".")
    .map(Number);
  const nodeSupported =
    nodeMajor > 20 || (nodeMajor === 20 && nodeMinor >= 19);
  let profileStatus: "valid" | "not-configured" | "invalid";
  try {
    loadProfileFromEnvironment();
    profileStatus = "valid";
  } catch (error) {
    profileStatus = safeErrorMessage(error).startsWith(
      "Missing required environment variable",
    )
      ? "not-configured"
      : "invalid";
  }

  printJson({
    node: {
      version: process.version,
      supported: nodeSupported,
    },
    profile: profileStatus,
    adapter: {
      path,
      found: await fileExists(path),
    },
    browser: {
      requestedChannel: process.env.DATA_BREAKER_BROWSER_CHANNEL ?? null,
      bundledChromiumFound: await fileExists(bundledBrowser),
      systemChromeFound: await fileExists(systemChrome),
    },
  });
}

async function main(): Promise<void> {
  const parsed = parseArgs({
    allowPositionals: true,
    strict: true,
    options: {
      adapter: { type: "string" },
      "approve-submit": { type: "boolean", default: false },
      "browser-channel": { type: "string" },
      "env-file": { type: "string" },
      headed: { type: "boolean", default: false },
      help: { type: "boolean", short: "h", default: false },
    },
  });

  if (parsed.values.help) {
    process.stdout.write(help);
    return;
  }

  loadDotEnv({
    path: parsed.values["env-file"] ?? ".env",
    override: false,
    quiet: true,
  });

  const [command, subcommand] = parsed.positionals;
  const path = adapterPath(parsed.values.adapter);

  if (command === "doctor") {
    await doctor(path);
    return;
  }

  if (command === "profile" && subcommand === "validate") {
    const profile = loadProfileFromEnvironment();
    printJson({ valid: true, profile: safeProfileSummary(profile) });
    return;
  }

  if (command === "plan") {
    const profile = loadProfileFromEnvironment();
    const manifest = await loadAdapterManifest(path);
    printJson(createExecutionPlan(manifest, profile));
    return;
  }

  if (command === "run") {
    const profile = loadProfileFromEnvironment();
    const manifest = await loadAdapterManifest(path);
    const browserChannel =
      parsed.values["browser-channel"] ??
      process.env.DATA_BREAKER_BROWSER_CHANNEL;
    const result = await runAdapter(manifest, profile, {
      headed: parsed.values.headed,
      approveSubmission: parsed.values["approve-submit"],
      ...(browserChannel ? { browserChannel } : {}),
    });
    printJson(result);
    if (result.status === "action-required") {
      process.exitCode = 2;
    }
    return;
  }

  process.stdout.write(help);
  process.exitCode = 1;
}

main().catch((error: unknown) => {
  if (error instanceof ZodError) {
    printJson({
      error: "Validation failed",
      issues: error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
  } else {
    printJson({ error: safeErrorMessage(error) });
  }
  process.exitCode = 1;
});
