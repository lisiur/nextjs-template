"use client";

import { create } from "zustand";
import type { MenuRecord, MenuTreeNode } from "../types";

export function getFirstMenuUrl(menus: MenuRecord[]): string | null {
  const parentIds = new Set<string>();
  for (const menu of menus) {
    if (menu.parentId) parentIds.add(menu.parentId);
  }

  const sorted = [...menus].sort((a, b) => a.sortOrder - b.sortOrder);
  const roots = sorted.filter(
    (menu) => !menu.parentId || !parentIds.has(menu.id),
  );

  function findFirstLeaf(nodes: MenuRecord[]): string | null {
    for (const node of nodes) {
      const children = sorted.filter((menu) => menu.parentId === node.id);
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

function buildTree(menus: MenuRecord[]): MenuTreeNode[] {
  const map = new Map<string, MenuTreeNode>();
  const roots: MenuTreeNode[] = [];

  for (const menu of menus) {
    map.set(menu.id, {
      id: menu.id,
      name: menu.name,
      code: menu.code,
      icon: menu.icon,
      linkType: menu.linkType,
      url: menu.url,
      children: [],
    });
  }

  for (const menu of menus) {
    const node = map.get(menu.id);
    if (!node) continue;
    if (menu.parentId) {
      const parent = map.get(menu.parentId);
      if (parent) {
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  }

  function sortChildren(nodes: MenuTreeNode[]) {
    nodes.sort((a, b) => {
      const aMenu = menus.find((m) => m.id === a.id);
      const bMenu = menus.find((m) => m.id === b.id);
      return (aMenu?.sortOrder ?? 0) - (bMenu?.sortOrder ?? 0);
    });
    for (const node of nodes) {
      sortChildren(node.children);
    }
  }
  sortChildren(roots);

  return roots;
}

interface MenuState {
  menus: MenuRecord[];
  treeMenus: MenuTreeNode[];
  loading: boolean;
  fetched: boolean;
  fetchMenus: () => Promise<void>;
  refetchMenus: () => Promise<void>;
  resetMenus: () => void;
}

interface MenuAppClient {
  api: {
    menus: {
      mine: {
        $get: () => Promise<{
          ok: boolean;
          json: () => Promise<{ menus: MenuRecord[] }>;
        }>;
      };
    };
  };
}

export function createMenuStore(appClient: MenuAppClient) {
  let inflight: Promise<void> | null = null;
  let requestVersion = 0;

  return create<MenuState>((set, get) => ({
    menus: [],
    treeMenus: [],
    loading: false,
    fetched: false,

    fetchMenus: async () => {
      if (get().fetched) return;
      if (inflight) return inflight;

      const version = ++requestVersion;
      set({ loading: true });
      inflight = (async () => {
        try {
          const res = await appClient.api.menus.mine.$get();
          if (!res.ok) throw new Error("Failed to load menus");
          const data = await res.json();
          const menus = data.menus;
          const treeMenus = buildTree(menus);
          if (version === requestVersion) {
            set({ menus, treeMenus, fetched: true });
          }
        } finally {
          if (version === requestVersion) {
            set({ loading: false });
            inflight = null;
          }
        }
      })();

      return inflight;
    },

    refetchMenus: async () => {
      requestVersion++;
      inflight = null;
      set({ fetched: false });
      await get().fetchMenus();
    },

    resetMenus: () => {
      requestVersion++;
      inflight = null;
      set({ menus: [], treeMenus: [], fetched: false, loading: false });
    },
  }));
}
