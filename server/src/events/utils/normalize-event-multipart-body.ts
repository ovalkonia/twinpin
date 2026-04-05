export function normalizeEventMultipartBody(
  body: Record<string, unknown>,
): Record<string, unknown> {
  const tagsRaw = body['tags[]'] ?? body['tags'];
  let tags: string[] | undefined;
  if (tagsRaw != null) {
    tags = Array.isArray(tagsRaw)
      ? (tagsRaw as string[]).map(String)
      : [String(tagsRaw)];
  }
  const { ['tags[]']: _t, ...rest } = body as Record<string, unknown> & {
    'tags[]'?: unknown;
  };

  let tickets: unknown = rest.tickets;
  if (typeof tickets === 'string') {
    try {
      tickets = JSON.parse(tickets) as unknown;
    } catch {
    }
  }

  const BOOL_FIELDS = ['notifyOnNewVisitor'] as const;
  const boolOverrides: Record<string, boolean> = {};
  for (const field of BOOL_FIELDS) {
    const raw = rest[field];
    if (raw === 'true' || raw === true) boolOverrides[field] = true;
    else if (raw === 'false' || raw === false) boolOverrides[field] = false;
  }

  return {
    ...rest,
    ...(tags !== undefined ? { tags } : {}),
    ...(tickets !== undefined ? { tickets } : {}),
    ...boolOverrides,
  };
}
