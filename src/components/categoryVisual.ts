import type { CatalogueCategory } from "@/lib/types";

export function categoryLabel(category: CatalogueCategory): string {
  switch (category) {
    case "visual_arts":
      return "Visual arts";
    case "performance":
      return "Performance";
    case "music":
      return "Music";
    case "film":
      return "Film";
    case "literary":
      return "Literary";
    case "craft":
      return "Craft";
    case "experience":
      return "Experience";
    default:
      return category;
  }
}

/** Decorative gradients only — not photographs of venues or artists. */
export function categoryArtClass(category: CatalogueCategory): string {
  switch (category) {
    case "music":
      return "from-[#1D2939] via-[#4B62C1] to-[#C7CEEB]";
    case "film":
      return "from-[#161A2A] via-[#3a2f55] to-[#C7CEEB]";
    case "visual_arts":
      return "from-[#101828] via-[#4B62C1]/80 to-[#FDF5EB]";
    case "performance":
      return "from-[#161A2A] via-[#2a4068] to-[#F0F2FA]";
    case "experience":
      return "from-[#1D2939] via-[#5a6fb0] to-[#FDF5EB]";
    default:
      return "from-bragi-navy via-bragi-accent to-bragi-mist";
  }
}
