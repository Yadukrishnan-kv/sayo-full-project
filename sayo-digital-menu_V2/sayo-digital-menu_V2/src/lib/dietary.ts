import type { MenuItemData } from "./customerAPI";

/**
 * Single source of truth for dietary (veg/non-veg/egg) and spice-level detection.
 * Previously DishItem and DishModal each computed these independently and could
 * disagree on the same dish; both should import from here instead.
 */

function normalizeToken(value?: string | null): string {
  return (value || "")
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "");
}

const VEGAN_ALIASES = ["vegan"];
const VEGETARIAN_ALIASES = ["vegetarian", "veg"];
const NON_VEGETARIAN_ALIASES = ["nonvegetarian", "nonveg", "nveg", "nv"];
const CONTAINS_EGG_ALIASES = ["containsegg", "egg", "eggs"];
const HOT_ALIASES = ["hot", "spicy"];
const EXTRA_HOT_ALIASES = ["extrahot", "veryhot", "superhot", "extraspicy"];

function getNormalizedTokens(item: MenuItemData): Set<string> {
  const tokens = new Set<string>();
  (item.tags ?? []).forEach((tag) => {
    const token = normalizeToken(tag);
    if (token) tokens.add(token);
  });
  (item.dietary_tags ?? []).forEach((tag) => {
    const token = normalizeToken(tag);
    if (token) tokens.add(token);
  });
  return tokens;
}

function hasAnyAlias(tokens: Set<string>, aliases: string[]): boolean {
  return aliases.some((alias) => tokens.has(alias));
}

const ALL_DIETARY_ALIASES = [
  ...VEGAN_ALIASES,
  ...VEGETARIAN_ALIASES,
  ...NON_VEGETARIAN_ALIASES,
  ...CONTAINS_EGG_ALIASES,
];

/** True if a raw (already-normalized) tag token represents a diet marker rather than an unrelated tag. */
export function isDietaryToken(normalizedTag: string): boolean {
  return ALL_DIETARY_ALIASES.includes(normalizedTag);
}

export interface DietaryInfo {
  isVegan: boolean;
  isVegetarian: boolean;
  isNonVegetarian: boolean;
  hasContainsEgg: boolean;
  /** True only when nothing — structured field, tags, or section name — indicates a diet status. */
  isUnknown: boolean;
}

export function getDietaryInfo(item: MenuItemData, sectionName?: string): DietaryInfo {
  const tokens = getNormalizedTokens(item);
  const isVegan = hasAnyAlias(tokens, VEGAN_ALIASES);
  const hasContainsEgg = hasAnyAlias(tokens, CONTAINS_EGG_ALIASES) || item.dietary_type === "egg";

  // Prefer the explicit field the admin set; only guess from free-text tags/section
  // for older dishes saved before this field existed.
  if (item.dietary_type === "vegetarian") {
    return { isVegan, isVegetarian: true, isNonVegetarian: false, hasContainsEgg, isUnknown: false };
  }
  if (item.dietary_type === "nonVegetarian") {
    return { isVegan: false, isVegetarian: false, isNonVegetarian: true, hasContainsEgg, isUnknown: false };
  }
  if (item.dietary_type === "egg") {
    return { isVegan: false, isVegetarian: false, isNonVegetarian: false, hasContainsEgg: true, isUnknown: false };
  }

  const normalizedSection = normalizeToken(sectionName ?? item.section_id);
  const isNonVegetarian =
    hasAnyAlias(tokens, NON_VEGETARIAN_ALIASES) || normalizedSection.includes("nonvegetarian");
  const isVegetarian =
    !isNonVegetarian &&
    (hasAnyAlias(tokens, VEGETARIAN_ALIASES) ||
      (normalizedSection.includes("vegetarian") && !normalizedSection.includes("nonvegetarian")));

  return {
    isVegan,
    isVegetarian,
    isNonVegetarian,
    hasContainsEgg,
    isUnknown: !isVegan && !isVegetarian && !isNonVegetarian && !hasContainsEgg,
  };
}

export type SpiceLevelKey = "mild" | "medium" | "hot";

export interface SpiceInfo {
  level: SpiceLevelKey | null;
  labelKey: "spiceLevelMild" | "spiceLevelHot" | "spiceLevelExtraHot" | null;
  iconCount: number;
}

/** Returns null level when no spice tag is present — we don't guess a default like "Mild". */
export function getSpiceInfo(item: MenuItemData): SpiceInfo {
  const tokens = getNormalizedTokens(item);

  if (hasAnyAlias(tokens, EXTRA_HOT_ALIASES)) {
    return { level: "hot", labelKey: "spiceLevelExtraHot", iconCount: 3 };
  }
  if (hasAnyAlias(tokens, HOT_ALIASES)) {
    return { level: "medium", labelKey: "spiceLevelHot", iconCount: 2 };
  }
  if (tokens.has("mild")) {
    return { level: "mild", labelKey: "spiceLevelMild", iconCount: 1 };
  }
  return { level: null, labelKey: null, iconCount: 0 };
}
