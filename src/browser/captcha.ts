import type { Page } from "playwright";

const captchaUrlPattern =
  /(recaptcha|hcaptcha|challenges\.cloudflare\.com|turnstile)/i;

export async function detectCaptcha(page: Page): Promise<boolean> {
  if (page.frames().some((frame) => captchaUrlPattern.test(frame.url()))) {
    return true;
  }

  const selectors = [
    "iframe[src*='recaptcha']",
    "iframe[src*='hcaptcha']",
    "iframe[src*='challenges.cloudflare.com']",
    "[data-sitekey]",
    ".cf-turnstile",
    ".g-recaptcha",
    ".h-captcha",
  ];

  for (const selector of selectors) {
    if ((await page.locator(selector).count()) > 0) {
      return true;
    }
  }

  return false;
}
