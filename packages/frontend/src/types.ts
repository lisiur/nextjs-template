export type AuthUser = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  role?: string | null;
  flags: string[];
};

export type AuthSession = {
  id: string;
  userId: string;
  expiresAt: string;
  activeOrganizationId?: string | null;
};

export type SessionData = {
  user: AuthUser;
  session: AuthSession;
} | null;

export type LinkType = "GROUP" | "INTERNAL" | "EXTERNAL";

export interface MenuRecord {
  id: string;
  appId: string;
  parentId?: string | null;
  name: string;
  code: string;
  icon?: string | null;
  linkType: LinkType;
  url: string | null;
  sortOrder: number;
}

export interface MenuTreeNode {
  id: string;
  name: string;
  code: string;
  icon?: string | null;
  linkType: LinkType;
  url: string | null;
  children: MenuTreeNode[];
}
