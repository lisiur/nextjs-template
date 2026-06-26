"use client";

import {
  DraggableTree,
  type DraggableTreeNode,
  type ReorderChange,
} from "@repo/ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { appClient, withApiFeedback } from "@/lib/api";
import { DepartmentNode } from "./department-node";

interface Department extends DraggableTreeNode {
  description: string | null;
  organizationId: string;
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
        <DepartmentNode node={node as Department} {...props} orgId={orgId} />
      )}
      emptyLabel="No departments"
    />
  );
}

function buildTree(departments: Department[]): Department[] {
  const map = new Map<string, Department>();
  const roots: Department[] = [];

  for (const dept of departments) {
    map.set(dept.id, { ...dept, children: [] });
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
