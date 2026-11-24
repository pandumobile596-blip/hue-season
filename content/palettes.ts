/**
 * Palette data for the 12 seasons. Shared by the home page grid, result page,
 * live draping, share cards, and the SEO season pages.
 *
 * Every color has a human-readable name so swatches never rely on color alone.
 * Celebrity examples are commonly cited opinions — always shown as
 * "often associated with", never as fact, and names only (no photos).
 */

export type SeasonFamily = "spring" | "summer" | "autumn" | "winter";

export type SeasonSlug =
  | "light-spring"
  | "true-spring"
  | "bright-spring"
  | "light-summer"
  | "true-summer"
  | "soft-summer"
  | "soft-autumn"
  | "true-autumn"
  | "deep-autumn"
  | "deep-winter"
  | "true-winter"
  | "bright-winter";

export interface NamedColor {
  name: string;
  hex: `#${string}`;
}

export interface SeasonPalette {
  slug: SeasonSlug;
  name: string;
  family: SeasonFamily;
  /** One-line summary used on cards. */
  summary: string;
  /** 12 signature colors. */
  palette: NamedColor[];
  /** 4 best neutrals (wardrobe basics). */
  neutrals: NamedColor[];
  /** 4 colors that tend to wash this season out. */
  avoid: NamedColor[];
  /** Commonly cited examples (opinion). */
  celebrities: [string, string, string];
}

const c = (name: string, hex: `#${string}`): NamedColor => ({ name, hex });

