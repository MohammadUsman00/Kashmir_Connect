import createDOMPurify from "isomorphic-dompurify";
import { z } from "zod";

const domPurify = createDOMPurify;

const disposableDomains = new Set([
  "mailinator.com",
  "10minutemail.com",
  "tempmail.com",
  "guerrillamail.com",
  "trashmail.com"
]);

const slugRegex = /^[a-z0-9-]+$/;
const indianPhoneRegex = /^(?:\+91[\s-]?)?[6-9]\d{9}$/;

function sanitizeString(value: string): string {
  return domPurify.sanitize(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim();
}

function validateByKey(key: string, value: string): string {
  const normalizedKey = key.toLowerCase();
  if (normalizedKey.includes("slug") && !slugRegex.test(value)) {
    throw new Error(`Invalid slug for ${key}`);
  }
  if (normalizedKey.includes("phone") && !indianPhoneRegex.test(value)) {
    throw new Error(`Invalid Indian phone number for ${key}`);
  }
  if (normalizedKey.includes("email")) {
    const email = z.string().email().parse(value.toLowerCase());
    const domain = email.split("@")[1] || "";
    if (disposableDomains.has(domain)) {
      throw new Error("Disposable email domains are not allowed");
    }
    return email;
  }
  return value;
}

export function sanitizeUnknownInput(input: unknown, path = ""): unknown {
  if (typeof input === "string") {
    return sanitizeString(input);
  }
  if (Array.isArray(input)) {
    return input.map((item, index) => sanitizeUnknownInput(item, `${path}[${index}]`));
  }
  if (input && typeof input === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      const childPath = path ? `${path}.${key}` : key;
      const sanitized = sanitizeUnknownInput(value, childPath);
      if (typeof sanitized === "string") {
        out[key] = validateByKey(key, sanitized);
      } else {
        out[key] = sanitized;
      }
    }
    return out;
  }
  return input;
}

export function isValidSlug(slug: string): boolean {
  return slugRegex.test(slug);
}

export function isValidIndianPhone(phone: string): boolean {
  return indianPhoneRegex.test(phone);
}
