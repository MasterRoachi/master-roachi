// The contract between this Worker and the CRM's `Leads` entrypoint, for the
// contact form on /hire (his ruling, 2026-11-10). Written on the CRM's
// side and copied here unchanged; it carries no data, only shapes.

export const ENQUIRY_CONSENT_VERSIONS = ["web-v1"] as const;
export const ENQUIRY_LIMITS = { name: 100, business: 120, email: 254, phone: 40, website: 300, message: 2000, source: 120 } as const;

export interface Enquiry {
  enquiryId: string;          // lowercase UUID, one per submission; a retry sends the same
  name: string;
  email: string;
  phone?: string;             // SA number, the CRM normalises
  business: string;
  website?: string;           // http(s)
  message: string;
  consent: { version: (typeof ENQUIRY_CONSENT_VERSIONS)[number]; given: boolean; at: string };  // at: ISO
  source: string;             // "masterroachi.com/contact"
}
export type EnquiryResult = { ok: true } | { ok: false; retry: boolean; error: string };
export interface LeadsRpc { createEnquiry(enquiry: Enquiry): Promise<EnquiryResult>; }
