repo: MarDelToro/USSO-TractoPartes-Web
branch: main
path: (repo root)

## Last sync
date: 2026-08-16T01:23:42Z
commit: (unknown — user uploads manually via GitHub web UI/Desktop, not synced by this tool)

### Updated in this project
- Fixed missing homepage file (usso-tractopartes.dc.html) causing infinite load on the live domain — it had never been pushed to the repo
- Unified all cross-page links to one lowercase filename (was mixing "USSO Tractopartes.dc.html" and "usso-tractopartes.dc.html", breaking navigation)
- Extracted photos that only lived in the local hidden state file (motores, cortes, auction lots 1-3, transmisiones, diferenciales) into real assets/ files so they persist on GitHub
- Added src fallbacks to Subasta.dc.html lot images
- Site deployed live on Netlify (guileless-jelly-5a3a10.netlify.app) with custom domain ussotractopartes.com connected

## Screen map
| Screen | Repo file(s) |
|---|---|
| Redirect entry | index.html |
| Home / landing | usso-tractopartes.dc.html |
| Category catalog | Catalogo.dc.html |
| Product detail | Producto.dc.html |
| Auction lot detail | Subasta.dc.html |
| Video gallery | Videos.dc.html |
