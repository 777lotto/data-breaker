import { randomUUID } from "node:crypto";
import {
  chromium,
  type BrowserContext,
  type Locator,
  type Page,
} from "playwright";
import type {
  AdapterManifest,
  LocatorTarget,
  WorkflowStep,
} from "../adapters/schema.js";
import type { DataBreakerProfile } from "../config/profile.js";
import { resolveSemanticField } from "../core/fields.js";
import { createExecutionPlan } from "../core/plan.js";
import { sanitizeUrl } from "../security/redaction.js";
import { detectCaptcha } from "./captcha.js";
import { isAllowedNetworkUrl } from "./domain-policy.js";

type PlaywrightRole = Parameters<Page["getByRole"]>[0];

export interface RunOptions {
  headed?: boolean;
  approveSubmission?: boolean;
  browserChannel?: string;
  timeoutMs?: number;
}

export interface RunResult {
  runId: string;
  adapterId: string;
  subjectId: string;
  status: "completed" | "action-required";
  completedSteps: number;
  destination?: string;
  actionRequired?: {
    kind: "review" | "submission" | "captcha" | "identity";
    message: string;
  };
}

function locatorFor(page: Page, target: LocatorTarget): Locator {
  switch (target.strategy) {
    case "label":
      return page.getByLabel(target.value, { exact: true });
    case "role":
      return page.getByRole(target.role as PlaywrightRole, {
        name: target.name,
        exact: true,
      });
    case "text":
      return page.getByText(target.value, { exact: true });
    case "css":
      return page.locator(target.value);
  }
}

async function enforceDomainPolicy(
  context: BrowserContext,
  manifest: AdapterManifest,
): Promise<void> {
  await context.route("**/*", async (route) => {
    const request = route.request();
    if (isAllowedNetworkUrl(request.url(), manifest)) {
      await route.continue();
      return;
    }

    await route.abort("blockedbyclient");
  });
}

async function executeStep(
  page: Page,
  step: WorkflowStep,
  profile: DataBreakerProfile,
): Promise<void> {
  switch (step.type) {
    case "navigate":
      await page.goto(step.url, { waitUntil: "domcontentloaded" });
      return;
    case "fill":
      await locatorFor(page, step.target).fill(
        resolveSemanticField(profile, step.field),
      );
      return;
    case "check":
      await locatorFor(page, step.target).check();
      return;
    case "select":
      await locatorFor(page, step.target).selectOption(step.value);
      return;
    case "click":
      await locatorFor(page, step.target).click();
      return;
    case "expect":
      await locatorFor(page, step.target).waitFor({ state: "visible" });
      return;
    case "checkpoint":
      return;
  }
}

export async function runAdapter(
  manifest: AdapterManifest,
  profile: DataBreakerProfile,
  options: RunOptions = {},
): Promise<RunResult> {
  createExecutionPlan(manifest, profile);

  const runId = randomUUID();
  const launchOptions = {
    headless: !(options.headed ?? false),
    ...(options.browserChannel ? { channel: options.browserChannel } : {}),
  };
  const browser = await chromium.launch(launchOptions);
  let completedSteps = 0;
  let destination: string | undefined;

  try {
    const context = await browser.newContext({
      acceptDownloads: false,
      javaScriptEnabled: true,
      locale: "en-US",
      permissions: [],
    });
    context.setDefaultTimeout(options.timeoutMs ?? 15_000);
    await enforceDomainPolicy(context, manifest);
    const page = await context.newPage();

    for (const step of manifest.workflow.steps) {
      if (step.type === "checkpoint") {
        const mayContinue =
          step.kind === "submission" && (options.approveSubmission ?? false);
        if (!mayContinue) {
          return {
            runId,
            adapterId: manifest.id,
            subjectId: profile.subject.id,
            status: "action-required",
            completedSteps,
            ...(destination ? { destination } : {}),
            actionRequired: {
              kind: step.kind,
              message: step.message,
            },
          };
        }
        completedSteps += 1;
        continue;
      }

      await executeStep(page, step, profile);
      completedSteps += 1;
      if (step.type === "navigate") {
        destination = sanitizeUrl(page.url());
      }

      if (await detectCaptcha(page)) {
        return {
          runId,
          adapterId: manifest.id,
          subjectId: profile.subject.id,
          status: "action-required",
          completedSteps,
          ...(destination ? { destination } : {}),
          actionRequired: {
            kind: "captcha",
            message:
              "A CAPTCHA was detected. Continue this workflow in an interactive browser.",
          },
        };
      }
    }

    return {
      runId,
      adapterId: manifest.id,
      subjectId: profile.subject.id,
      status: "completed",
      completedSteps,
      ...(destination ? { destination } : {}),
    };
  } finally {
    await browser.close();
  }
}
