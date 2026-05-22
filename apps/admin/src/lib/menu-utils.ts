type MenuNode = {
  id: string;
  parentId?: string | null;
  url?: string | null;
  sortOrder: number;
};

export function getFirstMenuUrl(menus: MenuNode[]): string | null {
  const parentIds = new Set<string>();
  for (const m of menus) {
    if (m.parentId) parentIds.add(m.parentId);
  }

  const sorted = [...menus].sort((a, b) => a.sortOrder - b.sortOrder);

  const roots = sorted.filter((m) => !m.parentId || !parentIds.has(m.id));
  function findFirstLeaf(nodes: MenuNode[]): string | null {
    for (const node of nodes) {
      const children = sorted.filter((m) => m.parentId === node.id);
      if (children.length === 0) {
        return node.url ?? null;
      }
      const leafUrl = findFirstLeaf(children);
      if (leafUrl) return leafUrl;
    }
    return null;
  }

  return findFirstLeaf(roots);
}
