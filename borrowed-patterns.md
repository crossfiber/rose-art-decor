# Borrowed patterns

Everything here came from `builda-v7/builda-mechanics.md`, the brand-free code library. No full
reference build was opened for this project. The bilingual toggle would normally have routed to
`excellent-income-tax/index.html`, but the mechanic needed here is a full-site attribute-driven
language engine across nine pages rather than a two-block content toggle, so it was written fresh
and is contributed back below.

---

## 1. Page boot, scroll restoration and hash strip
*mechanics.md section 1, lines 11-17. Landed in `assets/site.js` lines 9-16.*

```js
if ('scrollRestoration' in history) { history.scrollRestoration = 'auto'; }
(function () {
  if (window.location.hash && !document.querySelector(window.location.hash)) {
    history.replaceState(null, '', window.location.pathname);
  }
```
Re-skin: none needed, this is invisible. One change from the library version: the hash is only
stripped when it does not resolve to a real element, because this site has nine pages linking into
`../#quote` and a blanket strip would break those inbound anchors.

## 2. Mobile drawer
*mechanics.md section 2, lines 22-52. Landed in `assets/site.js` section 2 and `site.css` `.drawer`.*

Taken wholesale including the `drawer-open` body scroll lock, the escape key, the aria wiring and the
rule that the trigger and the close X are never visible together.

Re-skin: the drawer is cream rather than white, links are 1.5rem Cormorant Garamond with a gold Font
Awesome glyph in a fixed 20px gutter, and the drawer footer holds the quote CTA plus an Instagram DM
pill, since there is no phone number to put there.

## 3. Anchor smooth scroll with hash strip
*mechanics.md section 3, lines 57-72. Landed in `site.js` section 3, `site.css` `html`.*

```css
html { scroll-padding-top: calc(var(--nav-h) + 22px); }
```
`--nav-h` is redefined at the 640px breakpoint so the padding follows the shorter mobile nav.

## 4. Accordion, single open, max-height, resize resync
*mechanics.md section 4, lines 78-103. Landed in `site.js` section 4, used on the home FAQ and all
eight service page FAQs.*

Re-skin: gold plus sign rotating 45 degrees, hairline rules, Cormorant heads. One addition beyond the
library version: `resyncAccordion()` is also called by the language engine, because an open Spanish
panel is taller than the English one it replaced and the stored max-height goes stale the same way it
does on resize.

## 5. Form UX, novalidate plus branded errors plus error clearing
*mechanics.md section 6, lines 135-149. Landed in `site.js` section 6.*

```html
<form id="quoteForm" novalidate>
```
Errors are in the site's voice and bilingual, for example "That looks incomplete. Try something like
you@email.com." and "Roughly is fine. Measure to the top of the tree, not the topper." Validation
marks `.field.err`, scrolls the first failure into the centre of the viewport and focuses it.

## 6. CTA to form intent routing
*mechanics.md section 7, lines 155-168. Landed in `site.js` section 3.*

Adapted: the library version matches on `o.text`, which breaks the moment the option text is swapped
into Spanish. This build matches on `o.value` instead, since values stay in English as the canonical
key. Every `data-want` CTA across all nine pages presets `#f-service`.

## 7. Card grid with bottom aligned CTAs
*mechanics.md section 8, lines 173-176. Landed in `site.css` `.card`.*

Verified live: all three service cards measure 531px tall with the "See the service" link at the same
482px offset. No CTA staircase.

## 8. Horizontal carousel, scroll snap
*mechanics.md section 5, lines 110-130. Landed in `site.css` at the 640px breakpoint.*

Used twice on mobile only: the gallery rail and the services rail. The library's arrow buttons were
dropped because both rails are touch-only surfaces below 640px, and the library's `flex: 0 0 78%`
peek ratio was kept exactly.

Why: the stacked gallery was 3,141px tall on a 390px screen on its own. The rail took the page from
17.1 swipes to 12.8.

## 9. Mobile grid compression
*mechanics.md section 9, lines 181-184. Landed in `site.css` 640px breakpoint.*

Process steps compress 4-across to 2x2, form grid to one column, footer to two columns. The service
cards became a rail instead of a 2-up grid specifically because three cards in a two column grid
leaves an orphan row, which the card quality standards forbid.

## 10. JSON-LD skeletons
*mechanics.md section 11, lines 192-205.*

LocalBusiness on the home page with `hasOfferCatalog`, FAQPage on all nine pages, plus Service and
BreadcrumbList on each service page. `aggregateRating` deliberately absent: no rating is published
anywhere for this business, and the library note says never invent one.

---

## Contributed back to the library

Two mechanics from this build are worth genericizing into `builda-mechanics.md`:

### A. Attribute-driven bilingual engine

Every text node carries `data-en` / `data-es`; placeholders `data-en-ph` / `data-es-ph`; aria labels
`data-en-aria` / `data-es-aria`; a bare `data-html` flag switches the swap from `textContent` to
`innerHTML` for nodes containing markup. The `<html>` element carries `data-title-en/es` and
`data-desc-en/es` so the document title and meta description swap with the page. First visit reads
`navigator.language`, `?lang=xx` overrides, choice persists in localStorage, and any open collapse
panel is re-measured after each swap.

The part that is easy to miss and matters: **anything measured in pixels must be re-measured after a
language swap**, because the new copy is a different length.

### B. Posting a native form into an existing Google Form

Lets a client keep the responses sheet and notifications they already use, while the site gets a form
that matches the brand.

1. Fetch the form's public HTML and parse `FB_PUBLIC_LOAD_DATA_` out of it. Walk `d[1][1]` to recover every field's `entry.NNNN` id, its type, whether it is required, and for choice fields the **exact option strings**, which must be sent back verbatim.
2. Build a `URLSearchParams` body of `entry.NNNN=value` pairs plus `fvv=1`, `pageHistory=0`, `submit=Submit`.
3. `fetch(url + '/formResponse', { method: 'POST', mode: 'no-cors', body })`. The response is opaque, so treat resolution as success.
4. Fall back to building a hidden form targeting a hidden iframe and submitting it, for browsers where the fetch is blocked.

Caveats worth writing into the library entry: if the Google Form has "collect email address, verified"
switched on it will reject anonymous posts, so the integration has to be tested with one real
submission before handover. Fields that are required on the Google Form must always be sent, even when
the site hides them, which is why this build sends the sourcing answer as the "I will provide
everything" option whenever the client says they already own their decorations.
