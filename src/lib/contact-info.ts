export const CONTACT_INFO_SEPARATOR = " | ";

export function formatContactInfo(phone: string, email: string): string {
  const parts = [phone.trim(), email.trim()].filter(Boolean);
  return parts.join(CONTACT_INFO_SEPARATOR);
}

export function parseContactInfo(raw: string | null | undefined): {
  phone: string;
  email: string;
} {
  const value = raw?.trim() ?? "";
  if (!value) return { phone: "", email: "" };

  if (value.includes(CONTACT_INFO_SEPARATOR)) {
    const [phone = "", email = ""] = value.split(CONTACT_INFO_SEPARATOR).map((part) => part.trim());
    return { phone, email };
  }

  if (value.includes("@")) {
    return { phone: "", email: value };
  }

  return { phone: value, email: "" };
}
