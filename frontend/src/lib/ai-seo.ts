import { slugify } from './admin-content';

export interface AiSeoSuggestionInput {
  title: string;
  brandName?: string;
  category?: string;
  summary?: string;
  content?: string;
  tags?: string[];
  existingKeywords?: string[];
  fallbackSlug?: string;
}

export interface AiSeoSuggestions {
  title: string;
  description: string;
  keywords: string[];
  summary: string;
  slug: string;
}

const STOP_WORDS = new Set([
  've',
  'ile',
  'icin',
  'olarak',
  'daha',
  'gibi',
  'bir',
  'bu',
  'olan',
  'yeni',
  'tum',
  'icin',
  'from',
  'the',
  'and',
  'birlikte',
  'gore',
  'gibi',
  'ama',
  'veya',
  'hem',
  'her',
  'cok',
  'az',
  'icin',
  'kadar',
]);

function normalizeWhitespace(value: string | null | undefined) {
  return (value ?? '').replace(/\s+/g, ' ').trim();
}

function stripHtml(value: string | null | undefined) {
  return normalizeWhitespace((value ?? '').replace(/<[^>]+>/g, ' '));
}

function summarize(value: string | null | undefined, maxLength: number) {
  const normalized = stripHtml(value);
  if (!normalized) {
    return '';
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  const sliced = normalized.slice(0, Math.max(0, maxLength - 3));
  const lastWhitespace = sliced.lastIndexOf(' ');
  const safeValue = lastWhitespace > 32 ? sliced.slice(0, lastWhitespace) : sliced;
  return `${safeValue.trim()}...`;
}

function uniqueKeywords(values: Array<string | null | undefined>) {
  const seen = new Set<string>();
  const output: string[] = [];

  values.forEach((value) => {
    const normalized = normalizeWhitespace(value);
    if (!normalized) {
      return;
    }

    const key = normalized.toLocaleLowerCase('tr-TR');
    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    output.push(normalized);
  });

  return output;
}

function extractKeywordTokens(value: string) {
  return uniqueKeywords(
    stripHtml(value)
      .split(/[^a-zA-Z0-9\u00c0-\u024f]+/)
      .map((item) => item.trim())
      .filter((item) => item.length >= 3)
      .filter((item) => !STOP_WORDS.has(item.toLocaleLowerCase('tr-TR'))),
  );
}

export function createAiSeoSuggestions(input: AiSeoSuggestionInput): AiSeoSuggestions {
  const normalizedTitle = normalizeWhitespace(input.title);
  const normalizedBrandName = normalizeWhitespace(input.brandName);
  const normalizedCategory = normalizeWhitespace(input.category);
  const normalizedSummary = normalizeWhitespace(input.summary);
  const normalizedContent = stripHtml(input.content);
  const sourceSummary = normalizedSummary || normalizedContent || normalizedTitle;
  const summary = summarize(sourceSummary, 180);
  const descriptionSeed = normalizedSummary
    ? normalizedSummary
    : [normalizedTitle, normalizedCategory, summary]
        .filter((item) => item.length > 0)
        .join('. ');

  const title = summarize(
    [normalizedTitle, normalizedCategory || normalizedBrandName]
      .filter((item) => item.length > 0)
      .join(' | '),
    66,
  );

  const description = summarize(descriptionSeed, 155);
  const tokenKeywords = extractKeywordTokens(`${normalizedTitle} ${normalizedContent}`);
  const keywords = uniqueKeywords([
    ...(input.tags ?? []),
    ...(input.existingKeywords ?? []),
    normalizedCategory,
    normalizedBrandName,
    normalizedTitle,
    ...tokenKeywords.slice(0, 8),
  ]).slice(0, 8);

  return {
    title,
    description,
    keywords,
    summary,
    slug: slugify(input.fallbackSlug || normalizedTitle, 'icerik'),
  };
}
