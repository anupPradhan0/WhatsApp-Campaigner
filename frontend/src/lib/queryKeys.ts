/**
 * Centralized TanStack Query key factory.
 * Using an object keeps keys consistent and makes invalidation predictable.
 */
export const QK = {
  dashboard:   () => ['dashboard']           as const,
  business:    () => ['business']            as const,
  users:       () => ['users']               as const,
  resellers:   () => ['resellers']           as const,
  campaigns:   (endpoint: string) => ['campaigns', endpoint] as const,
  campaignDetail: (id: string) => ['campaign', id] as const,
  campaignNumbers: (id: string, page: number) => ['campaign', id, 'numbers', page] as const,
  complaints:  () => ['complaints']          as const,
  news:        () => ['news']                as const,
  treeView:    () => ['treeView']            as const,
  transactions:() => ['transactions']        as const,
  support:     () => ['support']             as const,
} as const;
