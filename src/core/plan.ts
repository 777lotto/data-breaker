import type { AdapterManifest } from "../adapters/schema.js";
import type { DataBreakerProfile } from "../config/profile.js";
import {
  resolveSemanticField,
  type SemanticField,
} from "./fields.js";
import { sanitizeUrl } from "../security/redaction.js";

export interface ExecutionPlan {
  adapter: {
    id: string;
    displayName: string;
    supportLevel: AdapterManifest["supportLevel"];
    policyBasis: AdapterManifest["policyBasis"];
  };
  subject: {
    id: string;
    jurisdiction: string;
    requesterCapacity: DataBreakerProfile["requester"]["capacity"];
  };
  requestTypes: AdapterManifest["requestTypes"];
  destinations: string[];
  fields: SemanticField[];
  checkpoints: Array<{
    kind: "review" | "submission" | "captcha" | "identity";
    message: string;
  }>;
}

function jurisdictionSupported(
  supportedJurisdictions: string[],
  jurisdiction: string,
): boolean {
  return supportedJurisdictions.some((supported) => {
    if (supported === jurisdiction) {
      return true;
    }
    if (supported.endsWith("-*")) {
      return jurisdiction.startsWith(supported.slice(0, -1));
    }
    return false;
  });
}

export function createExecutionPlan(
  manifest: AdapterManifest,
  profile: DataBreakerProfile,
): ExecutionPlan {
  if (!jurisdictionSupported(manifest.jurisdictions, profile.subject.jurisdiction)) {
    throw new Error(
      manifest.displayName +
        " does not support jurisdiction " +
        profile.subject.jurisdiction,
    );
  }

  const fields = Array.from(
    new Set(
      manifest.workflow.steps
        .filter((step) => step.type === "fill")
        .map((step) => step.field),
    ),
  );

  for (const field of fields) {
    resolveSemanticField(profile, field);
  }

  const destinations = Array.from(
    new Set(
      manifest.workflow.steps
        .filter((step) => step.type === "navigate")
        .map((step) => sanitizeUrl(step.url)),
    ),
  );

  const checkpoints = manifest.workflow.steps
    .filter((step) => step.type === "checkpoint")
    .map((step) => ({ kind: step.kind, message: step.message }));

  return {
    adapter: {
      id: manifest.id,
      displayName: manifest.displayName,
      supportLevel: manifest.supportLevel,
      policyBasis: manifest.policyBasis,
    },
    subject: {
      id: profile.subject.id,
      jurisdiction: profile.subject.jurisdiction,
      requesterCapacity: profile.requester.capacity,
    },
    requestTypes: manifest.requestTypes,
    destinations,
    fields,
    checkpoints,
  };
}
