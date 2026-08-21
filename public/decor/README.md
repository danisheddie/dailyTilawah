# Decorative assets

Drop image assets here to use them in the app (e.g. background motifs,
watermarks, empty-state art). Files in `public/` are served as-is and can be
referenced from components at `/decor/<filename>`.

## Format guide

- **Line / geometric art** (stars, borders, ornaments, arches): prefer **SVG** —
  crisp at any size, tiny, and can be recolored to the theme.
- **Painterly / textured art** (mosque skylines, watercolor washes, lanterns):
  **PNG with a transparent background** (converted to WebP for delivery).
- Ship at **2× display size** or larger. One asset per file, cropped tight.
- **No white/opaque backgrounds** on anything meant to overlay a colored surface
  (e.g. the navy dock) — it must be transparent.
- Avoid JPEG (no transparency, compression artifacts).

## Naming

Use short, descriptive names: `star-mandala.svg`, `mosque-skyline.png`,
`dune-wash.png`, `corner-ornament.svg`.
