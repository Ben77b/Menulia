const SCHEMA_SETTLE_MS = 400;

export class RestaurantsSchemaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RestaurantsSchemaError";
  }
}

export async function ensureRestaurantsSchemaReady(): Promise<void> {
  const response = await fetch("/api/db/ensure-restaurants-schema", {
    method: "POST",
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    let message = "Database schema could not be initialized.";

    try {
      const body = (await response.json()) as { error?: string; details?: string };
      message = body.details ? `${body.error ?? message} (${body.details})` : body.error ?? message;
    } catch {
      // Response body was not JSON.
    }

    throw new RestaurantsSchemaError(message);
  }

  await new Promise((resolve) => setTimeout(resolve, SCHEMA_SETTLE_MS));
}
