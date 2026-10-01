import type { ProductReviewIssueDTO } from './product.dto';

export type ProductImportCost = {
  effective_from?: Date | string | null;
  cogs_unit: number;
  notes?: string | null;
};

export type ProductImportVariantSnapshot = {
  variant_id?: string;
  name?: string;
  name_history?: string[];
  default_cost?: number;
  costs?: ProductImportCost[];
};

function normalizedName(name: string) {
  return name.trim().toLocaleLowerCase('id-ID');
}

export function appendPreviousName(
  history: readonly string[] | undefined,
  previousName: string | undefined,
  incomingName: string | undefined
) {
  const uniqueHistory: string[] = [];
  const seen = new Set<string>();

  for (const entry of history ?? []) {
    const cleanEntry = entry.trim();
    const normalizedEntry = normalizedName(cleanEntry);
    if (!cleanEntry || seen.has(normalizedEntry)) continue;
    seen.add(normalizedEntry);
    uniqueHistory.push(cleanEntry);
  }

  const previous = previousName?.trim() ?? '';
  const incoming = incomingName?.trim() ?? '';
  if (
    previous &&
    incoming &&
    normalizedName(previous) !== normalizedName(incoming) &&
    !seen.has(normalizedName(previous))
  ) {
    uniqueHistory.push(previous);
  }

  return uniqueHistory;
}

function asDate(value: unknown) {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value !== 'string' || !value.trim())
    return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function costFingerprint(cost: ProductImportCost) {
  const effectiveFrom = asDate(cost.effective_from);
  const notes = cost.notes?.trim() ?? '';

  return [
    effectiveFrom?.toISOString() ?? '',
    cost.cogs_unit,
    notes,
  ].join('|');
}

export function mergeUniqueCosts(
  variants: readonly ProductImportVariantSnapshot[]
) {
  const costs: ProductImportCost[] = [];
  const seen = new Set<string>();

  for (const variant of variants) {
    for (const cost of variant.costs ?? []) {
      const fingerprint = costFingerprint(cost);
      if (seen.has(fingerprint)) continue;
      seen.add(fingerprint);
      costs.push({
        ...cost,
        effective_from:
          asDate(cost.effective_from)?.toISOString() ??
          null,
      });
    }
  }

  return costs;
}

function latestCostForVariant(
  variant: ProductImportVariantSnapshot
) {
  return (
    (variant.costs ?? [])
      .map((cost) => ({
        cost,
        effectiveFrom: asDate(cost.effective_from),
      }))
      .filter(
        (
          entry
        ): entry is {
          cost: ProductImportCost;
          effectiveFrom: Date;
        } => entry.effectiveFrom !== null
      )
      .sort(
        (left, right) =>
          right.effectiveFrom.getTime() -
          left.effectiveFrom.getTime()
      )[0] ?? null
  );
}

export function resolveMergedDefaultCost(
  variants: readonly ProductImportVariantSnapshot[]
): {
  defaultCost?: number;
  reviewIssue?: ProductReviewIssueDTO;
} {
  const candidates = variants.filter(
    (variant) => typeof variant.default_cost === 'number'
  );
  const distinctValues = new Set(
    candidates.map((variant) => variant.default_cost)
  );

  const datedCandidates = variants.flatMap((variant) => {
    const latestCost = latestCostForVariant(variant);
    return latestCost
      ? [
          {
            variant,
            defaultCost: latestCost.cost.cogs_unit,
            effectiveFrom: latestCost.effectiveFrom,
          },
        ]
      : [];
  });

  if (datedCandidates.length === 0) {
    if (distinctValues.size === 0)
      return { defaultCost: 0 };
    if (distinctValues.size === 1) {
      return { defaultCost: candidates[0]?.default_cost };
    }

    return {
      defaultCost: 0,
      reviewIssue: createCostConflictIssue(variants),
    };
  }

  const latestTime = Math.max(
    ...datedCandidates.map(({ effectiveFrom }) =>
      effectiveFrom.getTime()
    )
  );
  const latestValues = new Set(
    datedCandidates
      .filter(
        ({ effectiveFrom }) =>
          effectiveFrom.getTime() === latestTime
      )
      .map(({ defaultCost }) => defaultCost)
  );
  const hasUndatedDefaultConflict = candidates.some(
    (variant) => {
      if (latestCostForVariant(variant)) return false;
      if (typeof variant.default_cost !== 'number')
        return false;
      return !latestValues.has(variant.default_cost);
    }
  );

  if (
    latestValues.size === 1 &&
    !hasUndatedDefaultConflict
  ) {
    return { defaultCost: [...latestValues][0] };
  }

  return {
    defaultCost: 0,
    reviewIssue: createCostConflictIssue(variants),
  };
}

/*
 * Conflicts from equal effective dates or uncomparable current values must
 * stay visible for a user to resolve on the product detail page.
 */
function createCostConflictIssue(
  variants: readonly ProductImportVariantSnapshot[]
): ProductReviewIssueDTO {
  return {
    code: 'variant_cost_conflict',
    candidates: variants.map((variant) => ({
      variant_id: variant.variant_id ?? '',
      name: variant.name ?? '',
      default_cost:
        latestCostForVariant(variant)?.cost.cogs_unit ??
        variant.default_cost ??
        null,
      effective_from:
        latestCostForVariant(
          variant
        )?.effectiveFrom.toISOString() ?? null,
    })),
  };
}
