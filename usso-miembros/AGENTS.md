# Mobile Prototype Agent Guide

## Prototype Instructions

In ChatGPT Work Mode, run `sites-preview start "$PWD"`, open `http://terminal.local:4173/` in the cloud browser, and verify the rendered app and its primary interactions. Keep that preview open and tell the user to inspect it in the cloud browser; do not present the local URL as a user-facing chat link. In Codex Desktop, run the local server yourself, open the preview in the in-app browser, and provide the clickable local URL. Do not deploy to Sites unless the user explicitly asks to share, publish, or deploy. Do not give the user server-start instructions when you can run it.

Before planning or implementing any mobile-app change, read this `AGENTS.md` in full. It is the source of truth for the template's runtime and component guidance.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

## Editing Boundary

- Build app-specific UI in `src/Prototype.tsx` and `src/prototype.css`.
- Treat `src/App.tsx`, `src/main.tsx`, `src/styles.css`, `src/mobile/`, `public/assets/iphone/`, `public/assets/android/`, `public/assets/status/`, `vite.config.ts`, `worker/index.js`, and `scripts/prepare-sites-build.mjs` as protected runtime files. Do not edit, replace, remove, or recreate them unless the user explicitly asks to change the mobile runtime itself. For an explicit runtime change, update the affected lock hashes only after verifying the new runtime behavior.
- Run `npm run check:runtime` before preview or handoff. If it fails, restore the protected runtime instead of weakening or bypassing the check.
- `npm run build` preserves the mobile runtime and prepares the static Cloudflare Worker output required by Sites. Before a Sites handoff, confirm `dist/client/index.html`, `dist/server/index.js`, `dist/.openai/hosting.json`, and source `.openai/hosting.json` exist, then run `npm run test:sites`. Do not replace this project with a Vinext starter.

## Runtime Contract

