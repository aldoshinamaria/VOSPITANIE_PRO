import { organizationDirectory, type OrganizationDirectoryEntry } from "@/lib/domain/social-partners/organization-directory";

export interface OrganizationSearchInput {
  query: string;
  region?: string;
  municipality?: string;
  limit?: number;
}

export interface OrganizationSearchResult {
  entry: OrganizationDirectoryEntry;
  score: number;
  scope: "municipality" | "region" | "other";
  matchedBy: string[];
}

export function searchOrganizationDirectory(input: OrganizationSearchInput): OrganizationSearchResult[] {
  const query = normalizeSearchText(input.query);

  if (query.length < 2) {
    return [];
  }

  const region = normalizeSearchText(input.region ?? "");
  const municipality = normalizeSearchText(input.municipality ?? "");
  const limit = input.limit ?? 6;

  return organizationDirectory
    .map((entry) => scoreEntry(entry, query, region, municipality))
    .filter((result): result is OrganizationSearchResult => Boolean(result))
    .sort((left, right) => {
      const scopeRank = getScopeRank(left.scope) - getScopeRank(right.scope);

      if (scopeRank !== 0) {
        return scopeRank;
      }

      return right.score - left.score;
    })
    .slice(0, limit);
}

export function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .replace(/[«»"']/g, "")
    .replace(/ё/g, "е")
    .replace(/c/g, "с")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreEntry(
  entry: OrganizationDirectoryEntry,
  query: string,
  region: string,
  municipality: string
): OrganizationSearchResult | null {
  const entryRegion = normalizeSearchText(entry.region);
  const entryMunicipality = normalizeSearchText(entry.municipality);
  const haystack = [
    entry.officialName,
    entry.type,
    entry.region,
    entry.municipality,
    ...entry.shortNames,
    ...entry.aliases,
    ...entry.tags
  ].map(normalizeSearchText);

  const matchedBy = haystack.filter((value) => value.includes(query) || query.includes(value));

  if (matchedBy.length === 0) {
    return null;
  }

  const exactAlias = [...entry.shortNames, ...entry.aliases]
    .map(normalizeSearchText)
    .some((alias) => alias === query);
  const scope = getScope(entryRegion, entryMunicipality, region, municipality);
  const scopeScore = scope === "municipality" ? 30 : scope === "region" ? 15 : 0;
  const score = Math.min(100, 45 + scopeScore + matchedBy.length * 6 + (exactAlias ? 25 : 0));

  return {
    entry,
    score,
    scope,
    matchedBy: Array.from(new Set(matchedBy)).slice(0, 4)
  };
}

function getScope(
  entryRegion: string,
  entryMunicipality: string,
  region: string,
  municipality: string
): OrganizationSearchResult["scope"] {
  const regionMatches = Boolean(region) && entryRegion === region;
  const municipalityMatches =
    Boolean(municipality) &&
    Boolean(entryMunicipality) &&
    (entryMunicipality === municipality || municipality.includes(entryMunicipality) || entryMunicipality.includes(municipality));

  if (regionMatches && municipalityMatches) {
    return "municipality";
  }

  if (regionMatches) {
    return "region";
  }

  return "other";
}

function getScopeRank(scope: OrganizationSearchResult["scope"]) {
  if (scope === "municipality") {
    return 0;
  }

  if (scope === "region") {
    return 1;
  }

  return 2;
}
