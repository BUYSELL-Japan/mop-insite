// Which affiliate link a spot shows for the current UI language.
// zh-TW -> affiliate_link_tw, ko -> affiliate_link_ko (prepared 2026-11-16; the UI has no Korean yet),
// anything else -> affiliate_link. An empty language-specific link falls back to affiliate_link.
// `language` is a plain string so 'ko' works before it is added to the Language type.

export type AffiliateField = 'affiliate_link' | 'affiliate_link_tw' | 'affiliate_link_ko';

export function affiliateFields(language: string): AffiliateField[] {
  if (language === 'zh-TW') return ['affiliate_link_tw', 'affiliate_link'];
  if (language === 'ko') return ['affiliate_link_ko', 'affiliate_link'];
  return ['affiliate_link'];
}

export function getAffiliateLink(
  props: Partial<Record<AffiliateField, string | undefined>>,
  language: string
): string | undefined {
  for (const field of affiliateFields(language)) {
    const value = props[field]?.trim();
    if (value) return value;
  }
  return undefined;
}
