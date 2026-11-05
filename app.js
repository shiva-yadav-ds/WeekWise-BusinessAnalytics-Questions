/**
 * IIT Madras BS Degree — BA Week-wise Question Portal
 * Minimal, Fast, Multi-Device Responsive
 */

const WEEKS_DATA = [
  { id: 1, name: "Week-1", pdf: "output/pdf/Business_Analytics_week_1_QP.pdf" },
  { id: 2, name: "Week-2", pdf: "output/pdf/Business_Analytics_week_2_QP.pdf" },
  { id: 3, name: "Week-3", pdf: "output/pdf/Business_Analytics_week_3_QP.pdf" },
  { id: 4, name: "Week-4", pdf: "output/pdf/Business_Analytics_week_4_QP.pdf" },
  { id: 5, name: "Week-5", pdf: "output/pdf/Business_Analytics_week_5_QP.pdf" },
  { id: 6, name: "Week-6", pdf: "output/pdf/Business_Analytics_week_6_QP.pdf" },
  { id: 7, name: "Week-7", pdf: "output/pdf/Business_Analytics_week_7_QP.pdf" },
  { id: 8, name: "Week-8", pdf: "output/pdf/Business_Analytics_week_8_QP.pdf" },
  { id: 9, name: "Week-9", pdf: "output/pdf/Business_Analytics_week_9_QP.pdf" },
  { id: 10, name: "Week-10", pdf: "output/pdf/Business_Analytics_week_10_QP.pdf" },
  { id: 11, name: "Week-11", pdf: "output/pdf/Business_Analytics_week_11_QP.pdf" },
  { id: 12, name: "Week-12", pdf: "output/pdf/Business_Analytics_week_12_QP.pdf" }
];

// App State
let currentWeekId = null;
let isDrawerCollapsed = false;

// DOM Elements
const appViewport = document.getElementById("appViewport");
const centerGallery = document.getElementById("centerGallery");
const splitView = document.getElementById("splitView");
const leftDrawer = document.getElementById("leftDrawer");
const weeksGrid = document.getElementById("weeksGrid");
const drawerWeeksList = document.getElementById("drawerWeeksList");
const collapsedRailItems = document.getElementById("collapsedRailItems");

const pdfFrame = document.getElementById("pdfFrame");
const currentWeekTitle = document.getElementById("currentWeekTitle");

const btnCollapseDrawer = document.getElementById("btnCollapseDrawer");
const btnHeaderHome = document.getElementById("btnHeaderHome");
const btnPdfHome = document.getElementById("btnPdfHome");
const btnToggleDrawer = document.getElementById("btnToggleDrawer");

const btnDownloadPdf = document.getElementById("btnDownloadPdf");
const btnNewTabPdf = document.getElementById("btnNewTabPdf");
const btnFullscreenPdf = document.getElementById("btnFullscreenPdf");

/**
 * Initialize Portal
 */
function init() {
  renderCenterGallery();
  renderDrawerWeeksList();
  renderCollapsedRail();
  attachEventListeners();

  // Check URL query parameters (e.g. ?week=1)
  const params = new URLSearchParams(window.location.search);
  const weekParam = params.get("week");
  if (weekParam) {
    const weekId = parseInt(weekParam, 10);
    if (!isNaN(weekId) && WEEKS_DATA.some(w => w.id === weekId)) {
      selectWeek(weekId);
    }
  }
}

/**
 * Render Centered Week Cards (6 Left, 6 Right List, no duplicate titles)
 */
function renderCenterGallery() {
  // Links and their text are rendered in HTML so they work without JavaScript.
  weeksGrid.querySelectorAll("a[data-week-id]").forEach(card => {
    card.addEventListener("click", event => {
      // Preserve normal new-tab behavior and the dedicated week overview URL.
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      selectWeek(Number(card.dataset.weekId));
    });
  });
}

/**
 * Render Clean Weeks List in Drawer (Week-1 to Week-7 buttons)
 */
function renderDrawerWeeksList() {
  drawerWeeksList.innerHTML = "";
  WEEKS_DATA.forEach(week => {
    const btn = document.createElement("button");
    btn.className = `week-nav-btn ${week.id === currentWeekId ? "active" : ""}`;
    btn.setAttribute("data-nav-week-id", week.id);
    btn.innerHTML = `
      <span>Week-${week.id}</span>
      <span class="week-nav-arrow">→</span>
    `;
    btn.addEventListener("click", () => {
      selectWeek(week.id);
      // On mobile / tablet screens, collapse drawer after picking a week so PDF is immediately visible
      if (window.innerWidth <= 768) {
        toggleDrawer(true);
      }
    });
    drawerWeeksList.appendChild(btn);
  });
}

/**
 * Render Collapsed Rail (5-space slim vertical rail)
 */
