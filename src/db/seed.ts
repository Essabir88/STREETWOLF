/**
 * Seeds example products so the store isn't empty on first run.
 *
 * Uses the real artwork/photos supplied for this project (/public/products).
 * The story copy is illustrative — replace it with the brand's real
 * storytelling before launch. Run with:  npm run db:seed
 *
 * Upsert behaviour: if a product with the same slug already exists, its text
 * fields are UPDATED to this content, but stock counters are left untouched
 * so live sales are never reset.
 *
 * Product names are kept identical across locales (streetwear drop names
 * aren't usually translated), but tagline/story are real per-locale copy,
 * not machine-translated placeholders.
 */
import "dotenv/config";
import { randomUUID } from "crypto";
import { db, pool } from "./index";
import { products, type LocalizedText } from "./schema";

const seedProducts: {
  slug: string;
  name: LocalizedText;
  tagline: LocalizedText;
  story: LocalizedText;
  priceCents: number;
  images: string[];
  totalStock: number;
  stockRemaining: number;
}[] = [
  {
    slug: "circle-logo",
    name: { fr: "Circle Logo", en: "Circle Logo", ar: "Circle Logo" },
    tagline: {
      fr: "La lune regarde. Le loup ne dort pas.",
      en: "The moon watches. The wolf never sleeps.",
      ar: "القمر يراقب. والذئب لا ينام.",
    },
    story: {
      fr: `Dans les quartiers où la ville s'endort, il y a un loup qui ne dort jamais.

Ce t-shirt est la première pièce de la collection Street Wolf. Le logo circulaire au centre n'est pas un simple dessin — c'est la lune, témoin de ceux qui restent debout quand tout le monde dort.

100 exemplaires, pas un de plus. Le porter, ce n'est pas appartenir à la foule : c'est appartenir à un petit cercle qui connaît la valeur de la nuit.`,
      en: `In the neighborhoods where the city falls asleep, there's a wolf that never does.

This t-shirt is the first piece of the Street Wolf collection. The circular logo at the center isn't just a design — it's the moon, witness to those who stay up when everyone else sleeps.

100 pieces, not one more. Wearing it isn't about belonging to the crowd: it's about belonging to a small circle that knows the value of the night.`,
      ar: `في الأحياء التي تغفو فيها المدينة، هناك ذئب لا ينام أبداً.

هذا القميص هو القطعة الأولى من مجموعة Street Wolf. الشعار الدائري في المنتصف ليس مجرد رسمة — إنه القمر، شاهد على من يبقون مستيقظين حين ينام الجميع.

100 نسخة، ولا نسخة أكثر. ارتداؤه لا يعني الانتماء إلى الحشد، بل الانتماء إلى دائرة صغيرة تعرف قيمة الليل.`,
    },
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
    name: { fr: "Jersey 23", en: "Jersey 23", ar: "Jersey 23" },
    tagline: {
      fr: "L'esprit de la rue, en coupe oversize.",
      en: "The spirit of the street, cut oversize.",
      ar: "روح الشارع، بقصة فضفاضة.",
    },
    story: {
      fr: `Le numéro 23 n'est pas un hasard. C'est le nombre de quartiers d'où est partie la première idée de Street Wolf, avant qu'elle ne devienne une marque.

Ce t-shirt blanc oversize aux rayures noires sur les manches : une coupe varsity lourde, mais avec l'esprit de la rue, pas du stade. Fait pour être porté ample, et pour être vu de loin.

Édition limitée à 60 exemplaires.`,
      en: `The number 23 isn't random. It's the number of neighborhoods the first idea of Street Wolf came from, before it ever became a brand.

This oversized white t-shirt with black-striped sleeves: a heavy varsity cut, but with the spirit of the street, not the stadium. Made to be worn loose, and to be seen from a distance.

Limited edition of 60 pieces.`,
      ar: `الرقم 23 ليس صدفة. إنه عدد الأحياء التي انطلقت منها فكرة Street Wolf الأولى، قبل أن تصبح علامة تجارية.

قميص أبيض فضفاض بخطوط سوداء على الأكمام: قصة varsity ثقيلة، لكن بروح الشارع لا الملعب. صُمم ليُرتدى فضفاضاً، وليُرى من بعيد.

نسخة محدودة بـ 60 قطعة.`,
    },
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
    name: { fr: "Roar Mode", en: "Roar Mode", ar: "Roar Mode" },
    tagline: {
      fr: "La rage a un visage.",
      en: "Rage has a face.",
      ar: "للغضب وجه.",
    },
    story: {
      fr: `Parfois, l'histoire ne se raconte pas — elle se hurle.

« Roar Mode » est le design le plus brut jamais sorti par Street Wolf : un loup enragé, enfermé dans un cadre, comme s'il essayait d'en sortir. Fait pour ceux qui portent une pression et veulent la dire sans gaspiller un seul mot.

Le tirage était de 40 exemplaires — tout est parti.`,
      en: `Sometimes the story isn't told — it's roared.

"Roar Mode" is the rawest design Street Wolf has ever released: an enraged wolf, boxed in a frame, as if trying to break out of it. Made for those carrying pressure and wanting to say it without wasting a single word.

The run was 40 pieces — all gone.`,
      ar: `أحياناً لا تُروى القصة — بل تُزأر.

"Roar Mode" هو أخشن تصميم أصدرته Street Wolf على الإطلاق: ذئب هائج، محبوس داخل إطار، كأنه يحاول الخروج منه. صُمم لمن يحملون ضغطاً ويريدون قوله دون إهدار كلمة واحدة.

كانت النسخة 40 قطعة — نفدت بالكامل.`,
    },
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
        images: p.images,
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
          images: p.images,
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
