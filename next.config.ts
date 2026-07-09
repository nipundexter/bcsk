import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep these as runtime require()s instead of bundling them:
  // pdfkit loads its .afm font data from disk (breaks when bundled),
  // and nodemailer/prisma are happier unbundled on serverless.
  serverExternalPackages: ["pdfkit", "nodemailer", "@prisma/client"],
};

export default nextConfig;
