import { readFile } from "node:fs/promises";
import { isIP } from "node:net";
import { resolve } from "node:path";
import { z } from "zod";
import { SemanticFieldSchema } from "../core/fields.js";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const hostnamePattern =
  /^(?:localhost|(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)$/i;

export const LocatorTargetSchema = z.discriminatedUnion("strategy", [
  z.object({
    strategy: z.literal("label"),
    value: z.string().min(1),
  }),
  z.object({
    strategy: z.literal("role"),
    role: z.enum([
      "button",
      "checkbox",
      "combobox",
      "heading",
      "link",
      "radio",
      "status",
      "textbox",
    ]),
    name: z.string().min(1),
  }),
  z.object({
    strategy: z.literal("text"),
    value: z.string().min(1),
  }),
  z.object({
    strategy: z.literal("css"),
    value: z.string().min(1),
  }),
]);

const NavigateStepSchema = z.object({
  type: z.literal("navigate"),
  url: z.string().url(),
});

const FillStepSchema = z.object({
  type: z.literal("fill"),
  field: SemanticFieldSchema,
  target: LocatorTargetSchema,
});

const CheckStepSchema = z.object({
  type: z.literal("check"),
  target: LocatorTargetSchema,
});

const SelectStepSchema = z.object({
  type: z.literal("select"),
  value: z.string().min(1),
  target: LocatorTargetSchema,
});

const ClickStepSchema = z.object({
  type: z.literal("click"),
  target: LocatorTargetSchema,
  destructive: z.boolean(),
});

const CheckpointStepSchema = z.object({
  type: z.literal("checkpoint"),
  kind: z.enum(["review", "submission", "captcha", "identity"]),
  message: z.string().min(1),
});

const ExpectStepSchema = z.object({
  type: z.literal("expect"),
  target: LocatorTargetSchema,
});

export const WorkflowStepSchema = z.discriminatedUnion("type", [
  NavigateStepSchema,
  FillStepSchema,
  CheckStepSchema,
  SelectStepSchema,
  ClickStepSchema,
  CheckpointStepSchema,
  ExpectStepSchema,
]);

export const AdapterManifestSchema = z
  .object({
    schemaVersion: z.literal(1),
    id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
    displayName: z.string().min(1),
    description: z.string().min(1),
    homepage: z.string().url(),
    fixture: z.boolean().default(false),
    allowedDomains: z.array(z.string().regex(hostnamePattern)).min(1),
    resourceDomains: z.array(z.string().regex(hostnamePattern)).default([]),
    jurisdictions: z.array(z.string().regex(/^[A-Z]{2}(?:-[A-Z0-9*]{1,3})?$/)).min(1),
    requestTypes: z
      .array(z.enum(["delete", "suppress", "opt-out-sale", "opt-out-sharing"]))
      .min(1),
    supportLevel: z.enum([
      "cataloged",
      "guided",
      "assisted",
      "automatic",
      "manual-only",
      "broken",
      "fixture",
    ]),
    policyBasis: z.enum([
      "statutory",
      "published-policy",
      "voluntary",
      "unknown",
    ]),
    lastVerified: z.string().regex(datePattern),
    workflow: z.object({
      steps: z.array(WorkflowStepSchema).min(1),
    }),
  })
  .superRefine((manifest, context) => {
    if (!manifest.fixture) {
      for (const [field, domains] of [
        ["allowedDomains", manifest.allowedDomains],
        ["resourceDomains", manifest.resourceDomains],
      ] as const) {
        for (const [index, domain] of domains.entries()) {
          if (domain === "localhost" || isIP(domain) !== 0) {
            context.addIssue({
              code: "custom",
              path: [field, index],
              message:
                "Production adapters cannot declare localhost or IP-address domains",
            });
          }
        }
      }
    }

    const allowed = new Set(manifest.allowedDomains);
    const urls = [
      { path: ["homepage"], value: manifest.homepage },
      ...manifest.workflow.steps
        .map((step, index) =>
          step.type === "navigate"
            ? { path: ["workflow", "steps", index, "url"], value: step.url }
            : undefined,
        )
        .filter(
          (candidate): candidate is { path: (string | number)[]; value: string } =>
            candidate !== undefined,
        ),
    ];

    for (const candidate of urls) {
      const url = new URL(candidate.value);
      if (url.protocol !== "https:" && !(manifest.fixture && url.protocol === "http:")) {
        context.addIssue({
          code: "custom",
          path: candidate.path,
          message: "Production adapter URLs must use HTTPS",
        });
      }
      if (!allowed.has(url.hostname)) {
        context.addIssue({
          code: "custom",
          path: candidate.path,
          message: "URL hostname is not declared in allowedDomains",
        });
      }
      if (
        !manifest.fixture &&
        (url.hostname === "localhost" || url.hostname === "127.0.0.1")
      ) {
        context.addIssue({
          code: "custom",
          path: candidate.path,
          message: "Loopback domains are reserved for fixture adapters",
        });
      }
    }

    let submissionCheckpointSeen = false;
    for (const [index, step] of manifest.workflow.steps.entries()) {
      if (step.type === "checkpoint" && step.kind === "submission") {
        submissionCheckpointSeen = true;
      }
      if (step.type === "click" && step.destructive && !submissionCheckpointSeen) {
        context.addIssue({
          code: "custom",
          path: ["workflow", "steps", index],
          message:
            "A destructive click must follow an explicit submission checkpoint",
        });
      }
    }
  });

export type LocatorTarget = z.infer<typeof LocatorTargetSchema>;
export type WorkflowStep = z.infer<typeof WorkflowStepSchema>;
export type AdapterManifest = z.infer<typeof AdapterManifestSchema>;

export async function loadAdapterManifest(
  manifestPath: string,
): Promise<AdapterManifest> {
  const absolutePath = resolve(manifestPath);
  const contents = await readFile(absolutePath, "utf8");
  let candidate: unknown;
  try {
    candidate = JSON.parse(contents);
  } catch {
    throw new Error("Adapter manifest is not valid JSON: " + manifestPath);
  }

  return AdapterManifestSchema.parse(candidate);
}
