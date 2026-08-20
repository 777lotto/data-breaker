import {
  loadProfileFromEnvironment,
  type DataBreakerProfile,
} from "../../src/config/profile.js";

export const syntheticEnvironment: Record<string, string> = {
  DATA_BREAKER_JURISDICTION: "US-GA",
  DATA_BREAKER_SUBJECT_ID: "synthetic-georgia-resident",
  DATA_BREAKER_SUBJECT_FIRST_NAME: "Alex",
  DATA_BREAKER_SUBJECT_MIDDLE_NAME: "Quinn",
  DATA_BREAKER_SUBJECT_LAST_NAME: "Morgan",
  DATA_BREAKER_SUBJECT_ALIASES: "[]",
  DATA_BREAKER_SUBJECT_DATE_OF_BIRTH: "1990-01-01",
  DATA_BREAKER_SUBJECT_EMAILS: '["alex.morgan@example.invalid"]',
  DATA_BREAKER_SUBJECT_PHONES: '["+14045550100"]',
  DATA_BREAKER_SUBJECT_ADDRESSES:
    '[{"kind":"current","line1":"100 Example Plaza","city":"Atlanta","region":"GA","postalCode":"30303","country":"US"}]',
  DATA_BREAKER_REQUESTER_CAPACITY: "self",
};

export function syntheticProfile(): DataBreakerProfile {
  return loadProfileFromEnvironment(syntheticEnvironment);
}
