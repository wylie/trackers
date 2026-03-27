export function simpleHash(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

export function createLegacyId(entry) {
  const clone = { ...(entry || {}) };
  delete clone.id;
  delete clone.updatedAt;
  const basis = JSON.stringify(clone);
  return `legacy_${simpleHash(basis || String(Date.now()))}`;
}

export function createEntryId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const randomPart = Math.random().toString(16).slice(2);
  return `entry_${Date.now()}_${randomPart}`;
}

export function ensureEntryIdentity(entry) {
  if (!entry || typeof entry !== "object") return entry;
  if (entry.id) return entry;
  return {
    ...entry,
    id: createLegacyId(entry)
  };
}
