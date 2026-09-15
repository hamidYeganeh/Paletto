# Gallery of Light

A walkable Three.js reconstruction of the gallery reference image, with a central display partition, clerestory windows, concrete floor, oak bench, sculpture plinth, and open courtyard. The visible composition follows the reference; dimensions and unseen sides are authored approximations, not a measured architectural survey or pixel-identical photoreal render.

## Routes

- `/gallery/light`: direct, standalone entry; no database needed.
- `/gallery/demo`: opens this gallery by default.
- `/gallery/demo?gallery=<id>`: retains the existing catalog-backed `VirtualGallery`.

## Interaction

The default scroll tour follows a collision-free route around the partition and into the courtyard. Mouse wheel / vertical phone swipes move forward or backward; horizontal phone swipes turn the view. The Free walk mode retains drag-to-look and touch direction controls. WASD/arrows always take manual control; Q/E turn. Acceleration, braking and look use time-based exponential damping, disabled when reduced motion is requested. Click an artwork, or aim at one and press Enter, to inspect it. Escape closes the artwork or releases keyboard navigation. Touch buttons support capture, cancellation and blur without stuck movement. The collection lists every work, offers safe fixed viewpoints, and provides an accessible fallback when WebGL is unavailable. The courtyard is reachable through the rear-right opening.

Every pagination page is the same room containing the next ten artworks. The final room can contain fewer than ten, without duplicates or padding. Only the current page is loaded into WebGL, and its resources are released on page changes. The footer provides previous/next rooms, a room selector and the artwork range. `initialWorks` can supply a larger collection; the default collection currently has ten works. Personal JPEG/PNG/WebP/AVIF images append to the collection and create additional rooms automatically. Files are validated as decodable images and limited to 12 MB each. Object URLs are local to the tab, never uploaded or persisted, and are revoked at unmount. Artwork details for existing catalog samples link to their existing routes.

## Files

- `scene.ts`: rendering, materials, lights, artwork raycasting with wall occlusion, scene lifecycle and input.
- `layout.ts`: metre-based obstacle rectangles and substepped wall sliding.
- `navigation.ts`: ten-work page slices, distance-based tour sampling and frame-rate-independent damping.
- `works.ts`: local artwork sources and reference-image UV crops; no external image requests needed.
- `LightGallery.tsx`: responsive controls, native dialog, local image loading and WebGL fallback.
- `light-gallery.module.css`: scoped Persian UI; respects reduced motion and the existing project's light theme.

Keep collision rectangles and visible furniture geometry in sync when changing layout. Each room has ten artwork slots; the collection spans as many rooms as needed. Viewpoints teleport to free positions instead of flying through walls. The camera uses a fixed eye height. The renderer caps device pixel ratio, renders only when dirty, pauses when overlays or hidden tabs suspend navigation, and disposes GPU resources and event listeners on unmount.

## Reference asset

`public/images/light-gallery/reference.png` was produced with the built-in image generation tool for this task. It is used as a reference and as UV-cropped textures on the initial contemporary artworks. The other artworks reuse the project's existing assets. Full generation prompt:

> Use case: stylized-concept. Asset type: architectural website hero, wide landscape 16:9. Photorealistic architectural concept of a serene contemporary art gallery: spacious rectangular main gallery approximately 14 x 12 metres and 4.5 metre high ceiling, warm white plaster walls, matte pale concrete floor, a freestanding white display wall with one large muted burgundy abstract canvas, two smaller monochrome works, an oak bench, a sculptural stone plinth. North-facing high clerestory windows cast soft filtered daylight. Deep rectangular opening at the far right reveals a small planted courtyard and tree. Restrained contemporary museum architecture, tactile materials, quiet editorial photography, subtle warm daylight and natural shadows, perspective with strong depth, 24mm architectural lens, eye level, no people, no text, no logos, no watermark. This is a mood illustration, not a technical representation of a measured model.

## Verification

Run `npm run typecheck --workspace web` and lint the new feature and routes. `apps/web/tests/browser/light-gallery.spec.ts` covers artwork ray selection, modal navigation and focus restoration, collision and blur, mobile touch cancellation, local image lifetime, and a forced WebGL-unavailable fallback. Legacy gallery tests target `?gallery=demo-white` to continue testing the original catalog gallery. Browser tests also cover disjoint 10/10/1 rooms, reversed phone swipes, independent panel scrolling and reduced-motion touring. Navigation tests sample the entire route for collisions and compare smoothing at 30/60 fps. Browser tests use the repository's Playwright/Chrome setup.
