(async function () {
  let totalClipped = 0;
  let attempts = 0;

  function updateStatus(status, message = "") {
    browser.runtime.sendMessage({ type: "status", status, message }).catch(() => {});
    browser.storage.local.set({ status, message });
  }

  function sendProgress() {
    browser.runtime.sendMessage({ type: "progress", totalClipped }).catch(() => {});
    browser.storage.local.set({ totalClipped });
  }

  function hasError() {
    return document.querySelector('[data-testid="error-msg"]');
  }

  function hasCoupons() {
    return document.querySelector('[data-auto-data="coupon_ClipToCard"]');
  }

  function clipCoupons() {
    updateStatus("Clipping", "Clipping coupons...");
    const buttons = Array.from(document.querySelectorAll('[data-auto-data="coupon_ClipToCard"]:not(.bjs-clicked)'));
    if (!buttons.length) {
      if (attempts++ < 5) {
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

      if (hasError()) {
        updateStatus("Error", "Detected BJ's error. Reloading...");
        setTimeout(() => location.reload(), 3000);
        return;
      }

      const btn = buttons[i];
      btn.click();
      btn.classList.add("bjs-clicked");
      totalClipped++;
      sendProgress();
      setTimeout(() => clickNext(i + 1), 200);
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