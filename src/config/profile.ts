import { z } from "zod";

const jurisdictionPattern = /^[A-Z]{2}(?:-[A-Z0-9]{1,3})?$/;
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

function isCalendarDate(value: string): boolean {
  const parsed = new Date(value + "T00:00:00.000Z");
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

export const PersonNameSchema = z.object({
  first: z.string().trim().min(1),
  middle: z.string().trim().min(1).optional(),
  last: z.string().trim().min(1),
  suffix: z.string().trim().min(1).optional(),
});

export const AddressSchema = z.object({
  kind: z.enum(["current", "previous"]),
  line1: z.string().trim().min(1),
  line2: z.string().trim().min(1).optional(),
  city: z.string().trim().min(1),
  region: z.string().trim().min(1),
  postalCode: z.string().trim().min(1),
  country: z.string().trim().length(2).transform((value) => value.toUpperCase()),
});

export const SubjectSchema = z.object({
  id: z.string().trim().min(1).regex(/^[a-z0-9][a-z0-9_-]*$/i),
  jurisdiction: z
    .string()
    .trim()
    .regex(jurisdictionPattern)
    .transform((value) => value.toUpperCase()),
  name: PersonNameSchema,
  aliases: z.array(PersonNameSchema).default([]),
  dateOfBirth: z
    .string()
    .regex(isoDatePattern)
    .refine(isCalendarDate, "Date of birth must be a real calendar date")
    .optional(),
  emails: z.array(z.string().trim().email()).min(1),
  phones: z.array(z.string().trim().min(7)).min(1),
  addresses: z.array(AddressSchema).min(1),
});

const SelfRequesterSchema = z.object({
  capacity: z.literal("self"),
});

const RepresentativeRequesterSchema = z.object({
  capacity: z.enum(["authorized-agent", "guardian"]),
  name: PersonNameSchema,
  email: z.string().trim().email(),
  tradeName: z.string().trim().min(1).optional(),
  authorizationReference: z.string().trim().min(1),
});

export const RequesterSchema = z.discriminatedUnion("capacity", [
  SelfRequesterSchema,
  RepresentativeRequesterSchema,
]);

export const DataBreakerProfileSchema = z.object({
  schemaVersion: z.literal(1),
  subject: SubjectSchema,
  requester: RequesterSchema,
});

export type PersonName = z.infer<typeof PersonNameSchema>;
export type Address = z.infer<typeof AddressSchema>;
export type DataBreakerProfile = z.infer<typeof DataBreakerProfileSchema>;
export type Requester = z.infer<typeof RequesterSchema>;

type Environment = NodeJS.ProcessEnv | Record<string, string | undefined>;

function required(environment: Environment, key: string): string {
  const value = environment[key]?.trim();
  if (!value) {
    throw new Error("Missing required environment variable: " + key);
  }

  return value;
}

function optional(environment: Environment, key: string): string | undefined {
  const value = environment[key]?.trim();
  return value ? value : undefined;
}

function parseJson<T>(environment: Environment, key: string, fallback?: T): T {
  const value = optional(environment, key);
  if (value === undefined && fallback !== undefined) {
    return fallback;
  }
  if (value === undefined) {
    throw new Error("Missing required environment variable: " + key);
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    throw new Error(key + " must contain valid JSON");
  }
}

function nameFromEnvironment(
  environment: Environment,
  prefix: string,
): PersonName {
  const candidate = {
    first: required(environment, prefix + "_FIRST_NAME"),
    middle: optional(environment, prefix + "_MIDDLE_NAME"),
    last: required(environment, prefix + "_LAST_NAME"),
    suffix: optional(environment, prefix + "_SUFFIX"),
  };

  return PersonNameSchema.parse(candidate);
}

function requesterFromEnvironment(environment: Environment): Requester {
  const capacity = optional(environment, "DATA_BREAKER_REQUESTER_CAPACITY") ?? "self";
  if (capacity === "self") {
    return { capacity };
  }
  if (capacity !== "authorized-agent" && capacity !== "guardian") {
    throw new Error(
      "DATA_BREAKER_REQUESTER_CAPACITY must be self, authorized-agent, or guardian",
    );
  }

  return RequesterSchema.parse({
    capacity,
    name: nameFromEnvironment(environment, "DATA_BREAKER_REQUESTER"),
    email: required(environment, "DATA_BREAKER_REQUESTER_EMAIL"),
    tradeName: optional(environment, "DATA_BREAKER_REQUESTER_TRADE_NAME"),
    authorizationReference: required(
      environment,
      "DATA_BREAKER_REQUESTER_AUTHORIZATION_REFERENCE",
    ),
  });
}

export function loadProfileFromEnvironment(
  environment: Environment = process.env,
): DataBreakerProfile {
  const candidate = {
    schemaVersion: 1,
    subject: {
      id: required(environment, "DATA_BREAKER_SUBJECT_ID"),
      jurisdiction: required(environment, "DATA_BREAKER_JURISDICTION"),
      name: nameFromEnvironment(environment, "DATA_BREAKER_SUBJECT"),
      aliases: parseJson(environment, "DATA_BREAKER_SUBJECT_ALIASES", []),
      dateOfBirth: optional(
        environment,
        "DATA_BREAKER_SUBJECT_DATE_OF_BIRTH",
      ),
      emails: parseJson(environment, "DATA_BREAKER_SUBJECT_EMAILS"),
      phones: parseJson(environment, "DATA_BREAKER_SUBJECT_PHONES"),
      addresses: parseJson(environment, "DATA_BREAKER_SUBJECT_ADDRESSES"),
    },
    requester: requesterFromEnvironment(environment),
  };

  return DataBreakerProfileSchema.parse(candidate);
}
