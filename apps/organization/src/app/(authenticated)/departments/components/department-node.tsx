"use client";

import { Button, Badge } from "@repo/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui";
import { type DraggableTreeNode } from "@repo/ui";
import { FolderTree, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { type ReactNode, useState } from "react";
import { DepartmentDialog } from "./department-dialog";

interface DepartmentNodeProps {
  node: DraggableTreeNode & { description: string | null };
  orgId: string;
  isDragging: boolean;
  isSelected: boolean;
  isExpanded: boolean;
  hasChildren: boolean;
  canExpand: boolean;
  level: number;
  attributes: Record<string, unknown>;
  listeners: Record<string, unknown> | undefined;
  expandToggle: ReactNode;
}

export function DepartmentNode({
  node,
  orgId,
  isDragging,
  isSelected,
  level,
  attributes,
  listeners,
  expandToggle,
}: DepartmentNodeProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [createChildOpen, setCreateChildOpen] = useState(false);

  return (
    <>
      <div
        className={`flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground ${
          isSelected ? "bg-accent font-medium text-accent-foreground" : ""
        } ${isDragging ? "opacity-50" : ""}`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        <button
          type="button"
          className="shrink-0 cursor-grab touch-none text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
        >
          <FolderTree className="h-4 w-4" />
        </button>
        <span className="min-w-0 flex-1 truncate">{node.name}</span>
        <Badge variant="outline" className="shrink-0 px-1.5">
          {node.code}
        </Badge>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setEditOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setCreateChildOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Child
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {expandToggle}
      </div>
      <DepartmentDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        orgId={orgId}
        department={node}
      />
      <DepartmentDialog
        open={createChildOpen}
        onOpenChange={setCreateChildOpen}
        orgId={orgId}
        parentId={node.id}
      />
    </>
  );
}
