/**
 * Robust multilingual text normalizer (Arabic + English)
 * Ensures user comments match trigger keywords regardless of:
 * - Arabic Tashkeel (علامات التشكيل)
 * - Alef variants (أ / إ / آ / ا)
 * - Taa Marbouta / Haa (ة / ه)
 * - Yaa / Alef Maqsoura (ي / ى)
 * - Letter stretching / tatweel (ـ)
 * - Repeated letters (e.g. "دلييييل" -> "دليل", "liiiink" -> "link")
 * - Punctuation and emojis (e.g. "دليل!" or "link? 🙌")
 */
export function normalizeText(text: string): string {
  if (!text) return '';

  let normalized = text.toLowerCase();

  // 1. Remove Arabic Tatweel (ـ)
  normalized = normalized.replace(/\u0640/g, '');

  // 2. Remove Arabic Tashkeel / Harakat (Fatha, Damma, Kasra, Sukun, Tanween, Shadda)
  normalized = normalized.replace(/[\u064B-\u065F\u0670]/g, '');

  // 3. Normalize Alef variations (أ, إ, آ, ٱ -> ا)
  normalized = normalized.replace(/[أإآٱ]/g, 'ا');

  // 4. Normalize Taa Marbouta to Haa (ة -> ه)
  normalized = normalized.replace(/ة/g, 'ه');

  // 5. Normalize Alef Maqsoura to Yaa (ى -> ي)
  normalized = normalized.replace(/ى/g, 'ي');

  // 6. Normalize Hamza on Waw / Yaa (ؤ -> و, ئ -> ي)
  normalized = normalized.replace(/ؤ/g, 'و').replace(/ئ/g, 'ي');

  // 7. Collapse 3 or more repeated characters into 1 (e.g., "دلييييل" -> "دليل", "sooo" -> "so")
  normalized = normalized.replace(/(.)\1{2,}/g, '$1');

  // 8. Replace punctuation, symbols, and special characters with spaces
  normalized = normalized.replace(/[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~،؛؟«»—–…]/g, ' ');

  // 9. Collapse multiple spaces into one and trim
  normalized = normalized.replace(/\s+/g, ' ').trim();

  return normalized;
}

/**
 * Checks if a comment matches any of the comma-separated trigger keywords
 * Supports both partial word matching and whole-token matching
 */
export function matchKeywords(
  commentText: string,
  keywordsString: string
): { isMatch: boolean; matchedKeyword: string | null } {
  if (!commentText || !keywordsString) {
    return { isMatch: false, matchedKeyword: null };
  }

  const normalizedComment = normalizeText(commentText);
  const commentTokens = normalizedComment.split(' ').filter(Boolean);

  const keywords = keywordsString
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);

  for (const rawKeyword of keywords) {
    const normalizedKeyword = normalizeText(rawKeyword);
    if (!normalizedKeyword) continue;

    // Direct substring match
    if (normalizedComment.includes(normalizedKeyword)) {
      return { isMatch: true, matchedKeyword: rawKeyword.trim() };
    }

    // Token-based matching
    const keywordTokens = normalizedKeyword.split(' ').filter(Boolean);
    if (keywordTokens.length === 1) {
      if (commentTokens.includes(normalizedKeyword)) {
        return { isMatch: true, matchedKeyword: rawKeyword.trim() };
      }
    }
  }

  return { isMatch: false, matchedKeyword: null };
}
