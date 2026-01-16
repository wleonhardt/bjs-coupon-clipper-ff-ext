(async function () {
  let totalClipped = 0;
  let attempts = 0;
  const maxRetries = 5;
  const COUPON_SELECTOR = '[data-auto-data="coupon_ClipToCard"]';
  const VALIDATION_KEY = "bjs_validation_reload";
  let stopRequested = false;
  let isClipping = false;

  function updateStatus(status, message = "") {
    browser.runtime.sendMessage({ type: "status", status, message }).catch(() => {});
    browser.storage.local.set({ status, message });
  }

  function sendProgress() {
    browser.runtime.sendMessage({ type: "progress", totalClipped }).catch(() => {});
    browser.storage.local.set({ totalClipped });
  }

  function getUnclickedButtons() {
    return Array.from(document.querySelectorAll(`${COUPON_SELECTOR}:not(.bjs-clicked)`));
  }

  function hasUnclickedCoupons() {
    return getUnclickedButtons().length > 0;
  }

  function validateCompletion() {
    sessionStorage.setItem(VALIDATION_KEY, "true");
    location.reload(); // Will re-run script after reload
  }

  function finalizeCompletion() {
    updateStatus(STATUS.COMPLETE, "");
    sessionStorage.removeItem(VALIDATION_KEY);
  }

  function waitForNewCoupons(timeoutMs) {
    return new Promise((resolve) => {
      let resolved = false;
      const timer = setTimeout(() => {
        cleanup();
        resolve(false);
      }, timeoutMs);

      const observer = new MutationObserver(() => {
        if (hasUnclickedCoupons()) {
          cleanup();
          resolve(true);
        }
      });

      function cleanup() {
        if (resolved) return;
        resolved = true;
        clearTimeout(timer);
        observer.disconnect();
      }

      observer.observe(document.body, { childList: true, subtree: true });
    });
  }

  async function isStillRunning() {
    if (stopRequested) return false;
    const { isRunning } = await browser.storage.local.get("isRunning");
    return Boolean(isRunning);
  }

  async function clipCoupons() {
    if (!(await isStillRunning())) {
      updateStatus(STATUS.IDLE, "Stopped.");
      return;
    }

    updateStatus(STATUS.CLIPPING, "Clipping coupons...");
    const buttons = getUnclickedButtons();

    if (buttons.length === 0) {
      if (attempts++ < maxRetries) {
        window.scrollBy(0, 600);
        await waitForNewCoupons(1500);
        return clipCoupons();
      }
      validateCompletion(); // Refresh to double-check
      return;
    }

    attempts = 0;

    for (const btn of buttons) {
      if (!(await isStillRunning())) {
        updateStatus(STATUS.IDLE, "Stopped.");
        return;
      }

      try {
        btn.click();
        btn.classList.add("bjs-clicked");
        totalClipped++;
        sendProgress();
      } catch (err) {
        updateStatus(STATUS.ERROR, "Coupon clipping failed. Reloading...");
        setTimeout(() => location.reload(), 3000);
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    await new Promise((resolve) => setTimeout(resolve, 800));
    return clipCoupons();
  }

  function determineInitialStatus() {
    const isBJsSite = window.location.href.includes("bjs.com/myCoupons");
    if (!isBJsSite) {
      updateStatus(STATUS.IDLE, "Not on BJ's website.");
    } else if (hasUnclickedCoupons()) {
      updateStatus(STATUS.READY, "");
    } else {
      updateStatus(STATUS.READY, "");
    }
  }

  const { isRunning = false, totalClipped: storedTotalClipped = 0 } = await browser.storage.local.get([
    "isRunning",
    "totalClipped"
  ]);

  totalClipped = Number.isFinite(storedTotalClipped) ? storedTotalClipped : 0;

  if (isRunning) {
    updateStatus(STATUS.CLIPPING, "Clipping coupons...");

    const startClippingIfReady = () => {
      setTimeout(() => {
        const wasValidation = sessionStorage.getItem(VALIDATION_KEY);
        if (wasValidation) {
          // This is a post-reload validation
          if (hasUnclickedCoupons()) {
            updateStatus(STATUS.CLIPPING, "Found more after refresh, continuing...");
            if (!isClipping) {
              isClipping = true;
              clipCoupons().finally(() => {
                isClipping = false;
              });
            }
          } else {
            finalizeCompletion();
          }
        } else {
          if (!isClipping) {
            isClipping = true;
            clipCoupons().finally(() => {
              isClipping = false;
            });
          }
        }
      }, 1500);
    };

    if (document.readyState === "loading") {
      window.addEventListener("DOMContentLoaded", startClippingIfReady);
    } else {
      startClippingIfReady();
    }
  } else {
    determineInitialStatus();
  }

  browser.runtime.onMessage.addListener((msg) => {
    if (msg === "start-clipping") {
      stopRequested = false;
      totalClipped = 0;
      updateStatus(STATUS.CLIPPING, "Clipping coupons...");
      if (!isClipping) {
        isClipping = true;
        clipCoupons().finally(() => {
          isClipping = false;
        });
      }
    }
    if (msg === "stop-clipping") {
      stopRequested = true;
      updateStatus(STATUS.IDLE, "Stopped.");
    }
  });
})();
