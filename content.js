(async function () {
  let totalClipped = 0;
  let attempts = 0;

  function hasError() {
    return document.querySelector('[data-testid="error-msg"]');
  }

  function clipCoupons() {
    const buttons = Array.from(document.querySelectorAll('[data-auto-data="coupon_ClipToCard"]:not(.bjs-clicked)'));
    if (!buttons.length) {
      if (attempts++ < 5) {
        console.log("No new buttons. Scrolling and retrying...");
        window.scrollBy(0, 300);
        setTimeout(clipCoupons, 1500);
      } else {
        console.log("No coupons left to clip.");
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
        console.warn("Detected error message. Reloading in 3 seconds...");
        setTimeout(() => location.reload(), 3000);
        return;
      }

      const btn = buttons[i];
      btn.click();
      btn.classList.add("bjs-clicked");
      totalClipped++;
      console.log(`Clipped ${totalClipped}`);
      setTimeout(() => clickNext(i + 1), 200);
    }

    clickNext(0);
  }

  const { isRunning } = await browser.storage.local.get("isRunning");
  if (isRunning) {
    if (document.readyState === "complete" || document.readyState === "interactive") {
      setTimeout(clipCoupons, 1500);
    } else {
      window.addEventListener("DOMContentLoaded", () => setTimeout(clipCoupons, 1500));
    }
  }

  browser.runtime.onMessage.addListener((msg) => {
    if (msg === "start-clipping") {
      clipCoupons();
    }
  });
})();