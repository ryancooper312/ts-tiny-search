export type TokenizedFilterOptions<T> = {
    /** Extract searchable fields per item. Returning only visible labels avoids accidental hidden-ID matches. */
    getFields: (item: T) => Array<string | undefined | null>;
    /** Optional threshold below which filtering can be skipped until lists reach sufficient length. */
    minItemsToFilter?: number;
};

const COMBINING_MARKS_RE = /[\u0300-\u036f]/g;
const WHITESPACE_RE = /\s+/;

/**
 * Normalize text for case-insensitive, diacritic-insensitive matching.
 */
export function normalizeText(input: string): string {
    return input
        .normalize('NFD')
        .replace(COMBINING_MARKS_RE, '')
        .toLowerCase()
        .trim();
}

/**
 * Split a raw query into normalized whitespace-delimited search tokens.
 */
export function tokenizeQuery(query: string): string[] {
    const normalized = normalizeText(query);
    if (!normalized) {
        return [];
    }
    return normalized.split(WHITESPACE_RE).filter(Boolean);
}

/**
 * Filter a list by requiring every token in `query` to match at least one extracted field of an item.
 */
export function tokenizedFilter<T>(
    items: readonly T[],
    query: string,
    options: TokenizedFilterOptions<T>,
): T[] {
    const {getFields, minItemsToFilter = 1} = options;
    if (items.length < minItemsToFilter) {
        return [...items];
    }

    const tokens = tokenizeQuery(query);
    if (tokens.length === 0) {
        return [...items];
    }

    return items.filter((item) => {
        const fields = getFields(item)
            .filter((value): value is string => typeof value === 'string' && value.length > 0)
            .map(normalizeText);

        if (fields.length === 0) {
            return false;
        }

        return tokens.every((token) => fields.some((field) => field.includes(token)));
    });
}

/**
 * Partition `items` so selected entries appear at the top while preserving original relative order,
 * unless the list stays below `minItemsToPin`.
 */
export function pinSelectedToTop<T>(
    items: readonly T[],
    isSelected: (item: T) => boolean,
    minItemsToPin = 12,
): T[] {
    if (items.length < minItemsToPin) {
        return [...items];
    }

    const pinned: T[] = [];
    const rest: T[] = [];
    for (const item of items) {
        if (isSelected(item)) {
            pinned.push(item);
        } else {
            rest.push(item);
        }
    }

    if (pinned.length === 0) {
        return [...items];
    }
    return [...pinned, ...rest];
}