- Preserve the mobile device runtime unless the user's task explicitly asks otherwise. Do not replace it with a standalone page. Visual fidelity applies to app-owned content inside the device screen, not to template-owned device chrome.
- Keep `App` composed around `PhoneFrame` -> `KeyboardProvider`, with `StatusBar`, app content, `HomeIndicator`, and `KeyboardDock` mounted inside the phone frame. `StatusBar` and the iOS home indicator are overlaid device chrome. When the Android keyboard is closed, the app viewport reserves the protected navigation-bar region instead of painting behind it. When the Android keyboard is open, preserve the current full-screen keyboard layout: its asset includes the IME navigation strip and the separate black navigation bar is hidden. iOS screens continue to paint behind the home-indicator area and own their safe-area content padding.
- Preserve the `iPhone` / `Pixel 10` device picker and both calibrated device presets. The Pixel screen is `427 x 952`; its `32 x 32` camera circle and `public/assets/android/navigation-bar.svg` bottom navigation bar are protected device chrome, not app content.
- Preserve the device picker's intentionally lightweight Codex styling in the top-right corner: its trigger wrapper is borderless and transparent, its trigger sizes to content, and its right-aligned menu uses the compact 3px inset plus the specified hairline and elevation shadow layers. Keep the prototype root and default app screen white.
- Preserve `StatusBar` as live device chrome, including its platform-specific typography, source status-icon assets, and spacing. Pixel 10 uses Roboto, Android indicators, and 32px top, left, and right padding. iPhone uses its iOS indicators, system typography, and calibrated spacing. Do not hardcode screenshot times like `9:41` into the status bar, replace its real-time clock, or move status bar content into app markup unless the user explicitly asks for a fixed/mock device time.
- `PhoneFrame` owns the calibrated device frame, screen portal, device picker, camera cutout, and custom cursor. Keep device assets in `public/assets/iphone/` and `public/assets/android/`; if an asset fails to load, repair the asset path or restore the asset instead of removing the frame, keyboard, or image render.
- Use `MobileScroll` directly for simple single-screen prototypes. Use `FlowStack` for conventional multi-screen flows whose routes can own their fixed header and footer; when using it, define each route as a `FlowScreen`: `{ id, header?, headerHeight?, footer?, footerHeight?, render }`, and use `flow.push(screen)`, `flow.pop()`, and `flow.replace(screen)` from `FlowStack` render callbacks or `useFlow()` instead of introducing another router.
- Use `Carousel` for a carousel, horizontal rail, swipeable cards, image or media strip, horizontally scrollable cards, chip rail, or other horizontal collection.
- For a layered app shell—such as a persistent composer, independently presented sheet, pushed/peek sidebar, or app-wide transition—compose directly in `Prototype.tsx` rather than forcing it through `FlowStack`. Keep app-owned fixed chrome as sibling layers outside `MobileScroll`.
- When using `FlowScreen`, put route-owned fixed headers or footers in `FlowScreen.header` or `FlowScreen.footer`. Set `headerHeight` to the visible app-toolbar height; `FlowStack` adds the device's top safe-area/status-bar inset automatically. Do not include `StatusBar` or its height in the header. Set `footerHeight` to the full app-footer height. `FlowScreen.footer` is an overlay, not reserved layout space; screens using it must add their own bottom content padding such as `padding-bottom: calc(var(--flow-footer-height) + var(--mobile-safe-area-height) + 24px)` so final content can scroll above the footer while still painting behind it.
- Render only scrollable content inside `MobileScroll`; it is for content that should move with scroll and rubber-band overscroll. Keep app-owned headers, nav bars, tabs, composers, and overlays outside it. This keeps scroll physics, safe areas, keyboard insets, scrollbars, and drag click suppression active without letting content paint under fixed chrome.
- Buttons, links, cards, and images inside `MobileScroll` should still allow drag scrolling when the pointer moves beyond tap slop. Use `data-scroll-drag="ignore"` only for rare controls that must own the drag gesture themselves.
- Do not add `var(--keyboard-height)` to ordinary screen/content padding inside `MobileScroll`; the scroll viewport already shrinks above the simulated keyboard. For custom fixed composers, search bars, or toast chrome, use `useKeyboardInsets().bottomInset`. It is relative to the app viewport: Android returns `0` while the closed-keyboard viewport already reserves navigation, then returns the keyboard height while open; iOS continues to clear the home indicator while closed and ride directly above the keyboard while open. Do not pin custom bottom chrome to `bottom: 0` or only `keyboardHeight`.
- Use `KeyboardInput`, `KeyboardTextarea`, or `MobileTextField` for every text-entry control. A raw `input` or `textarea` disconnects focus, keyboard animation, safe-area insets, and attached surfaces.
- Use `BottomSheet` for phone-scoped sheets. Its props are `open`, `onOpenChange`, `title`, optional `description`, optional `snap`, and `children`; it renders through the phone screen portal and dismisses the keyboard before opening.

## Horizontal Carousels

- Use `Carousel` for horizontally draggable cards, images, media, chips, or other horizontal collections. Do not recreate these with `overflow-x`, custom pointer handlers, or a generic div.
- `Carousel` can be nested directly inside `MobileScroll`. It owns horizontal gestures and automatically yields vertical gestures to the parent.
- Never put `data-scroll-drag="ignore"` on or around a `Carousel`; doing so prevents vertical parent scrolling when a gesture begins inside it.
- Do not add CSS scroll snapping to `Carousel`; its runtime owns momentum and release motion.
- Use `data-scroll-drag="ignore"` only when a control must prevent parent scrolling in every drag direction.

See `src/mobile/COMPONENTS.md` for the full component and gesture contract.

## Keyboard Rule

The simulated keyboard is a separate top-layer component. Before presenting anything that behaves like iOS navigation or modal UI, dismiss it first.

Call `keyboard.hide()` before:

- pushing, popping, or replacing FlowStack routes
- opening bottom sheets, action sheets, dialogs, menus, or navigation sheets
- starting transitions where the destination should not inherit text-input focus

`FlowStack` already hides the keyboard for `push`, `pop`, and `replace`. `BottomSheet` already hides it before opening. If you add new modal/sheet/navigation primitives, follow the same rule.

When a composer, search surface, or other keyboard-attached component closes, call `keyboard.hide()` in the same event before changing that component's open state. Position attached surfaces from `useKeyboardInsets()` rather than a separate timer or visibility flag so both dismiss together.

When any text-entry control loses focus, dismiss the simulated keyboard. If the control is custom or does not use the runtime's keyboard-aware fields, handle its blur event and call `keyboard.hide()` explicitly. Keep the keyboard open only when focus is moving directly to another text-entry control that should share the same keyboard session.

