/**
 * Seeds example products so the store isn't empty on first run.
 *
 * These three products use the real artwork/photos supplied for this
 * project (see /public/products). The story copy is illustrative — replace
 * it with the brand's real storytelling before launch. Run with:
 *   npm run db:seed
 */
import "dotenv/config";
import { randomUUID } from "crypto";
import { db, pool } from "./index";
import { products } from "./schema";

const seedProducts = [
  {
    slug: "circle-logo",
    name: "الشعار الدائري",
    tagline: "القمر يشهد. الذئب لا ينام.",
    story: `في الأحياء التي تغفو المدينة فيها، هناك ذئب لا ينام.

هذا التيشورت هو أول قطعة في مجموعة Street Wolf. الشعار الدائري في المنتصف ليس مجرد رسم — إنه القمر الذي يشهد على من يبقى مستيقظاً بعدما ينام الجميع.

100 نسخة لا غير، كل واحدة مرقّمة. من يرتديه لا ينتمي إلى الحشد، بل إلى دائرة صغيرة تعرف قيمة الليل.`,
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
    name: "جيرسي 23",
    tagline: "روح الشارع، بمقاس فضفاض.",
    story: `الرقم 23 ليس مصادفة. هو عدد الأحياء التي انطلقت منها فكرة Street Wolf الأولى، قبل أن تصبح ماركة.

قصة هذا التيشورت الأبيض الفضفاض بخطوط الأكمام السوداء: طبعة رياضية ثقيلة (varsity)، لكن بروح الشارع لا الملعب. صُمم ليُلبس فضفاضاً، وليُرى من بعيد.

إصدار محدود بـ 60 نسخة.`,
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
    name: "روار مود",
    tagline: "الغضب له شكل.",
    story: `أحياناً القصة لا تُحكى — بل تُصرَخ.

"روار مود" هو أعنف تصميم أصدرته Street Wolf: وجه ذئب هائج، محاصر داخل إطار، كأنه يحاول الخروج منه. صُمم لمن يحمل ضغطاً ويحتاج أن يقوله بدون أن يهدر كلمة واحدة.

كانت الكمية 40 نسخة فقط — ونفدت بالكامل.`,
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
      .onConflictDoNothing();
  }
  console.log(
    `Seeded ${seedProducts.length} products (skips ones that already exist by slug).`
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
