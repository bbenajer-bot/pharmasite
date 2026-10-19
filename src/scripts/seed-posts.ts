/**
 * Starter blog posts, saved as DRAFTS. The client (doctor) reviews each one for medical accuracy in
 * /admin → Blog posts, then sets Status to Published.
 *
 *   pnpm seed:posts                            # local database
 *   DATABASE_URL=<neon url> pnpm seed:posts    # live preview database
 *
 * Safe to run twice: posts and categories that already exist (same slug) are left alone.
 */
import config from '@payload-config'
import { convertMarkdownToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'
import { getPayload } from 'payload'

import { slugify } from '@/fields/slug'
import type { Post } from '@/payload-types'

const AUTHOR = 'Our pharmacy team'

const categories = [
  { name: 'Medication tips', order: 1 },
  { name: 'Safety', order: 2 },
  { name: 'Vaccines', order: 3 },
]

const posts: { title: string; excerpt: string; category: string; markdown: string }[] = [
  {
    title: 'How to read your prescription label',
    category: 'Medication tips',
    excerpt:
      'Dosage, refills, warnings: a quick guide to the small print on your prescription bottle, and what to do when something isn’t clear.',
    markdown: `
The label on your prescription bottle holds a lot of information in a small space. Knowing where to look helps you take your medicine the right way, every time.

## What’s on the label

- **Your name.** Always check that the bottle is yours, especially if several people in your home take medicine.
- **Medicine name and strength.** For example, “Lisinopril 10 mg”. The name may be the generic name rather than the brand you know.
- **Directions.** How much to take, how often, and sometimes when (for example, “with food” or “at bedtime”).
- **Prescription (Rx) number.** You’ll need this number when you ask for a refill.
- **Refills.** How many refills are left. “No refills” means your prescriber needs to approve more.
- **Quantity and date filled.** Useful for checking when you’ll run out.
- **Prescriber.** The doctor or other provider who wrote the prescription.
- **Discard after / use by date.** Don’t use the medicine after this date.

## Warning stickers

Colored stickers on the side of the bottle carry extra instructions, such as “May cause drowsiness”, “Do not drink alcohol”, or “Take with plenty of water”. They’re there for a reason, so read them each time you get a new medicine.

## When something isn’t clear

Directions like “take as directed” or “take twice daily” can raise questions. Does twice daily mean morning and evening? With meals? If you’re not sure, ask us. We’d much rather answer a question than have you guess.

Also call us if your medicine looks different from last time (a new color or shape). This is often just a different manufacturer, but it’s always worth checking.
`,
  },
  {
    title: 'Storing and disposing of medicines safely',
    category: 'Safety',
    excerpt:
      'Why the bathroom cabinet is the wrong place for your medicines, how to keep them away from children, and how to get rid of old ones.',
    markdown: `
Where you keep your medicines matters. Heat, moisture and light can make some medicines less effective, and medicines left within reach are a leading cause of accidental poisoning in young children.

## Where to store them

- **Somewhere cool and dry.** Despite the name, the bathroom “medicine cabinet” is one of the worst places: the shower makes it warm and humid. A bedroom drawer or a kitchen shelf away from the stove and sink is usually better.
- **Up, away and out of sight of children.** Choose a high cabinet, ideally one that locks. Put medicines away after every use, even if you’ll need them again in a few hours.
- **In the original container.** The label tells you what the medicine is and how to take it, and child-resistant caps only work when they’re closed properly.
- **In the fridge only if the label says so.** Some medicines, such as certain liquids and injectables, need to be refrigerated. Others should never be.

Don’t share prescription medicines, even with family members who have similar symptoms.

## Getting rid of old or unused medicines

Expired or unused medicines should leave your home rather than sit in a drawer.

1. **Use a take-back option first.** Many pharmacies and police stations have drop boxes for unwanted medicines, and the DEA holds National Prescription Drug Take Back Days twice a year. Ask us about options near you.
2. **If there’s no take-back option**, most medicines can go in the household trash: mix them (don’t crush tablets or capsules) with something unappealing such as used coffee grounds or cat litter, seal the mix in a bag or container, and throw it away.
3. **Scratch out your personal information** on the label before you throw the bottle away.

A small number of medicines, such as some strong pain medicines, are on the FDA’s “flush list” because they are especially dangerous if someone else takes them. Only flush a medicine if its label or our pharmacist says to and no take-back option is available.
`,
  },
  {
    title: 'Choosing an over-the-counter pain reliever safely',
    category: 'Medication tips',
    excerpt:
      'Acetaminophen, ibuprofen, naproxen and aspirin all ease pain, but they work differently and carry different risks. Here’s what to check before you buy.',
    markdown: `
Walk down the pain relief aisle and you’ll see dozens of boxes. Most contain one of a few active ingredients, and the right choice depends on your health and the other medicines you take.

## The two main types

**Acetaminophen** (the active ingredient in Tylenol and many store brands) relieves pain and fever. It’s gentle on the stomach, but taking too much can seriously damage the liver. The risk is higher if you drink three or more alcoholic drinks a day or have liver disease.

**NSAIDs** (non-steroidal anti-inflammatory drugs) include ibuprofen (Advil, Motrin), naproxen (Aleve) and aspirin. They relieve pain, fever and inflammation. They can cause stomach bleeding, especially in people over 60, people who have had stomach ulcers, and people who take blood thinners or steroids. Ibuprofen and naproxen can also raise blood pressure and affect the kidneys, and their labels warn of an increased risk of heart attack and stroke.

## Watch for hidden doubles

Many cold, flu, sleep and allergy products also contain acetaminophen or an NSAID. Taking one of these together with a separate pain reliever can mean taking twice as much as you intended. Always check the **Active ingredients** section of the Drug Facts label on every product you use.

## Aspirin and children

Don’t give aspirin to children or teenagers who have a viral illness such as the flu or chickenpox, unless a doctor tells you to. It has been linked to Reye’s syndrome, a rare but serious illness.

## Follow the label

- Take the lowest dose that works, for the shortest time.
- Don’t take more than the label says, or take it for longer than the label says without talking to a doctor.
- Stop and get medical advice if your pain or fever gets worse or doesn’t go away in the time the label gives.

## Ask us first if you…

- are pregnant or breastfeeding,
- take a blood thinner, blood pressure medicine or any other prescription medicine,
- have kidney, liver, heart or stomach problems, or
- are buying for a child (dosing depends on weight and age).

Our pharmacist can check your other medicines and help you choose in a minute or two, at no charge.
`,
  },
  {
    title: 'Flu vaccine: what to know before flu season',
    category: 'Vaccines',
    excerpt:
      'Who should get a flu shot, when to get it, and what to expect afterward. A yearly vaccine is the best way to lower your risk of getting sick.',
    markdown: `
The flu is more than a bad cold. Every year it puts many thousands of people in the hospital. A yearly flu vaccine is the best way to protect yourself and the people around you.

## Who should get one

The CDC recommends a flu vaccine every year for almost everyone **6 months of age and older**. It’s especially important for:

- adults 65 and older,
- people who are pregnant,
- young children,
- people with long-term conditions such as asthma, diabetes, or heart or lung disease, and
- anyone who lives with or cares for someone at high risk.

## When to get it

Flu viruses change, and protection fades over time, so you need a new vaccine each season. Getting vaccinated in **September or October** is ideal, but getting it later is still worthwhile as long as flu is going around. It takes about two weeks after the shot for protection to build.

Some children aged 6 months to 8 years need two doses, four weeks apart, the first time they’re vaccinated.

## What to expect afterward

The flu shot can’t give you the flu. Common side effects are mild and usually pass within a day or two:

- a sore, red or swollen arm where the shot was given,
- a low fever, headache or muscle aches.

## Before your shot, tell us if you…

- had a severe allergic reaction to a flu vaccine before,
- have ever had Guillain-Barré syndrome, or
- are feeling unwell with a fever on the day.

Call us to check vaccine availability and whether you need an appointment.
`,
  },
]

const payload = await getPayload({ config })
const editorConfig = await editorConfigFactory.default({ config: payload.config })

const categoryIds = new Map<string, number>()
for (const c of categories) {
  const slug = slugify(c.name)
  const found = await payload.find({
    collection: 'blog-categories',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
  })
  const doc =
    found.docs[0] ?? (await payload.create({ collection: 'blog-categories', data: { ...c, slug } }))
  categoryIds.set(c.name, doc.id)
}

let created = 0
for (const p of posts) {
  const slug = slugify(p.title)
  const exists = await payload.find({
    collection: 'posts',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
  })
  if (exists.docs.length > 0) {
    payload.logger.info(`Skipped (already exists): ${p.title}`)
    continue
  }
  await payload.create({
    collection: 'posts',
    data: {
      title: p.title,
      slug,
      excerpt: p.excerpt,
      author: AUTHOR,
      status: 'draft',
      category: categoryIds.get(p.category),
      content: convertMarkdownToLexical({
        editorConfig,
        markdown: p.markdown.trim(),
      }) as Post['content'],
    },
  })
  created++
  payload.logger.info(`Created draft: ${p.title}`)
}

payload.logger.info(`Done. ${created} draft post(s) created. Review them in /admin → Blog posts.`)
process.exit(0)
