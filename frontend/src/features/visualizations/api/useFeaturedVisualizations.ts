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
      const res = await fetch(url);
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
