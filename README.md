# BJ's Auto Coupon Clipper for Firefox

This extension automatically clips all available coupons on the [BJ’s Wholesale Club](https://www.bjs.com/myCoupons) website with a single click. It's designed to save time and avoid the tedious process of manually selecting each coupon.

Built from the ground up using the WebExtension API, the project provides a clean interface, efficient automation, and full compatibility with Firefox.

---

## Features

- **One-click coupon clipping**  
  Easily activate or pause clipping from the popup menu.

- **Smart auto-scrolling**  
  Automatically scrolls to load more coupons as needed.

- **Error detection and recovery**  
  Handles common BJ’s site errors (e.g., “Please refresh”) by auto-reloading and retrying.

- **Simple and clear UI**  
  Includes a popup menu with Play/Pause control and current status.

- **Lightweight and privacy-respecting**  
  No trackers, analytics, or background connections.

---

## Installation

This extension is currently built for Firefox. You can:

### 1. Run Locally (Development Mode)

Install [web-ext](https://extensionworkshop.com/documentation/develop/web-ext-command-reference/) via npm or Homebrew:

```bash
npm install --global web-ext
# or
brew install web-ext
