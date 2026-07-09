/**
 * Pure helpers over the minimal category shape shared by the admin
 * (`ServiceCategory`) and the public store (`PublicCategory`). The hierarchy
 * is one level deep: categoría > subcategoría (enforced on write in
 * services/catalog.ts).
 */
export type CategoryNode = { id: string; name: string; parentId: string | null };

/** `[parent, child]` (or `[cat]` for roots). Cycle/orphan-safe. */
export function categoryPath<T extends CategoryNode>(all: T[], id: string): T[] {
  const cat = all.find((c) => c.id === id);
  if (!cat) return [];
  const parent = cat.parentId
    ? all.find((c) => c.id === cat.parentId && c.id !== cat.id)
    : undefined;
  return parent ? [parent, cat] : [cat];
}

/** "Pijamas > Batolas" (or just the name for roots). */
export function categoryLabel(all: CategoryNode[], id: string): string {
  return categoryPath(all, id)
    .map((c) => c.name)
    .join(" > ");
}

/** Roots (alphabetical) with their children nested; orphans render as roots. */
export function categoryTree<T extends CategoryNode>(
  all: T[],
): { root: T; children: T[] }[] {
  const ids = new Set(all.map((c) => c.id));
  const roots = all.filter((c) => !c.parentId || !ids.has(c.parentId));
  return roots.map((root) => ({
    root,
    children: all.filter((c) => c.parentId === root.id),
  }));
}

/** The category and its children — top-down store filtering (a child matches only itself). */
export function descendantsAndSelf(all: CategoryNode[], id: string): Set<string> {
  const out = new Set([id]);
  for (const c of all) if (c.parentId === id) out.add(c.id);
  return out;
}

/**
 * Symmetric family: the category, its parent, and every category sharing that
 * parent (or its own children for roots). Used for related-item scoring.
 */
export function familyIds(all: CategoryNode[], id: string): Set<string> {
  const cat = all.find((c) => c.id === id);
  if (!cat) return new Set([id]);
  const rootId = cat.parentId ?? cat.id;
  const out = new Set([rootId]);
  for (const c of all) if (c.parentId === rootId) out.add(c.id);
  out.add(id);
  return out;
}
