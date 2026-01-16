document.addEventListener("DOMContentLoaded", async () => {
  const toggleBtn = document.getElementById("toggle");
  const progressEl = document.getElementById("progress");
  const statusPill = document.getElementById("status-pill");

  function normalizeStatus(status) {
    const key = status ? status.toUpperCase() : "";
    return STATUS[key] || STATUS.IDLE;
  }

  function setStatusPill(status) {
    if (!statusPill) return;
    const normalized = normalizeStatus(status);
    statusPill.textContent = normalized;
    statusPill.className = "status-pill";
    const statusClass = `status-${normalized.toLowerCase()}`;
    statusPill.classList.add(statusClass);
  }

  function renderNotOnCouponsPage() {
    toggleBtn.disabled = true;
    progressEl.textContent = "";
    statusPill.className = "status-pill status-idle";
    statusPill.textContent = "";
    const link = document.createElement("a");
    link.href = "https://www.bjs.com/myCoupons";
    link.textContent = "Coupons";
    link.target = "_blank";
    statusPill.appendChild(link);
  }

  async function updateUI() {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url) {
      return;
    }
    const isOnCouponsPage = /^https:\/\/www\.bjs\.com\/myCoupons/.test(tab.url);

    if (!isOnCouponsPage) {
      renderNotOnCouponsPage();
      return;
    }

    const { isRunning = false, totalClipped = 0, status = STATUS.READY } = await browser.storage.local.get([
      "isRunning",
      "totalClipped",
      "status"
    ]);

    const normalizedStatus = normalizeStatus(status);
    const isComplete = normalizedStatus === STATUS.COMPLETE;

    toggleBtn.disabled = false;
    toggleBtn.textContent = isRunning ? "Cancel" : "Start";

    if (isComplete) {
      toggleBtn.textContent = "Start";
      await browser.storage.local.set({ isRunning: false });
    }

    progressEl.textContent = `Clipped: ${totalClipped}`;
    setStatusPill(normalizedStatus);
  }

  toggleBtn.addEventListener("click", async () => {
    const { isRunning: currentIsRunning = false } = await browser.storage.local.get("isRunning");
    const nextIsRunning = !currentIsRunning;
    const updates = {
      isRunning: nextIsRunning,
      status: nextIsRunning ? STATUS.CLIPPING : STATUS.IDLE,
      message: ""
    };
    if (nextIsRunning) {
      updates.totalClipped = 0;
    }
    await browser.storage.local.set(updates);
    toggleBtn.textContent = nextIsRunning ? "Cancel" : "Start";
    setStatusPill(updates.status);
    if (nextIsRunning) {
      progressEl.textContent = "Clipped: 0";
    }
    // Delay to allow content script updates to sync.
    setTimeout(() => {
      updateUI();
    }, 200);

    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.id) {
      const message = nextIsRunning ? "start-clipping" : "stop-clipping";
      browser.tabs.sendMessage(tab.id, message).catch((err) => {
        console.warn("Could not send message to tab:", err.message);
      });
    }
  });

  browser.runtime.onMessage.addListener((msg) => {
    if (msg.type === "progress") {
      progressEl.textContent = `Clipped: ${msg.totalClipped}`;
    }
    if (msg.type === "status") {
      setStatusPill(msg.status);

      if (normalizeStatus(msg.status) === STATUS.COMPLETE) {
        toggleBtn.textContent = "Start";
        browser.storage.local.set({ isRunning: false });
      }
    }
    if (msg.type === "url-updated") {
      updateUI();
    }
  });

  updateUI();
});
