import { z } from "zod";
import type { Address, DataBreakerProfile, PersonName } from "../config/profile.js";

export const SemanticFieldSchema = z.enum([
  "subject.id",
  "subject.jurisdiction",
  "subject.name.first",
  "subject.name.middle",
  "subject.name.last",
  "subject.name.suffix",
  "subject.name.full",
  "subject.dateOfBirth",
  "subject.primaryEmail",
  "subject.primaryPhone",
  "subject.currentAddress.line1",
  "subject.currentAddress.line2",
  "subject.currentAddress.city",
  "subject.currentAddress.region",
  "subject.currentAddress.postalCode",
  "subject.currentAddress.country",
  "requester.capacity",
  "requester.name.first",
  "requester.name.last",
  "requester.name.full",
  "requester.email",
  "requester.tradeName",
  "requester.authorizationReference",
]);

export type SemanticField = z.infer<typeof SemanticFieldSchema>;

function fullName(name: PersonName): string {
  return [name.first, name.middle, name.last, name.suffix]
    .filter((value): value is string => Boolean(value))
    .join(" ");
}

function currentAddress(profile: DataBreakerProfile): Address {
  const address =
    profile.subject.addresses.find((candidate) => candidate.kind === "current") ??
    profile.subject.addresses[0];
  if (!address) {
    throw new Error("The subject profile has no address");
  }
  return address;
}

function requiredField(
  field: SemanticField,
  value: string | undefined,
): string {
  if (!value) {
    throw new Error("Profile does not provide required semantic field: " + field);
  }
  return value;
}

export function resolveSemanticField(
  profile: DataBreakerProfile,
  field: SemanticField,
): string {
  const address = currentAddress(profile);

  switch (field) {
    case "subject.id":
      return profile.subject.id;
    case "subject.jurisdiction":
      return profile.subject.jurisdiction;
    case "subject.name.first":
      return profile.subject.name.first;
    case "subject.name.middle":
      return requiredField(field, profile.subject.name.middle);
    case "subject.name.last":
      return profile.subject.name.last;
    case "subject.name.suffix":
      return requiredField(field, profile.subject.name.suffix);
    case "subject.name.full":
      return fullName(profile.subject.name);
    case "subject.dateOfBirth":
      return requiredField(field, profile.subject.dateOfBirth);
    case "subject.primaryEmail":
      return requiredField(field, profile.subject.emails[0]);
    case "subject.primaryPhone":
      return requiredField(field, profile.subject.phones[0]);
    case "subject.currentAddress.line1":
      return address.line1;
    case "subject.currentAddress.line2":
      return requiredField(field, address.line2);
    case "subject.currentAddress.city":
      return address.city;
    case "subject.currentAddress.region":
      return address.region;
    case "subject.currentAddress.postalCode":
      return address.postalCode;
    case "subject.currentAddress.country":
      return address.country;
    case "requester.capacity":
      return profile.requester.capacity;
    case "requester.name.first":
      return profile.requester.capacity === "self"
        ? profile.subject.name.first
        : profile.requester.name.first;
    case "requester.name.last":
      return profile.requester.capacity === "self"
        ? profile.subject.name.last
        : profile.requester.name.last;
    case "requester.name.full":
      return profile.requester.capacity === "self"
        ? fullName(profile.subject.name)
        : fullName(profile.requester.name);
    case "requester.email":
      return profile.requester.capacity === "self"
        ? requiredField(field, profile.subject.emails[0])
        : profile.requester.email;
    case "requester.tradeName":
      return profile.requester.capacity === "self"
        ? requiredField(field, undefined)
        : requiredField(field, profile.requester.tradeName);
    case "requester.authorizationReference":
      return profile.requester.capacity === "self"
        ? requiredField(field, undefined)
        : profile.requester.authorizationReference;
  }
}
