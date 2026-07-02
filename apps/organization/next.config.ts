import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  basePath: "/organization",
  assetPrefix: "/organization-static",
  htmlLimitedBots: /.*/,
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
