# BJ's Auto Coupon Clipper for Firefox

Automatically clip every available coupon on [BJ’s Wholesale Club](https://www.bjs.com/myCoupons) with a single click.

This Firefox extension scrolls through the coupons page, clicks all “Clip to Card” buttons, and handles errors like “Please refresh” automatically. Designed for speed, reliability, and zero tracking.

---

## Install

### From Mozilla Add-ons (Recommended)

[Install from Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/bj-s-auto-coupon-clipper/)  
No setup required. Just install, visit the BJ’s coupons page, click the extension icon, and press **Start**.

> The extension will continue clipping in the background until all coupons are added.

---

## Features

- One-click control – Start/Cancel via popup
- Auto-scroll – Loads and clips all visible coupons
- Error recovery – Detects issues and refreshes the page
- Smart status – Shows Idle, Ready, Clipping, Complete
- UI-matching – Inspired by BJ’s visual theme (no logos used)
- No bloat – Lightweight, no tracking, no third-party code

---

## For Developers

If you'd like to modify or run the extension locally:

### 1. Install web-ext

```bash
npm install --global web-ext
# or
brew install web-ext
```

### 2. Clone this repo and run

```bash
git clone https://github.com/wleonhardt/bjs-coupon-clipper-ff-ext.git
cd bjs-coupon-clipper
web-ext run
```

### 3. Build

```bash
web-ext build
```

This will output a `.zip` package in the `web-ext-artifacts/` folder.

---

## How to Use

1. Navigate to [https://www.bjs.com/myCoupons](https://www.bjs.com/myCoupons)
2. Click the BJ’s Auto Coupon Clipper icon in the Firefox toolbar
3. Press **Start** – the extension will start clipping all visible coupons
4. You can pause anytime

---

## Attribution

Inspired by [Sleevetrick's BJ’s Coupon Clicker script](https://greasyfork.org/en/scripts/424555) and early Chrome automation projects. This is a full rewrite built for Firefox using modern WebExtension APIs.

---

## License

Mozilla Public License 2.0 — see [LICENSE](LICENSE)
