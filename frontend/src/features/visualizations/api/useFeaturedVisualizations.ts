import { useQuery } from "@tanstack/react-query";

export interface FeaturedVisualization {
  uuid: string;
  image: string;
  label?: string;
}

export function useFeaturedVisualizations() {
  return useQuery({
    queryKey: ["featured-visualizations"],
    queryFn: async (): Promise<FeaturedVisualization[]> => {
      const path = import.meta.env.VITE_FEATURED_PATH ?? "featured.json";
      // Absolute or root-relative paths bypass the CloudFront prefix so we
      // can point at a local file (e.g. `/featured.json` served from public/)
      // or any arbitrary URL during development.
      const isAbsolute = /^https?:\/\//i.test(path) || path.startsWith("/");
      const url = isAbsolute
        ? path
        : `${import.meta.env.VITE_CLOUDFRONT_URL}/${path}`;
      // `cache: "no-cache"` forces the browser to revalidate with the server
      // (sending If-None-Match / If-Modified-Since) instead of serving from
      // disk cache. Avoids the "stale featured.json" problem when an
      // upstream Cache-Control max-age has lingered in users' browsers.
      // CloudFront's edge cache is unaffected — it's controlled by the
      // origin response headers, not by client request headers.
      const res = await fetch(url, { cache: "no-cache" });
      if (!res.ok) {
        throw new Error(
          `Failed to fetch featured visualizations: ${res.status}`,
        );
      }
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}
