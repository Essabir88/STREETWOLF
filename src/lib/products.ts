import { eq } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";

export type ProductWithImages = Omit<
  typeof products.$inferSelect,
  "images" | "sizes"
> & { images: string[]; sizes: string[] };

function parseProduct(row: typeof products.$inferSelect): ProductWithImages {
  let images: string[] = [];
  let sizes: string[] = [];
  try {
    images = JSON.parse(row.images);
  } catch {
    images = [];
  }
  try {
    sizes = JSON.parse(row.sizes);
  } catch {
    sizes = [];
  }
  return { ...row, images, sizes };
}

export async function getActiveProducts(): Promise<ProductWithImages[]> {
  const rows = await db.query.products.findMany({
    where: eq(products.active, true),
    orderBy: (p, { desc }) => desc(p.createdAt),
  });
  return rows.map(parseProduct);
}

export async function getProductBySlug(
  slug: string
): Promise<ProductWithImages | null> {
  const row = await db.query.products.findFirst({
    where: eq(products.slug, slug),
  });
  return row ? parseProduct(row) : null;
}
