/**
 * Seeds example products so the store isn't empty on first run.
 *
 * Uses the real artwork/photos supplied for this project (/public/products).
 * The story copy is illustrative — replace it with the brand's real
 * storytelling before launch. Run with:  npm run db:seed
 *
 * Upsert behaviour: if a product with the same slug already exists (e.g. the
 * earlier Arabic-seeded rows), its text fields are UPDATED to this content,
 * but stock counters are left untouched so live sales are never reset.
 */
import "dotenv/config";
import { randomUUID } from "crypto";
import { db, pool } from "./index";
import { products } from "./schema";

const seedProducts = [
  {
    slug: "circle-logo",
    name: "Circle Logo",
    tagline: "La lune regarde. Le loup ne dort pas.",
    story: `Dans les quartiers où la ville s'endort, il y a un loup qui ne dort jamais.

Ce t-shirt est la première pièce de la collection Street Wolf. Le logo circulaire au centre n'est pas un simple dessin — c'est la lune, témoin de ceux qui restent debout quand tout le monde dort.

100 exemplaires, pas un de plus. Le porter, ce n'est pas appartenir à la foule : c'est appartenir à un petit cercle qui connaît la valeur de la nuit.`,
    priceCents: 27900,
    images: [
      "/products/circle-logo-1.jpg",
      "/products/circle-logo-2.jpg",
      "/products/circle-logo-3.jpg",
    ],
    totalStock: 100,
    stockRemaining: 23,
  },
  {
    slug: "jersey-23",
    name: "Jersey 23",
    tagline: "L'esprit de la rue, en coupe oversize.",
    story: `Le numéro 23 n'est pas un hasard. C'est le nombre de quartiers d'où est partie la première idée de Street Wolf, avant qu'elle ne devienne une marque.

Ce t-shirt blanc oversize aux rayures noires sur les manches : une coupe varsity lourde, mais avec l'esprit de la rue, pas du stade. Fait pour être porté ample, et pour être vu de loin.

Édition limitée à 60 exemplaires.`,
    priceCents: 34900,
    images: [
      "/products/jersey-23-1.jpg",
      "/products/jersey-23-2.jpg",
      "/products/jersey-23-3.jpg",
    ],
    totalStock: 60,
    stockRemaining: 60,
  },
  {
    slug: "roar-mode",
    name: "Roar Mode",
    tagline: "La rage a un visage.",
    story: `Parfois, l'histoire ne se raconte pas — elle se hurle.

« Roar Mode » est le design le plus brut jamais sorti par Street Wolf : un loup enragé, enfermé dans un cadre, comme s'il essayait d'en sortir. Fait pour ceux qui portent une pression et veulent la dire sans gaspiller un seul mot.

Le tirage était de 40 exemplaires — tout est parti.`,
    priceCents: 25900,
    images: ["/products/roar-mode-1.jpg"],
    totalStock: 40,
    stockRemaining: 0,
  },
];

async function main() {
  for (const p of seedProducts) {
    await db
      .insert(products)
      .values({
        id: randomUUID(),
        slug: p.slug,
        name: p.name,
        tagline: p.tagline,
        story: p.story,
        priceCents: p.priceCents,
        images: JSON.stringify(p.images),
        totalStock: p.totalStock,
        stockRemaining: p.stockRemaining,
        active: true,
      })
      .onConflictDoUpdate({
        target: products.slug,
        // Deliberately NOT updating stockRemaining/totalStock: if real sales
        // have already happened, re-seeding must never resurrect sold stock.
        set: {
          name: p.name,
          tagline: p.tagline,
          story: p.story,
          priceCents: p.priceCents,
          images: JSON.stringify(p.images),
        },
      });
  }
  console.log(
    `Seeded/updated ${seedProducts.length} products (existing stock counters preserved).`
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
