(async function () {
  let totalClipped = 0;
  let attempts = 0;
  let maxRetries = 5;
  const VALIDATION_KEY = "bjs_validation_reload";

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

  function validateCompletion() {
    sessionStorage.setItem(VALIDATION_KEY, "true");
    location.reload(); // Will re-run script after reload
  }

  function finalizeCompletion() {
    updateStatus("Complete", "✅ All coupons clipped.");
    sessionStorage.removeItem(VALIDATION_KEY);
  }

  function clipCoupons() {
    updateStatus("Clipping", "Clipping coupons...");
    const buttons = Array.from(document.querySelectorAll('[data-auto-data="coupon_ClipToCard"]:not(.bjs-clicked)'));

    if (buttons.length === 0) {
      if (attempts++ < maxRetries) {
        window.scrollBy(0, 300);
        setTimeout(clipCoupons, 1500);
      } else {
        validateCompletion(); // Refresh to double-check
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
      setTimeout(() => {
        const wasValidation = sessionStorage.getItem(VALIDATION_KEY);
        if (wasValidation) {
          // This is a post-reload validation
          if (hasCoupons()) {
            updateStatus("Clipping", "Found more after refresh, continuing...");
            clipCoupons();
          } else {
            finalizeCompletion();
          }
        } else {
          clipCoupons();
        }
      }, 1500);
    } else {
      window.addEventListener("DOMContentLoaded", () => {
        const wasValidation = sessionStorage.getItem(VALIDATION_KEY);
        if (wasValidation) {
          if (hasCoupons()) {
            updateStatus("Clipping", "Found more after refresh, continuing...");
            clipCoupons();
          } else {
            finalizeCompletion();
          }
        } else {
          clipCoupons();
        }
      });
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