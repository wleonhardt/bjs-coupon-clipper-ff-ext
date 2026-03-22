(async function () {
  // --- Constants ---
  const CLICK_DELAY_MS = 250;
  const BATCH_DELAY_MS = 800;
  const LOAD_WAIT_MS = 1500;
  const ERROR_RELOAD_MS = 3000;
  const SCROLL_STEP_PX = 600;
  const MAX_EMPTY_PASSES = 5;
  const COUPON_SELECTOR = '[data-auto-data="coupon_ClipToCard"]';
  const VALIDATION_KEY = "bjs_validation_reload";

  const STATES = {
    IDLE: "idle",
    READY: "ready",
    RUNNING: "running",
    VALIDATING: "validating",
    COMPLETE: "complete",
    ERROR: "error"
  };

  // --- In-memory guards ---
  let stopRequested = false;
  let loopRunning = false;

  // --- Helpers ---
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function isCouponsPage() {
    return location.href.includes("bjs.com/myCoupons");
  }

  async function getState() {
    const defaults = { runState: STATES.IDLE, totalClipped: 0, message: "" };
    const stored = await browser.storage.local.get(Object.keys(defaults));
    return { ...defaults, ...stored };
  }

  function setState(patch) {
    return browser.storage.local.set(patch);
  }

  function markClicked(el) {
    el.dataset.bjsClicked = "1";
  }

  function getUnclickedButtons() {
    return Array.from(
      document.querySelectorAll(`${COUPON_SELECTOR}:not([data-bjs-clicked])`)
    );
  }

  function hasUnclickedCoupons() {
    return getUnclickedButtons().length > 0;
  }

  function shouldStop() {
    return stopRequested;
  }

  function waitForNewCoupons(timeoutMs) {
    return new Promise((resolve) => {
      let done = false;
      const timer = setTimeout(finish, timeoutMs, false);

      const observer = new MutationObserver(() => {
        if (hasUnclickedCoupons()) finish(true);
      });

      function finish(found) {
        if (done) return;
        done = true;
        clearTimeout(timer);
        observer.disconnect();
        resolve(found);
      }

      observer.observe(document.body, { childList: true, subtree: true });
    });
  }

  // --- Clipping loop ---
  async function clipCoupons() {
    if (loopRunning) return;
    loopRunning = true;
    stopRequested = false;

    let state = await getState();
    let totalClipped = state.totalClipped;
    let emptyPasses = 0;

    await setState({ runState: STATES.RUNNING, message: "Clipping coupons..." });

    while (!shouldStop()) {
      const buttons = getUnclickedButtons();

      if (buttons.length > 0) {
        emptyPasses = 0;

        for (const btn of buttons) {
          if (shouldStop()) break;

          try {
            btn.click();
            markClicked(btn);
            totalClipped++;
            await setState({ totalClipped });
          } catch {
            await setState({
              runState: STATES.ERROR,
              message: "Click failed. Reloading..."
            });
            await sleep(ERROR_RELOAD_MS);
            location.reload();
            loopRunning = false;
            return;
          }

          await sleep(CLICK_DELAY_MS);
        }

        await sleep(BATCH_DELAY_MS);
        continue;
      }

      // No buttons found
      if (emptyPasses < MAX_EMPTY_PASSES) {
        emptyPasses++;
        window.scrollBy(0, SCROLL_STEP_PX);
        await setState({ message: `Scrolling for more coupons (${emptyPasses}/${MAX_EMPTY_PASSES})...` });
        await waitForNewCoupons(LOAD_WAIT_MS);
        continue;
      }

      // Retries exhausted — validation reload
      await setState({ runState: STATES.VALIDATING, message: "Validating..." });
      sessionStorage.setItem(VALIDATION_KEY, "true");
      location.reload();
      loopRunning = false;
      return;
    }

    // Stopped by user
    await setState({ runState: STATES.IDLE, message: "Stopped." });
    loopRunning = false;
  }

  // --- Message listener (always registered) ---
  browser.runtime.onMessage.addListener((msg) => {
    if (msg === "start-clipping") {
      stopRequested = false;
      setState({ totalClipped: 0 }).then(() => clipCoupons());
    }
    if (msg === "stop-clipping") {
      stopRequested = true;
    }
  });

  // --- Init ---
  if (!isCouponsPage()) {
    await setState({ runState: STATES.IDLE, message: "Not on coupons page." });
    return;
  }

  const wasValidation = sessionStorage.getItem(VALIDATION_KEY);
  const state = await getState();

  if (wasValidation) {
    sessionStorage.removeItem(VALIDATION_KEY);
    await sleep(LOAD_WAIT_MS);

    if (hasUnclickedCoupons()) {
      await setState({ message: "Found more after validation, continuing..." });
      clipCoupons();
    } else {
      await setState({ runState: STATES.COMPLETE, message: "All coupons clipped!" });
    }
    return;
  }

  if (state.runState === STATES.RUNNING || state.runState === STATES.VALIDATING) {
    await sleep(LOAD_WAIT_MS);
    clipCoupons();
    return;
  }

  await setState({ runState: STATES.READY, totalClipped: 0, message: "" });
})();
