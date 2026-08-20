import assert from "node:assert/strict";
import test from "node:test";
import { loadProfileFromEnvironment } from "../src/config/profile.js";
import {
  redactObject,
  safeProfileSummary,
} from "../src/security/redaction.js";
import { syntheticEnvironment } from "./support/profile.js";

test("loads and safely summarizes a synthetic Georgia profile", () => {
  const profile = loadProfileFromEnvironment(syntheticEnvironment);
  const summary = safeProfileSummary(profile);

  assert.equal(profile.subject.jurisdiction, "US-GA");
  assert.equal(profile.requester.capacity, "self");
  assert.deepEqual(summary, {
    subjectId: "synthetic-georgia-resident",
    jurisdiction: "US-GA",
    requesterCapacity: "self",
    aliasCount: 0,
    emailCount: 1,
    phoneCount: 1,
    addressCount: 1,
  });
  assert.doesNotMatch(JSON.stringify(summary), /example\.invalid/);
});

test("requires authorization metadata for a representative", () => {
  const environment = {
    ...syntheticEnvironment,
    DATA_BREAKER_REQUESTER_CAPACITY: "authorized-agent",
    DATA_BREAKER_REQUESTER_FIRST_NAME: "Jordan",
    DATA_BREAKER_REQUESTER_LAST_NAME: "Taylor",
    DATA_BREAKER_REQUESTER_EMAIL: "jordan@example.invalid",
  };

  assert.throws(
    () => loadProfileFromEnvironment(environment),
    /DATA_BREAKER_REQUESTER_AUTHORIZATION_REFERENCE/,
  );
});

test("redacts sensitive object keys recursively", () => {
  const redacted = redactObject({
    adapter: "synthetic",
    subject: {
      email: "alex.morgan@example.invalid",
      phone: "+14045550100",
    },
  });

  assert.deepEqual(redacted, {
    adapter: "synthetic",
    subject: {
      email: "[REDACTED]",
      phone: "[REDACTED]",
    },
  });
});

test("rejects impossible calendar dates", () => {
  const environment = {
    ...syntheticEnvironment,
    DATA_BREAKER_SUBJECT_DATE_OF_BIRTH: "1990-02-31",
  };

  assert.throws(
    () => loadProfileFromEnvironment(environment),
    /real calendar date/,
  );
});
