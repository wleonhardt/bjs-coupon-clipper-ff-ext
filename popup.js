document.addEventListener("DOMContentLoaded", async () => {
  const toggleBtn = document.getElementById("toggle");
  const statusEl = document.getElementById("status");
  const progressEl = document.getElementById("progress");
  const messageEl = document.getElementById("message");
  const spinner = document.getElementById("spinner");

  async function updateUI() {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    const isOnCouponsPage = /^https:\/\/www\.bjs\.com\/myCoupons/.test(tab.url);

    if (!isOnCouponsPage) {
      toggleBtn.disabled = true;
      spinner.style.display = "none";
      statusEl.textContent = "Status: Idle";
      progressEl.textContent = "";
      const link = document.createElement("a");
      link.href = "https://www.bjs.com/myCoupons";
      link.textContent = "➡ Go to BJ’s coupon page to begin";
      link.target = "_blank";
      messageEl.innerHTML = "";
      messageEl.appendChild(link);
      return;
    }

    const { isRunning = false, totalClipped = 0, status = "Ready", message = "" } = await browser.storage.local.get([
      "isRunning",
      "totalClipped",
      "status",
      "message"
    ]);

    const isComplete = status === "Complete";

    toggleBtn.disabled = false;
    toggleBtn.textContent = isRunning ? "Cancel" : "Start";
    spinner.style.display = (status === "Clipping") ? "block" : "none";

    if (isComplete) {
      toggleBtn.textContent = "Start";
      spinner.style.display = "none";
      await browser.storage.local.set({ isRunning: false });
    }

    statusEl.textContent = "Status: " + status;
    progressEl.textContent = `Clipped: ${totalClipped}`;
    messageEl.textContent = (status === "Ready") ? "" : (message || "");
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
      spinner.style.display = (msg.status === "Clipping") ? "block" : "none";

      if (msg.status === "Complete") {
        toggleBtn.textContent = "Start";
        browser.storage.local.set({ isRunning: false });

        // 🎉 Confetti burst
        const duration = 1500;
        const end = Date.now() + duration;
        const colors = ['#c8102e', '#ffffff'];

        (function frame() {
          confetti({
            particleCount: 3,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors
          });
          confetti({
            particleCount: 3,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors
          });
          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        })();
      }
    }
    if (msg.type === "url-updated") {
      updateUI();
    }
  });

  updateUI();
});