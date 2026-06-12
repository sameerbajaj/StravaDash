import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/api/**/*': ['./prisma/dev.db'],
    '/auth/**/*': ['./prisma/dev.db'],
  },
};

export default nextConfig;