## Interaction Rules

- Do not trigger buttons or inputs after a pointer has become a drag. Preserve the drag suppression behavior in `MobileScroll`.
- Do not allow native browser image/file dragging inside the phone frame. Preserve the phone-level `dragstart` suppression and non-draggable image styles so scroll drags that begin on images still scroll the prototype.
- Use `KeyboardInput`, `KeyboardTextarea`, or `MobileTextField` for text entry so the simulated keyboard and safe-area insets stay connected.
- Fixed phone chrome should not animate with pushed screens. Screen content can animate; the status bar, camera cutout, and preview chrome should stay put.
- Keep the keyboard below the home indicator/safe area layer in z-index, and above ordinary app UI while visible.
- Keep the home indicator as the topmost safe-area layer in the z-index above everything else in the prototype.

## USSO member experience
Selected source: ../output/member-experience-2026-10-31/inicio-miembros-promociones-v4.png. Only the new private member experience is in scope; do not alter public production pages. Preserve dark charcoal/gold, soft glow on Pujar, original logo and documentary photos. Five tabs: Inicio, Subastas, Mis pujas, Calendario, Cuenta. Public-cover promotion appears as a small rounded card inside the private home, with PREPARA TU OFERTA. Main bid opens amount entry then explicit confirmation. Demo is simulated with no live bids or auth. Keep services behind a typed adapter for later integration. Lists remain vertical. A single campaign needs no carousel or decorative pagination. Follow root carousel rules if a real carousel is later added.

## Accepted integration (31 October 2026)
The user approved connecting their real USSO account locally, with publication deferred. Add a native web entry for the existing site and real backend adapter; preserve the separate framed demo. Native entry omits simulated phone/keyboard because it is the actual local web experience. Use existing auth, tables and RPCs; never submit real bids during agent QA. Preserve public visuals and carousel behavior. Keep local integration routing separate from production until publication is requested.

## Home fallback (31 October 2026)
When no active personal bid is featured, show the earliest upcoming auction as a full photo card with actual title, base price, start date and detail/calendar actions. Do not replace available upcoming lots with a generic empty message. Order upcoming auctions chronologically; do not duplicate the featured lot in the secondary list.

## Shared lot gallery (31 October 2026)
All lot details, including won/lost, use the same complete media gallery. Preserve all backend evidence and add a cover if missing from media_urls; deduplicate identical URLs. Never fabricate photos for old lots with no evidence. Use one circular selection with three virtual neighbors, one step per swipe, and no link activation after drag. The native integration uses the app-owned Carousel in LotGallery.tsx because the protected simulator Carousel is a free-scrolling rail without a discrete circular mode. Keep the simulator runtime unchanged. Photos and videos share the logical counter; closed lots do not hide media. Lists stay vertical.

Gallery media must stay fully visible at its original aspect ratio, centered with dark letterboxing as needed. The photo/link box must remain constrained to the slide height; do not let intrinsic image size expand a grid row beyond the viewport.

## Swipe-first presentation (31 October 2026)
Lot photos have no enclosing card border, rounded frame or contrasting panel. Preserve full-image contain framing. Touch swipe, mouse drag (including slow drags) and horizontal trackpad gestures navigate one item per gesture; vertical gestures scroll the page. Show a subtle swipe hint and counter, with previous/next controls only revealed on keyboard focus. Disable native link dragging so it cannot interrupt carousel capture.

## Live room preview (31 October 2026)
User requested a preview of an immersive live auction room with one principal Pujar action and visible bid activity. App-owned LiveRoomPreview renders in the approved native entry at ?preview=sala; it must not initialize the real account adapter or submit real bids. Clearly label simulated activity, show exact demo amount before confirmation, retain dark/gold branding and original logo. Keep the real member home and framed runtime unchanged.

## Connected live room (31 October 2026)
User approved adapting the room to the local account website. Native #sala/<lotId> routes use the real listing current_price as the large price, refreshed on listing/bid events and every 3 seconds, with no simulated activity. Keep ?preview=sala isolated. New highest offers update price, next minimum and leading state together; invalidate an outstanding confirmation on price/revision changes. Block stale/disconnected, unauthorized, upcoming, closed and already-leading bids. Never submit a real bid during QA. Show only observed price changes as updates since entering, without inventing participant identities or historical bids. Publication remains deferred.

