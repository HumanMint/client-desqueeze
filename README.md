# Desqueeze App

Client-side anamorphic image desqueeze tool.

## Features

- Drag/drop or file picker input
- Preset lens ratios (1.33x, 1.5x, 1.8x, 2.0x)
- Custom ratio slider
- Local-only processing in browser
- Export PNG/JPEG/WEBP

## Run locally

```bash
python3 -m http.server 8080
```

Then open `http://127.0.0.1:8080`.

## Deploy to GitHub Pages

This repo includes a GitHub Actions workflow that deploys the static app to Pages on pushes to `main`.

After creating your GitHub repo and pushing:

1. Go to **Settings → Pages**
2. Under **Build and deployment**, set **Source** to **GitHub Actions**
3. Push to `main` (or re-run the workflow)

Your site will publish at:

`https://<your-username>.github.io/<repo-name>/`
