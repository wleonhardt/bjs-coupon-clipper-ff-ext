document.addEventListener("DOMContentLoaded", async () => {
  const toggleBtn = document.getElementById("toggle");
  const statusEl = document.getElementById("status");
  const progressEl = document.getElementById("progress");
  const messageEl = document.getElementById("message");

  async function updateUI() {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });

    const isOnBJs = tab.url.includes("bjs.com/myCoupons");
    if (!isOnBJs) {
      toggleBtn.disabled = true;
      statusEl.textContent = "Status: Idle";
      messageEl.textContent = "Not on BJ's website.";
      progressEl.textContent = "";
      return;
    }

    const { isRunning = false, totalClipped = 0, status = "Ready", message = "" } = await browser.storage.local.get(["isRunning", "totalClipped", "status", "message"]);
    toggleBtn.disabled = false;
    toggleBtn.textContent = isRunning ? "Cancel" : "Start";
    statusEl.textContent = "Status: " + status;
    progressEl.textContent = `Clipped: ${totalClipped}`;
    messageEl.textContent = (status === "Ready") ? "" : message;
  }

  toggleBtn.addEventListener("click", async () => {
    let { isRunning } = await browser.storage.local.get("isRunning");
    isRunning = !isRunning;
    await browser.storage.local.set({ isRunning, status: isRunning ? "Clipping" : "Idle", totalClipped: 0, message: "" });
    updateUI();

    if (isRunning) {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      browser.tabs.sendMessage(tab.id, "start-clipping").catch((err) => {
        console.warn("Could not send message to tab:", err.message);
      });
    }
  });

  browser.runtime.onMessage.addListener((msg) => {
    if (msg.type === "progress") {
      progressEl.textContent = `Clipped: ${msg.totalClipped}`;
    }
    if (msg.type === "status") {
      statusEl.textContent = "Status: " + msg.status;
      messageEl.textContent = (msg.status === "Ready") ? "" : (msg.message || "");
    }
  });

  updateUI();
});