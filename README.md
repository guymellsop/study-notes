# Study Notes

Plain-HTML study site: God of War course project (WadOfGore) lessons + mock-interview gaps, each page ending in a
tap-to-reveal quiz. No build step. Open `index.html`, or serve the folder.

## Layout

- `index.html`: home, category cards with progress
- `quiz.html`: 5 random questions pulled from every page (needs http, see below)
- `<category>/index.html`: topic list; `<category>/<topic>.html`: the pages
- `assets/style.css`: all styling (light/dark via `prefers-color-scheme`)
- `assets/site.js`: `TOPICS` list, prev/next, "mark as learned" (localStorage), quiz

## Adding a page

1. Copy an existing topic page in the same category and replace the content.
2. Add one line to `TOPICS` in `assets/site.js`.
3. Add a link on the category's `index.html`.

Quiz questions are any `<details class="q">` inside `<section class="quiz">`. The quiz page finds them automatically.

## Viewing locally

Topic pages work by double-clicking. The random quiz fetches other pages, which browsers block for `file://`, so run:

```
npx serve .
```

(or `python -m http.server 8000` if Python is installed) and open the URL it prints. On GitHub Pages it just works.
