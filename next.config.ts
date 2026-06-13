import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/api/**/*': ['./prisma/template.db'],
    '/auth/**/*': ['./prisma/template.db'],
  },
};

export default nextConfig;
