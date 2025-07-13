export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

/**
 * Sanitize a string by removing regex special characters
 */
export function sanitizeString(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "");
}

/**
 * Create search terms from a search string
 */
export function createSearchTerms(searchString: string): string[] {
  const sanitizedString = sanitizeString(searchString);
  return sanitizedString.split(" ").filter((t) => t !== "");
}

interface SearchRegex {
  regexs: RegExp[];
  test: (...targets: string[]) => boolean;
}

/**
 * Create search regex from a search string
 */
export function createSearchRegex(searchString: string): SearchRegex {
  const searchTerms = createSearchTerms(searchString);
  const regexs = searchTerms.map((s) => new RegExp(escapeRegExp(s), "i")); // 'i' for case-insensitive search
  return {
    regexs,
    test: (...targets: string[]) => {
      return regexs.every((regex) =>
        targets.some((target) => regex.test(target))
      );
    },
  };
}

/**
 * Filter items based on search string and keys
 */
export function filterItems<T extends Record<string, any>>(
  items: T[],
  searchString: string,
  keys: (keyof T)[]
): T[] {
  const searchRegex = createSearchRegex(searchString);
  let filteredItems = items;

  for (const regex of searchRegex.regexs) {
    filteredItems = filteredItems.filter((item) => {
      return keys.some((key) => {
        const value = item[key];
        if (typeof value === "string") {
          return regex.test(value);
        } else if (Array.isArray(value)) {
          return value.some((v: any) => typeof v === "string" && regex.test(v));
        }
        return false;
      });
    });
  }
  return filteredItems;
}