## Dramatic auction endings (31 October 2026)
At zero, use a full-screen theatrical ending: gold trophy, spotlights, finite confetti for the confirmed winner; muted rose lights and clear respectful loss copy for participants who lost. Keep original USSO branding, full contained lot photo and actual final amount. The clock or leading status cannot declare a winner: require server closed/sold status and winner identity for the current round. While awaiting it, show a closing/pending state and keep refreshing. Nonparticipants get a neutral ending. Respect reduced motion, avoid rapid flashing and automatic sound, and keep navigation accessible. Preview links ?preview=sala&final=won or lost close after four seconds with simulated outcomes only.

## Ending presentation and results journey (31 October 2026)
Center the celebration as a single block vertically and horizontally, with balanced header/footer space. After 8 seconds, automatically replace the confirmed winner/loser celebration with a lasting results screen; allow an immediate “Ver resultado” skip. Pending confirmation never auto-advances. Results show the actual lot, outcome and prices plus “Ver próximas subastas” (filtered upcoming route #subastas/proximas) and “Regresar al inicio”. Preserve demo labeling and never present demo outcomes as saved account results.

## Result hierarchy refinement (31 October 2026)
Winner result remains dramatic after the celebration: large gold victory headline, spotlights, won-lot seal and highlighted winning amount. Losing result uses a calm charcoal layout with unambiguous “No ganaste este lote”, prominently labeled final auction price and a separate smaller personal offer. Both results feature a large fully contained product photo instead of a thumbnail, and retain upcoming-auctions/home navigation. Keep the centered timed celebration and confirmed-result logic intact.

## Distinct losing result (31 October 2026)
Latest feedback supersedes the calm losing-page direction: make the loss as visually distinctive as the winner result. Use a prominent “NO GANASTE ESTE LOTE” headline, burgundy/rose spotlights, a NO GANADO seal and clear separation of final price from the user's last offer. Keep the large contained photo, original logo, respectful language, navigation and confirmed-outcome logic. Do not invent participant identities or encourage chasing a loss.

The losing results page must center its complete header/content/actions group vertically and horizontally in the viewport. Do not stretch the content to push the actions to the bottom. When the group exceeds a short viewport, retain top-to-bottom scrolling so nothing is clipped or unreachable.

Center the “Ver próximas subastas” button label within the full button width on result pages; keep the arrow independently aligned to the right.

## Calendar distinction (31 October 2026)
The calendar includes all active/upcoming scheduled lots as well as saved lots and past personal participation. Clearly distinguish saved auctions in gold with bookmark markers and “Guardada por ti” labels, versus other scheduled auctions in soft blue with dots and “Programada” labels. Mixed days display both markers; selecting a day shows each lot once, saved first, with both start and close times if they fall on that day. Preserve personal participation labels and existing saved-state persistence.

## Informational promotion destination (31 October 2026)
The home USSO cover promotion now has a single arrow instead of “Ver próximas subastas”. It opens /nosotros.html, a public information page about USSO, its more than 25 years of experience, financing and contact, with no auction listings. Use the existing original-page information and branding, and provide a return to /miembros/#inicio. Auction activity remains in the members experience. This supersedes the earlier PREPARA TU OFERTA campaign copy; use CONOCE USSO to make the destination clear. Publication is still deferred.

## Mobile review preference (31 October 2026)
All ongoing work targets mobile first. Show review previews inside the existing calibrated phone frame by default. `?preview=web` renders the actual local 4173 site inside an app-owned iframe, preserving the protected runtime and avoiding an outdated parallel mock. Provide shortcuts for members home, calendar, company information and workshop videos. Keep the account session and internal navigation within the phone. Label this connected preview as a real account.

## Publication approval (31 October 2026)
The user explicitly requested publication of the approved mobile member experience to the existing USSO website. This supersedes earlier local-only/publication-deferred instructions. Publish the native member entry on /miembros/, preserving existing accounts, backend policies, public visuals and the separate local phone preview. Build with build:release to exclude the simulated live-room entry from production.
