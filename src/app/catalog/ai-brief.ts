// catalog/ai-brief.ts
import { Product } from './types';

export function aiBrief(product: Product, sizeId?: string) {
  const size = sizeId ? product.sizes.find(s => s.id === sizeId) : undefined;

  const dims = size
    ? `${size.widthIn}×${size.heightIn} in @ ~${size.dpiRecommended} dpi`
    : 'see product defaults';

  const bleed = size?.bleedIn ? `${size.bleedIn} in bleed` : 'no explicit bleed';
  const safe = size?.safeMarginIn ? `${size.safeMarginIn} in safe margin` : 'no explicit safe margin';

  const printable = size?.printableAreaIn
    ? `printable area ${size.printableAreaIn.widthIn}×${size.printableAreaIn.heightIn} in`
    : null;

  return [
    `Product: ${product.title}`,
    `Allowed orientations: ${product.orientations.join(', ')}`,
    `Target size: ${dims}${printable ? `, ${printable}` : ''}`,
    `Layout: ${bleed}; ${safe}`,
    `Color: ${product.aiHints.colorProfile || 'sRGB'}`,
    ...(product.aiHints.promptDo?.map(d => `Do: ${d}`) ?? []),
    ...(product.aiHints.promptDont?.map(d => `Avoid: ${d}`) ?? []),
    product.aiHints.backgroundAdvice ? `Background: ${product.aiHints.backgroundAdvice}` : '',
    product.aiHints.textAdvice ? `Text: ${product.aiHints.textAdvice}` : '',
  ].filter(Boolean).join('\n');
}
