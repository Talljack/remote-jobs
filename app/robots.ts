import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://remotejobs.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/console/", "/api/", "/sign-in", "/sign-up"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
