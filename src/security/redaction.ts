import type { DataBreakerProfile } from "../config/profile.js";

const sensitiveKeyPattern =
  /(address|authorization|birth|credential|email|first.?name|last.?name|middle.?name|password|phone|postal|secret|token)/i;

export interface SafeProfileSummary {
  subjectId: string;
  jurisdiction: string;
  requesterCapacity: DataBreakerProfile["requester"]["capacity"];
  aliasCount: number;
  emailCount: number;
  phoneCount: number;
  addressCount: number;
}

export function safeProfileSummary(
  profile: DataBreakerProfile,
): SafeProfileSummary {
  return {
    subjectId: profile.subject.id,
    jurisdiction: profile.subject.jurisdiction,
    requesterCapacity: profile.requester.capacity,
    aliasCount: profile.subject.aliases.length,
    emailCount: profile.subject.emails.length,
    phoneCount: profile.subject.phones.length,
    addressCount: profile.subject.addresses.length,
  };
}

export function sanitizeUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    url.username = "";
    url.password = "";
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return "[invalid-url]";
  }
}

export function redactObject(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redactObject);
  }
  if (value === null || typeof value !== "object") {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [
      key,
      sensitiveKeyPattern.test(key) ? "[REDACTED]" : redactObject(child),
    ]),
  );
}

export function safeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message.replace(
      /(https?:\/\/[^\s?#]+)[?#][^\s]*/gi,
      "$1?[REDACTED]",
    );
  }

  return "Unknown error";
}
