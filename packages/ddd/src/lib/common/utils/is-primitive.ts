export function isPrimitive(value: unknown): boolean {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value === null ||
    value === undefined ||
    typeof value === 'bigint' ||
    typeof value === 'symbol'
  );
}
