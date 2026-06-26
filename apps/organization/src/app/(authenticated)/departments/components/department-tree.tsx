"use client";

import {
  DraggableTree,
  type DraggableTreeNode,
  type ReorderChange,
} from "@repo/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { appClient, withApiFeedback } from "@/lib/api";
import { DepartmentNode } from "./department-node";

interface DepartmentNodeData extends DraggableTreeNode {
  code: string;
  description: string | null;
  organizationId: string;
}

/** Flat department record returned by the API (no children). */
interface DepartmentRecord {
  id: string;
  organizationId: string;
  parentId: string | null;
  name: string;
  code: string;
  description?: string | null;
  sortOrder: number;
  createdAt: string;
}

export function DepartmentTree({ orgId }: { orgId: string }) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["departments", orgId],
    queryFn: async () => {
      const res = await withApiFeedback(
        appClient.api.organizations[":orgId"].departments.$get,
      )({ param: { orgId } });
      const data = await res.json();
      return data.departments;
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (changes: ReorderChange[]) => {
      await withApiFeedback(
        appClient.api.organizations[":orgId"].departments.reorder.$put,
      )({ param: { orgId }, json: { items: changes } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments", orgId] });
    },
  });

  const handleReorder = useCallback(
    (changes: ReorderChange[]) => {
      reorderMutation.mutate(changes);
    },
    [reorderMutation],
  );

  if (isLoading) {
    return <div className="text-muted-foreground">Loading...</div>;
  }

  const treeData = buildTree(data ?? []);

  return (
    <DraggableTree
      data={treeData}
      onReorder={handleReorder}
      renderNode={(node, props) => (
        <DepartmentNode node={node as DepartmentNodeData} {...props} orgId={orgId} />
      )}
      emptyLabel="No departments"
    />
  );
}

function buildTree(departments: DepartmentRecord[]): DepartmentNodeData[] {
  const map = new Map<string, DepartmentNodeData>();
  const roots: DepartmentNodeData[] = [];

  for (const dept of departments) {
    map.set(dept.id, { ...dept, children: [], description: dept.description ?? null });
  }

  for (const dept of departments) {
    const node = map.get(dept.id)!;
    if (dept.parentId) {
      map.get(dept.parentId)?.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}
