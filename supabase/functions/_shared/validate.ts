// Shared input validation utilities for edge functions

const MAX_PAYLOAD_SIZE = 50 * 1024; // 50KB
const MAX_STRING_LENGTH = 10000;
const MAX_ARRAY_LENGTH = 100;
const MAX_SHORT_STRING = 500;

export function validatePayloadSize(body: string): boolean {
  return new TextEncoder().encode(body).length <= MAX_PAYLOAD_SIZE;
}

export function validateString(val: unknown, maxLen = MAX_STRING_LENGTH): val is string {
  return typeof val === "string" && val.length <= maxLen;
}

export function validateShortString(val: unknown): val is string {
  return typeof val === "string" && val.length <= MAX_SHORT_STRING;
}

export function validateArray(val: unknown, maxLen = MAX_ARRAY_LENGTH): val is unknown[] {
  return Array.isArray(val) && val.length <= maxLen;
}

export function validateNumber(val: unknown, min = 0, max = 10000): val is number {
  return typeof val === "number" && val >= min && val <= max;
}

export function validateEnum(val: unknown, allowed: string[]): boolean {
  return typeof val === "string" && allowed.includes(val);
}

export function badRequest(msg: string, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify({ error: msg }), {
    status: 400,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export async function parseAndValidateBody(req: Request, corsHeaders: Record<string, string>): Promise<{ data: any; error?: Response }> {
  const text = await req.text();
  if (!validatePayloadSize(text)) {
    return { data: null, error: badRequest("Payload too large (max 50KB)", corsHeaders) };
  }
  try {
    return { data: JSON.parse(text) };
  } catch {
    return { data: null, error: badRequest("Invalid JSON body", corsHeaders) };
  }
}
