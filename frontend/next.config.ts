import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The repo root now holds a package.json for both projects, so Next would otherwise infer
  // code/ as the workspace root and resolve modules against the wrong node_modules.
  turbopack: { root: __dirname },
  // Phase G: emits a self-contained server plus only the node_modules actually used,
  // which is what the Docker runtime stage copies.
  output: "standalone",
  // Keep these as runtime require()s instead of bundling them:
  // pdfkit loads its .afm font data from disk (breaks when bundled),
  // and nodemailer/prisma are happier unbundled on serverless.
  serverExternalPackages: ["pdfkit", "nodemailer", "@prisma/client"],
  experimental: {
    // SEC-4.1: enables forbidden(), so a permission denial renders a real 403 boundary
    // instead of a silent redirect that would hide genuine authorisation bugs.
    // Contained to requirePermission() in src/lib/auth.ts if this flag ever changes.
    authInterrupts: true,
  },
};

/**
 * Gallery and upload URLs stored in the database point at `/api/files/...`. Rewriting them
 * to the backend keeps that data valid without the frontend serving files itself — and
 * without a migration over every stored URL.
 */
const API = process.env.BACKEND_API_URL?.trim() || "http://localhost:4000/api/v1";
nextConfig.rewrites = async () => [
  { source: "/api/files/:path*", destination: `${API}/files/:path*` },
  { source: "/api/receipts/:id", destination: `${API}/receipts/:id` },
  { source: "/api/documents/:type", destination: `${API}/documents/:type` },
  { source: "/api/admin/documents/:userId/:type", destination: `${API}/admin/documents/:userId/:type` },
  { source: "/api/admin/payments-export", destination: `${API}/admin/payments-export` },
];

export default nextConfig;
