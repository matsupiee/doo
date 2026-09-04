import type { AppRouter } from "@doo/api/routers/index";
import type { inferRouterInputs } from "@trpc/server";

/**
 * Derived from the router input so adding a category to the DB enum without
 * giving it a label here is a type error.
 */
export type MissionCategory = NonNullable<
  inferRouterInputs<AppRouter>["mission"]["create"]["categories"]
>[number];

/** Display order and labels for the fixed category list. */
export const MISSION_CATEGORIES: { value: MissionCategory; label: string }[] = [
  { value: "cooking", label: "料理" },
  { value: "sports", label: "運動" },
  { value: "outing", label: "おでかけ" },
  { value: "learning", label: "学び" },
  { value: "creative", label: "つくる" },
  { value: "fun", label: "ネタ" },
  { value: "life", label: "暮らし" },
  { value: "other", label: "その他" },
];

const byValue = new Map(MISSION_CATEGORIES.map((item) => [item.value, item]));

/** Every category value must have a label above. */
const _exhaustive: Record<MissionCategory, true> = {
  cooking: true,
  sports: true,
  outing: true,
  learning: true,
  creative: true,
  fun: true,
  life: true,
  other: true,
};
void _exhaustive;

export function categoryLabel(value: string) {
  return byValue.get(value as MissionCategory)?.label ?? value;
}
