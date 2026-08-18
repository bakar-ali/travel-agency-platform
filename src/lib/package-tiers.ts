export type PackageLevel = "standard" | "deluxe";

interface PricingTierLike {
  tourType: string;
  label: string;
  price: number;
}

export function findPackageTier(
  tiers: PricingTierLike[],
  tourType: string,
  packageLevel: PackageLevel
): PricingTierLike | null {
  const matching = tiers.filter((t) => t.tourType === tourType);
  if (matching.length === 0) return tiers[0] ?? null;

  const keyword = packageLevel === "standard" ? "standard" : "deluxe";
  const byLabel = matching.find((t) => t.label.toLowerCase().includes(keyword));
  if (byLabel) return byLabel;

  const sorted = [...matching].sort((a, b) => a.price - b.price);
  return packageLevel === "standard" ? sorted[0] : (sorted[1] ?? sorted[0]);
}

export function formatPackageLabel(packageLevel: PackageLevel): string {
  return packageLevel === "standard" ? "Standard" : "Deluxe";
}