export const seasonPalettes: SeasonPalette[] = [
  // ── SPRING: warm undertone, clear colors ─────────────────────────────
  {
    slug: "light-spring",
    name: "Light Spring",
    family: "spring",
    summary: "Light, warm and fresh — like a sunny morning in April.",
    palette: [
      c("Buttercream", "#F6E3A1"),
      c("Peach", "#F8B595"),
      c("Coral Pink", "#F28A80"),
      c("Warm Pink", "#F5A3B5"),
      c("Apricot", "#F6A96B"),
      c("Golden Yellow", "#F4CF5C"),
      c("Spring Green", "#9ED67C"),
      c("Mint", "#A8E0B8"),
      c("Light Aqua", "#8FD8D2"),
      c("Light Turquoise", "#5FC7C4"),
      c("Periwinkle", "#A3B4E8"),
      c("Clear Lavender", "#C3AEE6"),
    ],
    neutrals: [
      c("Ivory", "#FBF3E2"),
      c("Light Camel", "#D3A672"),
      c("Warm Stone", "#CFC5B8"),
      c("Soft Navy", "#4D6A9E"),
    ],
    avoid: [
      c("Black", "#141414"),
      c("Burgundy", "#6E1F33"),
      c("Charcoal", "#3B3B3F"),
      c("Dusty Mauve", "#9C7A88"),
    ],
    celebrities: ["Blake Lively", "Amanda Seyfried", "Cameron Diaz"],
  },
  {
    slug: "true-spring",
    name: "True Spring",
    family: "spring",
    summary: "Warm, golden and vibrant — sunshine in color form.",
    palette: [
      c("Tangerine", "#F58A2E"),
      c("Daffodil", "#F9D53D"),
      c("Golden Honey", "#E3A33A"),
      c("Bright Coral", "#F26B5B"),
      c("Poppy", "#E5452F"),
      c("Salmon", "#F7957C"),
      c("Apple Green", "#8CCB45"),
      c("Leaf Green", "#6BBF4A"),
      c("Turquoise", "#1FB5AC"),
      c("Clear Aqua", "#52CBD6"),
      c("Warm Periwinkle", "#7A8FE0"),
      c("Warm Violet", "#8A6FD1"),
    ],
    neutrals: [
      c("Cream", "#F7EBD3"),
      c("Camel", "#C9955A"),
      c("Golden Brown", "#8A5A2B"),
      c("Warm Navy", "#2D4A7A"),
    ],
    avoid: [
      c("Black", "#141414"),
      c("Icy Gray", "#D9DEE3"),
      c("Dusty Rose", "#B88A94"),
      c("Burgundy", "#5E1A2A"),
    ],
    celebrities: ["Amy Adams", "Emma Stone", "Isla Fisher"],
  },
  {
    slug: "bright-spring",
    name: "Bright Spring",
    family: "spring",
    summary: "Clear, bright and warm-leaning — bold color loves you.",
    palette: [
      c("Hot Coral", "#FF5A4E"),
      c("Watermelon", "#F2405C"),
      c("Hot Pink", "#F2378A"),
      c("Bright Orange", "#FF7A1A"),
      c("Clear Yellow", "#FFE03A"),
      c("Lime", "#A7D930"),
      c("Emerald", "#00A86B"),
      c("Bright Turquoise", "#00C1C1"),
      c("Clear Aqua", "#3ED6E0"),
      c("Electric Blue", "#1F6FE5"),
      c("Royal Blue", "#2848C8"),
      c("Violet", "#7B4FE0"),
    ],
    neutrals: [
      c("Soft White", "#FFFDF7"),
      c("Light Camel", "#D7B48A"),
      c("Warm Charcoal", "#3A3532"),
      c("Navy", "#1E2E5C"),
    ],
    avoid: [
      c("Dusty Mauve", "#A68A92"),
      c("Muted Olive", "#7D7A55"),
      c("Taupe", "#BDB2A4"),
      c("Brown Gray", "#7A6E64"),
    ],
    celebrities: ["Emma Watson", "Margot Robbie", "Kerry Washington"],
  },

  // ── SUMMER: cool undertone, soft colors ──────────────────────────────
  {
    slug: "light-summer",
    name: "Light Summer",
    family: "summer",
    summary: "Light, cool and airy — think sea glass and sweet peas.",
    palette: [
      c("Powder Blue", "#A9C9E8"),
      c("Sky Blue", "#8DBCE3"),
      c("Light Periwinkle", "#A7B3E6"),
      c("Lavender", "#C2B4E2"),
      c("Lilac", "#B9A2D6"),
      c("Soft Pink", "#F1B6C6"),
      c("Light Rose", "#E8A3B5"),
      c("Rose Pink", "#E58FA8"),
      c("Seafoam", "#A6D9CC"),
      c("Mint", "#B4E1CB"),
      c("Soft Aqua", "#9DD3D8"),
      c("Lemon Ice", "#F3EBA8"),
    ],
    neutrals: [
      c("Soft White", "#F6F5F2"),
      c("Light Gray", "#CACDD2"),
      c("Gray Blue", "#8D9DB0"),
      c("Soft Navy", "#4A5A7A"),
    ],
    avoid: [
      c("Black", "#141414"),
      c("Orange", "#F07C1C"),
      c("Mustard", "#C9A227"),
      c("Rust", "#A24A21"),
    ],
    celebrities: ["Elle Fanning", "Cate Blanchett", "Gwyneth Paltrow"],
  },
  {
    slug: "true-summer",
    name: "True Summer",
    family: "summer",
    summary: "Cool, calm and elegant — rose, berry and soft blues.",
    palette: [
      c("Rose Pink", "#D16D8D"),
      c("Cool Watermelon", "#E06A85"),
      c("Raspberry", "#B8416A"),
      c("Soft Fuchsia", "#C85FA0"),
      c("Plum", "#7A4C78"),
      c("Lavender", "#A895CF"),
      c("Periwinkle", "#8B95D6"),
      c("Cornflower Blue", "#6A8FD8"),
      c("Sky Blue", "#7EAEDC"),
      c("Soft Teal", "#4E9A9E"),
      c("Blue Spruce", "#3E7D82"),
      c("Spruce Green", "#4F8A72"),
    ],
    neutrals: [
      c("Soft White", "#F4F3F1"),
      c("Rose Beige", "#C9AFA8"),
      c("Blue Gray", "#7A8899"),
      c("Navy", "#2F3E5E"),
    ],
    avoid: [
      c("Orange", "#F07C1C"),
      c("Golden Yellow", "#EBB41E"),
      c("Rust", "#A24A21"),
      c("Olive", "#6F6B2E"),
    ],
    celebrities: ["Emily Blunt", "Kristen Stewart", "Taylor Schilling"],
  },
  {
    slug: "soft-summer",
    name: "Soft Summer",
    family: "summer",
    summary: "Muted, cool and gentle — smoky, dusty and quietly chic.",
    palette: [
      c("Powder Pink", "#D9B3B8"),
      c("Dusty Rose", "#C29199"),
      c("Rosewood", "#A66E7A"),
      c("Mauve", "#A57D8C"),
      c("Soft Plum", "#8A6C86"),
      c("Muted Lavender", "#A39DBA"),
      c("Soft Denim", "#7790B0"),
      c("Slate Blue", "#6F82A0"),
      c("Dusty Aqua", "#87ABAD"),
      c("Smoky Teal", "#5C8B8B"),
      c("Sage", "#9AAE9B"),
      c("Gray Green", "#7F9483"),
    ],
    neutrals: [
      c("Oyster", "#E5E0D8"),
      c("Taupe", "#A79E95"),
      c("Soft Charcoal", "#545559"),
      c("Gray Navy", "#3D4A60"),
    ],
    avoid: [
      c("Black", "#141414"),
      c("Bright Orange", "#FF7A1A"),
      c("Lemon Yellow", "#F6E02A"),
      c("Neon Pink", "#FF3D9A"),
    ],
    celebrities: ["Jennifer Aniston", "Sarah Jessica Parker", "Gigi Hadid"],
  },

  // ── AUTUMN: warm undertone, rich/earthy colors ───────────────────────
  {
    slug: "soft-autumn",
    name: "Soft Autumn",
    family: "autumn",
    summary: "Warm, muted and earthy — sage, camel and terracotta.",
    palette: [
      c("Salmon Beige", "#D9A48C"),
      c("Dusty Coral", "#D08C78"),
      c("Warm Rose", "#B97A76"),
      c("Terracotta", "#B9735A"),
      c("Camel", "#BF9468"),
      c("Soft Gold", "#CDAE6B"),
      c("Khaki", "#A99A6E"),
      c("Warm Sage", "#A3A882"),
      c("Moss", "#7A7B4F"),
      c("Pine", "#4F6B5C"),
      c("Muted Teal", "#5F8C86"),
      c("Muted Aqua", "#86A8A0"),
    ],
    neutrals: [
      c("Oatmeal", "#E3D6C2"),
      c("Mushroom", "#A39380"),
      c("Coffee", "#6B5444"),
      c("Olive Brown", "#5E5A3E"),
    ],
    avoid: [
      c("Black", "#141414"),
      c("Icy Blue", "#CFE5F7"),
      c("Neon Pink", "#FF3D9A"),
      c("Electric Blue", "#1F6FE5"),
    ],
    celebrities: ["Gisele Bündchen", "Drew Barrymore", "Beyoncé"],
  },
  {
    slug: "true-autumn",
    name: "True Autumn",
    family: "autumn",
    summary: "Warm, rich and golden — the colors of a forest in October.",
    palette: [
      c("Burnt Coral", "#D06A4C"),
      c("Tomato Red", "#C9432C"),
      c("Brick Red", "#9E3B2A"),
      c("Rust", "#B4512B"),
      c("Pumpkin", "#D9762A"),
      c("Golden Ochre", "#C9952E"),
      c("Mustard", "#D1A225"),
      c("Moss", "#7A8A3A"),
      c("Olive", "#6E6B2A"),
      c("Forest Green", "#3E5E36"),
      c("Deep Teal", "#2F7072"),
      c("Chocolate", "#5A3621"),
    ],
    neutrals: [
      c("Cream", "#F1E6CF"),
      c("Camel", "#B98A55"),
      c("Chocolate Brown", "#4F3322"),
      c("Olive Khaki", "#7C7448"),
    ],
    avoid: [
      c("Icy Pink", "#F4D7E3"),
      c("Fuchsia", "#D1268F"),
      c("Cool Gray", "#9AA0A8"),
      c("Black", "#141414"),
    ],
    celebrities: ["Julia Roberts", "Jessica Chastain", "Julianne Moore"],
  },
  {
    slug: "deep-autumn",
    name: "Deep Autumn",
    family: "autumn",
    summary: "Deep, warm and rich — spice, bronze and dark forest tones.",
    palette: [
      c("Deep Coral", "#C25A3F"),
      c("Paprika", "#B5422A"),
      c("Rust", "#A1441F"),
      c("Mahogany", "#6B2E22"),
      c("Warm Burgundy", "#7A2632"),
      c("Aubergine", "#4E2A3E"),
      c("Golden Mustard", "#C3911F"),
      c("Bronze", "#8E6A2E"),
      c("Deep Olive", "#555227"),
      c("Forest", "#2F4A2E"),
      c("Deep Teal", "#1F5C5E"),
      c("Petrol Blue", "#1F4A5A"),
    ],
    neutrals: [
      c("Espresso", "#3A261C"),
      c("Dark Chocolate", "#4A2E20"),
      c("Warm Charcoal", "#3C3734"),
      c("Camel", "#B08455"),
    ],
    avoid: [
      c("Pastel Pink", "#F6C9D6"),
      c("Icy Lavender", "#DCD6F0"),
      c("Powder Blue", "#B9D4EC"),
      c("Silver Gray", "#BFC3C8"),
    ],
    celebrities: ["Eva Mendes", "Jennifer Lopez", "Rihanna"],
  },

  // ── WINTER: cool undertone, clear/high-contrast colors ──────────────
  {
    slug: "deep-winter",
    name: "Deep Winter",
    family: "winter",
    summary: "Deep, cool and dramatic — jewel tones and true black.",
    palette: [
      c("True Red", "#C8102E"),
      c("Cranberry", "#9B1B3B"),
      c("Burgundy", "#6D1530"),
      c("Fuchsia", "#C3157A"),
      c("Blackberry", "#3B1E3A"),
      c("Royal Purple", "#5A2A8C"),
      c("Sapphire", "#1F3F9A"),
      c("Deep Teal", "#00575E"),
      c("Emerald", "#00704A"),
      c("Pine", "#0F4D3C"),
      c("Icy Pink", "#F3D3E0"),
      c("Icy Blue", "#D6E8F5"),
    ],
    neutrals: [
      c("Black", "#141414"),
      c("Charcoal", "#333438"),
      c("Optic White", "#FAFAFA"),
      c("Midnight Navy", "#18213F"),
    ],
    avoid: [
      c("Orange", "#F07C1C"),
      c("Camel", "#C19A62"),
      c("Peach", "#F8B595"),
      c("Mustard", "#C9A227"),
    ],
    celebrities: ["Lucy Liu", "Selena Gomez", "Kim Kardashian"],
  },
  {
    slug: "true-winter",
    name: "True Winter",
    family: "winter",
    summary: "Cool, crisp and striking — pure, icy and vivid colors.",
    palette: [
      c("Cool Red", "#D0103A"),
      c("Cherry", "#A8102E"),
      c("Magenta", "#C2187F"),
      c("Hot Pink", "#E6338A"),
      c("Royal Purple", "#6A2FA0"),
      c("Royal Blue", "#2346C0"),
      c("Cobalt", "#0047AB"),
      c("Pine Green", "#01796F"),
      c("Emerald", "#009060"),
      c("Icy Lilac", "#DCD3F0"),
      c("Icy Aqua", "#CFEFF0"),
      c("Icy Lemon", "#F2F0A8"),
    ],
    neutrals: [
      c("Snow White", "#FCFCFC"),
      c("Black", "#141414"),
      c("Charcoal", "#36383C"),
      c("Navy", "#1A2550"),
    ],
    avoid: [
      c("Orange", "#F07C1C"),
      c("Mustard", "#C9A227"),
      c("Rust", "#A24A21"),
      c("Camel", "#C19A62"),
    ],
    celebrities: ["Anne Hathaway", "Lupita Nyong'o", "Courteney Cox"],
  },
  {
    slug: "bright-winter",
    name: "Bright Winter",
    family: "winter",
    summary: "Bright, cool and electric — high-impact color is your thing.",
    palette: [
      c("Bright Red", "#E3122B"),
      c("Cherry Red", "#C8102E"),
      c("Hot Pink", "#F21F8C"),
      c("Violet", "#7A2BD6"),
      c("Royal Blue", "#2446D1"),
      c("Electric Blue", "#0066FF"),
      c("Turquoise", "#00B3B8"),
      c("Bright Teal", "#00898A"),
      c("Emerald", "#009B6E"),
      c("Lemon Yellow", "#F5E52C"),
      c("Icy Mint", "#D2F5E6"),
      c("Icy Pink", "#F7D6E6"),
    ],
    neutrals: [
      c("Black", "#141414"),
      c("Bright White", "#FFFFFF"),
      c("Charcoal", "#2F3033"),
      c("Navy", "#17224D"),
    ],
    avoid: [
      c("Dusty Rose", "#B88A94"),
      c("Olive", "#6F6B2E"),
      c("Camel", "#C19A62"),
      c("Mushroom", "#A39380"),
    ],
    celebrities: ["Megan Fox", "Zooey Deschanel", "Katy Perry"],
  },
];

export const familyLabels: Record<SeasonFamily, { name: string; blurb: string }> = {
  spring: { name: "Spring", blurb: "Warm & clear" },
  summer: { name: "Summer", blurb: "Cool & soft" },
  autumn: { name: "Autumn", blurb: "Warm & rich" },
  winter: { name: "Winter", blurb: "Cool & vivid" },
};

export function getSeasonPalette(slug: string): SeasonPalette | undefined {
  return seasonPalettes.find((s) => s.slug === slug);
}
