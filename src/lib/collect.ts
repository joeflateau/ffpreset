import { parse as parseQs } from "qs";

export function collect(value: string, previous: Record<string, string>) {
  const parsed = parseQs(value);
  return { ...previous, ...parsed };
}
