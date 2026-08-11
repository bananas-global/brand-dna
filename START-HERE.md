# Start here

This template turns a short brief—and whatever brand material already exists—into one usable Brand DNA.

## 1. Add what you have

Drop websites, decks, PDFs, logos, screenshots, images, or notes into `references/`. Leave the folder empty if you are starting from zero.

## 2. Start the builder

Open the project in Codex and send:

> Use $brand-dna-builder to build my Brand DNA.

The builder detects the available material automatically. There is no setup mode to choose.

## 3. Answer eight short questions

1. What does the brand offer?
2. Who is it for?
3. What perception should it build?
4. Which three characteristics should define it?
5. What must it never feel like?
6. How should it speak?
7. Which visual references feel relevant?
8. Where will the identity be used most?

Questions already answered by reliable references are skipped.

## 4. Review the result

The builder updates `public/brand/brand-dna.json`. The website reads that file directly and shows the result as a navigable Brand DNA.

Every field is treated as **evidence**, **decision**, **proposal**, or **missing**, so an AI recommendation never silently becomes a brand fact.

To view it:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.
