import type { AdapterManifest } from "../adapters/schema.js";

function domainMatches(hostname: string, declaredDomain: string): boolean {
  return hostname === declaredDomain || hostname.endsWith("." + declaredDomain);
}

export function isAllowedNetworkUrl(
  rawUrl: string,
  manifest: AdapterManifest,
): boolean {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return false;
  }

  if (
    url.protocol === "about:" ||
    url.protocol === "blob:" ||
    url.protocol === "data:"
  ) {
    return true;
  }
  if (url.protocol !== "https:" && !(manifest.fixture && url.protocol === "http:")) {
    return false;
  }

  return [...manifest.allowedDomains, ...manifest.resourceDomains].some((domain) =>
    domainMatches(url.hostname, domain),
  );
}
