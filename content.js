// content.js

(async function () {
  let totalClipped = 0;
  let attempts = 0;
  let maxRetries = 5;

  function updateStatus(status, message = "") {
    browser.runtime.sendMessage({ type: "status", status, message }).catch(() => {});
    browser.storage.local.set({ status, message });
  }

  function sendProgress() {
    browser.runtime.sendMessage({ type: "progress", totalClipped }).catch(() => {});
    browser.storage.local.set({ totalClipped });
  }

  function hasCoupons() {
    return document.querySelector('[data-auto-data="coupon_ClipToCard"]');
  }

  function clipCoupons() {
    updateStatus("Clipping", "Clipping coupons...");
    const buttons = Array.from(document.querySelectorAll('[data-auto-data="coupon_ClipToCard"]:not(.bjs-clicked)'));

    if (buttons.length === 0) {
      if (attempts++ < maxRetries) {
        window.scrollBy(0, 300);
        setTimeout(clipCoupons, 1500);
      } else {
        updateStatus("Complete", "✅ All coupons clipped.");
      }
      return;
    }

    attempts = 0;

    function clickNext(i) {
      if (i >= buttons.length) {
        setTimeout(clipCoupons, 1000);
        return;
      }

      const btn = buttons[i];

      try {
        btn.click();
        btn.classList.add("bjs-clicked");
        totalClipped++;
        sendProgress();
      } catch (err) {
        updateStatus("Error", "Coupon clipping failed. Reloading...");
        setTimeout(() => location.reload(), 3000);
        return;
      }

      setTimeout(() => clickNext(i + 1), 250);
    }

    clickNext(0);
  }

  function determineInitialStatus() {
    const isBJsSite = window.location.href.includes("bjs.com/myCoupons");
    if (!isBJsSite) {
      updateStatus("Idle", "Not on BJ's website.");
    } else if (hasCoupons()) {
      updateStatus("Ready", "");
    } else {
      updateStatus("Ready", "");
    }
  }

  const { isRunning } = await browser.storage.local.get("isRunning");

  if (isRunning) {
    updateStatus("Clipping", "Clipping coupons...");
    if (document.readyState === "complete" || document.readyState === "interactive") {
      setTimeout(clipCoupons, 1500);
    } else {
      window.addEventListener("DOMContentLoaded", () => setTimeout(clipCoupons, 1500));
    }
  } else {
    determineInitialStatus();
  }

  browser.runtime.onMessage.addListener((msg) => {
    if (msg === "start-clipping") {
      totalClipped = 0;
      updateStatus("Clipping", "Clipping coupons...");
      clipCoupons();
    }
  });
})();