function renderCollapsedRail() {
  collapsedRailItems.innerHTML = "";

  // Expand Button
  const expandBtn = document.createElement("button");
  expandBtn.className = "rail-btn";
  expandBtn.title = "Expand Weeks Sidebar";
  expandBtn.setAttribute("aria-label", "Expand weeks sidebar");
  expandBtn.innerHTML = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/><path d="m13 9 3 3-3 3"/></svg>`;
  expandBtn.addEventListener("click", () => toggleDrawer(false));
  collapsedRailItems.appendChild(expandBtn);

  // Home Button
  const homeBtn = document.createElement("button");
  homeBtn.className = "rail-btn";
  homeBtn.title = "Return to All Weeks";
  homeBtn.innerHTML = `⌂`;
  homeBtn.addEventListener("click", returnToCenter);
  collapsedRailItems.appendChild(homeBtn);

  const divider = document.createElement("div");
  divider.className = "rail-divider";
  collapsedRailItems.appendChild(divider);

  // Vertical stacked week buttons: W1, W2, ..., W7
  WEEKS_DATA.forEach(week => {
    const btn = document.createElement("button");
    btn.className = `rail-btn ${week.id === currentWeekId ? "active" : ""}`;
    btn.setAttribute("data-rail-week-id", week.id);
    btn.title = `Week-${week.id}`;
    btn.textContent = `W${week.id}`;
    btn.addEventListener("click", () => selectWeek(week.id));
    collapsedRailItems.appendChild(btn);
  });
}

/**
 * Select and Open a Week (Maximizes vertical height upwards)
 */
function selectWeek(weekId) {
  const week = WEEKS_DATA.find(w => w.id === weekId);
  if (!week) return;

  currentWeekId = weekId;

  // Reclaim vertical screen space: hide main top-header in PDF mode
  document.body.classList.add("pdf-active");
  appViewport.classList.add("state-split");

  // On mobile / tablet devices (<= 768px), direct open PDF immediately without blocking drawer!
  if (window.innerWidth <= 768) {
    toggleDrawer(true);
  } else {
    // On desktop, keep drawer open or maintain user preference
    if (isDrawerCollapsed) {
      toggleDrawer(false);
    }
  }

  // Update PDF viewer
  pdfFrame.src = `${week.pdf}#view=FitH&toolbar=1`;
  currentWeekTitle.textContent = `Week-${week.id}`;
  pdfFrame.title = `IITM BA Week ${week.id} questions and answer key`;

  // Update active state in Drawer buttons
  document.querySelectorAll("[data-nav-week-id]").forEach(btn => {
    const id = parseInt(btn.getAttribute("data-nav-week-id"), 10);
    btn.classList.toggle("active", id === weekId);
  });

  // Update active state in Rail buttons
  document.querySelectorAll("[data-rail-week-id]").forEach(btn => {
    const id = parseInt(btn.getAttribute("data-rail-week-id"), 10);
    btn.classList.toggle("active", id === weekId);
  });
}

/**
 * Collapse or Expand Drawer (5-space slim rail)
 */
function toggleDrawer(forceCollapse) {
  if (typeof forceCollapse === "boolean") {
    isDrawerCollapsed = forceCollapse;
  } else {
    isDrawerCollapsed = !isDrawerCollapsed;
  }

  leftDrawer.classList.toggle("collapsed", isDrawerCollapsed);
}

/**
 * Return to Central View (All Weeks)
 */
function returnToCenter() {
  document.body.classList.remove("pdf-active");
  appViewport.classList.remove("state-split");
  currentWeekId = null;
  pdfFrame.removeAttribute("src");

  // Reset active classes
  document.querySelectorAll("[data-nav-week-id]").forEach(btn => btn.classList.remove("active"));
  document.querySelectorAll("[data-rail-week-id]").forEach(btn => btn.classList.remove("active"));
}

/**
 * Attach UI Event Listeners
 */
function attachEventListeners() {
  // Collapse button inside drawer
  if (btnCollapseDrawer) {
    btnCollapseDrawer.addEventListener("click", () => toggleDrawer(true));
  }

  // Top header button to return home
  if (btnHeaderHome) {
    btnHeaderHome.addEventListener("click", returnToCenter);
  }

  // PDF toolbar buttons
  if (btnPdfHome) {
    btnPdfHome.addEventListener("click", returnToCenter);
  }

  if (btnToggleDrawer) {
    btnToggleDrawer.addEventListener("click", () => toggleDrawer());
  }

  // PDF Action Controls
  if (btnDownloadPdf) {
    btnDownloadPdf.addEventListener("click", () => {
      const week = WEEKS_DATA.find(w => w.id === currentWeekId);
      if (!week) return;
      const a = document.createElement("a");
      a.href = week.pdf;
      a.download = week.pdf;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });
  }

  if (btnNewTabPdf) {
    btnNewTabPdf.addEventListener("click", () => {
      const week = WEEKS_DATA.find(w => w.id === currentWeekId);
      if (!week) return;
      window.open(week.pdf, "_blank");
    });
  }

  if (btnFullscreenPdf) {
    btnFullscreenPdf.addEventListener("click", () => {
      const container = document.getElementById("pdfContainer");
      if (!document.fullscreenElement) {
        container.requestFullscreen().catch(err => {
          alert(`Error attempting to enable full-screen mode: ${err.message}`);
        });
      } else {
        document.exitFullscreen();
      }
    });
  }

  // Keyboard navigation shortcuts
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (appViewport.classList.contains("state-split")) {
        returnToCenter();
      }
    }
    if (e.key === "[") {
      if (appViewport.classList.contains("state-split")) {
        toggleDrawer();
      }
    }
  });
}

// Boot up
document.addEventListener("DOMContentLoaded", init);
