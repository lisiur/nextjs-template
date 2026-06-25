"use client";

import { useQuery } from "@tanstack/react-query";
import { appClient, useSession } from "@/lib/api";

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  metadata?: string | null;
  createdAt: string;
}

export function useCurrentOrganization() {
  const { data: session } = useSession();
  const activeOrganizationId = session?.session.activeOrganizationId;

  const query = useQuery({
    queryKey: ["organizations", "mine"],
    queryFn: async () => {
      const res = await appClient.api.organizations.mine.$get();
      if (!res.ok) throw new Error("Failed to load organizations");
      return (await res.json()) as { organizations: Organization[] };
    },
    enabled: !!activeOrganizationId,
  });

  const organization = query.data?.organizations.find(
    (org) => org.id === activeOrganizationId,
  );

  return {
    organization: organization ?? null,
    loading: query.isLoading && !!activeOrganizationId,
  };
}
