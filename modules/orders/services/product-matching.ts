import Fuse from 'fuse.js';

export type ProductMatchStatus =
  | 'matched'
  | 'unresolved'
  | 'ambiguous';

export type CogsStatus = 'resolved' | 'unresolved';

type ProductLike = {
  _id?: unknown;
  product_id?: string;
  parent_sku?: string | null;
  name?: string;
  name_history?: string[];
  variants?: VariantLike[];
};

type VariantLike = {
  variant_id?: string;
  name?: string;
  name_history?: string[];
  child_sku?: string | null;
  sku?: string | null;
  default_cost?: number;
  costs?: CostLike[];
};

type CostLike = {
  effective_from?: string | Date | null;
  cogs_unit?: number;
};

export type ProductMatchInput = {
  productId?: unknown;
  productName?: unknown;
  variationName?: unknown;
  parentSku?: unknown;
  childSku?: unknown;
};

export type ProductMatchResult = {
  product?: ProductLike;
  variant?: VariantLike;
  productMatchStatus: ProductMatchStatus;
  matchMethod:
    | 'product_id'
    | 'sku'
    | 'name'
    | 'history'
    | 'fuse'
    | 'none';
  matchScore?: number;
};

export type ProductCostResult = {
  productCost: number;
  cogsStatus: CogsStatus;
};

export function normalizeMatchText(value: unknown) {
  return String(value ?? '')
    .normalize('NFKC')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function exactTextMatch(
  value: unknown,
  candidates: unknown[]
) {
  const normalized = normalizeMatchText(value);
  return (
    normalized !== '' &&
    candidates.some(
      (candidate) =>
        normalizeMatchText(candidate) === normalized
    )
  );
}

function matchVariant(
  product: ProductLike,
  input: ProductMatchInput
) {
  const variants = product.variants ?? [];
  const childSku = normalizeMatchText(input.childSku);
  const variationName = normalizeMatchText(
    input.variationName
  );
  const productName = normalizeMatchText(input.productName);

  if (childSku) {
    const skuVariant = variants.find((variant) =>
      [variant.child_sku, variant.sku].some(
        (sku) => normalizeMatchText(sku) === childSku
      )
    );
    if (skuVariant) return skuVariant;
  }

  const exactVariant = variants.find((variant) =>
    exactTextMatch(variationName || productName, [
      variant.name,
    ])
  );
  if (exactVariant) return exactVariant;

  const historicalVariant = variants.find((variant) =>
    exactTextMatch(
      variationName || productName,
      variant.name_history ?? []
    )
  );
  if (historicalVariant) return historicalVariant;

  if (variants.length === 1 && !variationName) {
    return variants[0];
  }

  const variantSearchText = variationName || productName;
  if (!variantSearchText || variants.length === 0) {
    return undefined;
  }

  const result = new Fuse(variants, {
    keys: [
      { name: 'name', weight: 2 },
      { name: 'name_history', weight: 1 },
    ],
    includeScore: true,
    threshold: 0.45,
  }).search(variantSearchText)[0];

  return result?.score !== undefined && result.score <= 0.45
    ? result.item
    : undefined;
}

export function matchProductAndVariant(
  products: ProductLike[],
  input: ProductMatchInput
): ProductMatchResult {
  const productId = normalizeMatchText(input.productId);
  const parentSku = normalizeMatchText(input.parentSku);
  const productName = normalizeMatchText(input.productName);

  let product: ProductLike | undefined;
  let matchMethod: ProductMatchResult['matchMethod'] =
    'none';
  let matchScore: number | undefined;

  if (productId) {
    product = products.find(
      (candidate) =>
        normalizeMatchText(candidate.product_id) ===
        productId
    );
    if (product) matchMethod = 'product_id';
  }

  if (!product && parentSku) {
    product = products.find(
      (candidate) =>
        normalizeMatchText(candidate.parent_sku) ===
        parentSku
    );
    if (product) matchMethod = 'sku';
  }

  if (!product && productName) {
    product = products.find(
      (candidate) =>
        normalizeMatchText(candidate.name) === productName
    );
    if (product) matchMethod = 'name';
  }

  if (!product && productName) {
    product = products.find((candidate) =>
      exactTextMatch(
        productName,
        candidate.name_history ?? []
      )
    );
    if (product) matchMethod = 'history';
  }

  if (!product && productName && products.length > 0) {
    const results = new Fuse(products, {
      keys: [
        { name: 'name', weight: 2 },
        { name: 'name_history', weight: 1 },
      ],
      includeScore: true,
      threshold: 0.45,
    }).search(productName);
    const best = results[0];
    const second = results[1];

    if (best?.score !== undefined && best.score <= 0.45) {
      matchScore = best.score;
      if (
        second?.score !== undefined &&
        Math.abs(second.score - best.score) < 0.05
      ) {
        return {
          productMatchStatus: 'ambiguous',
          matchMethod: 'fuse',
          matchScore,
        };
      }
      product = best.item;
      matchMethod = 'fuse';
    }
  }

  if (!product) {
    return {
      productMatchStatus: 'unresolved',
      matchMethod: 'none',
    };
  }

  const variant = matchVariant(product, input);
  const hasMultipleVariants =
    (product.variants?.length ?? 0) > 1;

  return {
    product,
    variant,
    productMatchStatus:
      hasMultipleVariants && !variant
        ? 'ambiguous'
        : 'matched',
    matchMethod,
    matchScore,
  };
}

export function resolveProductCost(
  variant: VariantLike | undefined,
  orderCreatedAt: unknown
): ProductCostResult {
  if (!variant) {
    return { productCost: 0, cogsStatus: 'unresolved' };
  }

  const orderDate = new Date(String(orderCreatedAt ?? ''));
  const validOrderDate = !Number.isNaN(orderDate.getTime());
  const applicableCosts = validOrderDate
    ? (variant.costs ?? [])
        .map((cost) => ({
          cost,
          date: new Date(String(cost.effective_from ?? '')),
        }))
        .filter(
          ({ date }) =>
            !Number.isNaN(date.getTime()) &&
            date <= orderDate
        )
        .sort((a, b) => b.date.getTime() - a.date.getTime())
    : [];

  const historicalCost = applicableCosts[0]?.cost.cogs_unit;
  if (typeof historicalCost === 'number') {
    return {
      productCost: historicalCost,
      cogsStatus: 'resolved',
    };
  }

  return {
    productCost:
      typeof variant.default_cost === 'number'
        ? variant.default_cost
        : 0,
    cogsStatus: 'unresolved',
  };
}
