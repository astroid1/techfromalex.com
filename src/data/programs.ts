import type { AffiliateProgram } from "@/types";

export const programs: Record<string, AffiliateProgram> = {
  amazon: {
    id: "amazon",
    name: "Amazon Associates",
    domain: "amazon.com",
    buildUrl: (productUrl: string, tag?: string) => {
      const affiliateTag = tag || process.env.NEXT_PUBLIC_AMAZON_TAG || "";
      if (!affiliateTag) return productUrl;
      const url = new URL(productUrl);
      url.searchParams.set("tag", affiliateTag);
      return url.toString();
    },
  },
  bestbuy: {
    id: "bestbuy",
    name: "Best Buy",
    domain: "bestbuy.com",
    buildUrl: (productUrl: string, tag?: string) => {
      const affiliateId = tag || process.env.NEXT_PUBLIC_BESTBUY_AFF_ID || "";
      if (!affiliateId) return productUrl;
      const url = new URL(productUrl);
      url.searchParams.set("irclickid", affiliateId);
      return url.toString();
    },
  },
  bhphoto: {
    id: "bhphoto",
    name: "B&H Photo",
    domain: "bhphotovideo.com",
    buildUrl: (productUrl: string, tag?: string) => {
      const bi = tag || process.env.NEXT_PUBLIC_BH_BI || "";
      const kbid = process.env.NEXT_PUBLIC_BH_KBID || "";
      if (!bi) return productUrl;
      const url = new URL(productUrl);
      url.searchParams.set("BI", bi);
      if (kbid) url.searchParams.set("KBID", kbid);
      return url.toString();
    },
  },
};

export function getProgram(id: string): AffiliateProgram | undefined {
  return programs[id];
}
