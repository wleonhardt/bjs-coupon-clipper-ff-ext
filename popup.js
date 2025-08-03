document.addEventListener("DOMContentLoaded", async () => {
  const toggleBtn = document.getElementById("toggle");
  const statusEl = document.getElementById("status");

  async function updateUI() {
    const { isRunning } = await browser.storage.local.get("isRunning");
    toggleBtn.textContent = isRunning ? "Pause" : "Play";
    statusEl.textContent = "Status: " + (isRunning ? "Running" : "Paused");
  }

  toggleBtn.addEventListener("click", async () => {
    let { isRunning } = await browser.storage.local.get("isRunning");
    isRunning = !isRunning;
    await browser.storage.local.set({ isRunning });
    updateUI();

    if (isRunning) {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      browser.tabs.sendMessage(tab.id, "start-clipping").catch((err) => {
        console.warn("Could not send message to tab:", err.message);
      });
    }
  });

  updateUI();
});