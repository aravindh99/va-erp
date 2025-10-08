import { z } from "zod";

export const createSiteSchema = z.object({
  siteName: z.string().min(1).max(255),
  siteStatus: z.boolean(),
});

export const updateSiteSchema = createSiteSchema.partial();

export const deleteSiteSchema = z.object({});
