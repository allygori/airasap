import { customAlphabet } from 'nanoid';

const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

type SkuPayload = {
  storeCode: string;
};

export default class SkuGenerator {
  constructor(private readonly payload: SkuPayload) {}

  generateParentSKU() {
    const { storeCode } = this.payload;
    const generateSegment = customAlphabet(alphabet, 2);
    const generateSuffix = customAlphabet(alphabet, 3);
    const categoryCode = generateSegment();
    const productCode = generateSegment();
    const lastCode = generateSuffix();

    return `${storeCode.toUpperCase()}${categoryCode}${productCode}-${lastCode}`;
  }

  generateChildSKU(parentSKU: string) {
    const generateVariantCode = customAlphabet(alphabet, 3);
    const variantCode = generateVariantCode();

    return `${parentSKU.slice(0, 6)}-${variantCode}`;
  }
}
