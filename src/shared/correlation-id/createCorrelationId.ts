export type CorrelationId = string & { readonly __brand: "CorrelationId" };

export function createCorrelationId(): CorrelationId {
  const randomPart = Math.random().toString(36).slice(2, 10);
  const timePart = Date.now().toString(36);
  return `corr_${timePart}_${randomPart}` as CorrelationId;
}

export function isCorrelationId(value: string): value is CorrelationId {
  return value.startsWith("corr_");
}
