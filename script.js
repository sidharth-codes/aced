// Retrieve core DOM elements for the brand logo, container, and app UI wrapper
const box = document.getElementById("logo_box");
const logo = document.getElementById("logo");
const appWrapper = document.getElementById("app_wrapper");

/**
 * Secure Helper: Escapes potentially malicious HTML characters to prevent DOM-based XSS
 * @param {string} str - Raw string data from the external spreadsheet configuration
 * @returns {string} - Sanatized string safe for DOM interpolation
 */
function escapeHTML(str) {
  if (!str) return "";
  return str.toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Click Event Listener on Document:
 * Triggers on first click anywhere on the page.
 * 1. Shrinks and moves the brand logo circle to the top-left corner.
 * 2. Fades in the SPA wrapper containing the navigation and content pages.
 * 3. Initialises the sliding menu indicator position.
 */
document.addEventListener("click", (e) => {
  if (!box || !logo) return;

  // Shrink the logo box and reposition it to top-left
  box.style.left = 50 + "px";
  box.style.top = 50 + "px";
  box.style.width = 75 + "px";
  box.style.height = 75 + "px";

  // Match the inner logo image dimensions to the box size
  logo.style.width = 75 + "px";
  logo.style.height = 75 + "px";

  // Add shrunk class to enable responsive styles via CSS
  box.classList.add("shrunk");

  // Reveal the SPA layout (fades in the header navbar and main content)
  if (appWrapper && !appWrapper.classList.contains("visible")) {
    appWrapper.classList.add("visible");
    document.body.style.overflow = "auto";
    
    // Give browser a short moment to layout and render elements before computing coordinates
    setTimeout(() => {
      const activeBtn = document.querySelector(".nav-btn.active");
      moveIndicator(activeBtn);
    }, 50);
  }
});

// Setup navigation nodes and tracking elements
const navBtns = document.querySelectorAll(".nav-btn");
const pageSections = document.querySelectorAll(".page-section");
const navIndicator = document.getElementById("nav_indicator");
const navbar = document.getElementById("navbar");

/**
 * moveIndicator:
 * Computes offset boundaries of the target navigation button
 * and aligns the shared indicator background pill behind it.
 * @param {HTMLElement} btn - The targeted navigation menu button
 */
function moveIndicator(btn) {
  if (!navIndicator || !btn) return;
  navIndicator.style.left = btn.offsetLeft + "px";
  navIndicator.style.top = btn.offsetTop + "px";
  navIndicator.style.width = btn.offsetWidth + "px";
  navIndicator.style.height = btn.offsetHeight + "px";
}

// Bind click and hover interactions to all navbar buttons
navBtns.forEach(btn => {
  
  /**
   * Click event listener for buttons:
   * 1. Stops propagation to prevent document click recalculations.
   * 2. Sets active class highlights on navigation tabs.
   * 3. Locks indicator anchor to the selected button.
   * 4. Swaps out and displays the active page section with fade animations.
   */
  btn.addEventListener("click", (e) => {
    e.stopPropagation(); // Avoid triggering the document click listener repeatedly
    
    const targetPage = btn.getAttribute("data-page");

    // Clear active classes from all nav tabs and set it for the selected button
    navBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    // Slide indicator pill to lock on this button
    moveIndicator(btn);

    // Swap active display class on the page section divs
    pageSections.forEach(section => {
      if (section.id === targetPage) {
        section.classList.add("active");
      } else {
        section.classList.remove("active");
      }
    });
  });

  /**
   * Mouseenter hover event listener:
   * Moves the indicator pill to follow cursor hovering.
   */
  btn.addEventListener("mouseenter", () => {
    moveIndicator(btn);
  });
});

/**
 * Mouseleave event listener on navbar:
 * Snaps the indicator pill back to the active page button when cursor exits the menu.
 */
if (navbar) {
  navbar.addEventListener("mouseleave", () => {
    const activeBtn = document.querySelector(".nav-btn.active");
    moveIndicator(activeBtn);
  });
}

/**
 * Resize event listener on window:
 * Recalculates offsets during browser resizing to keep layout elements aligned.
 */
window.addEventListener("resize", () => {
  const activeBtn = document.querySelector(".nav-btn.active");
  moveIndicator(activeBtn);
});


/* HOME PAGE CAROUSELS                                             */
/* Drives the Events / Announcements / Highlights                  */

const TRACK_GAP = 18; // Matches the gap value set on .carousel-track in styles.css

function setupCarouselLoop(track) {
  const originalCards = Array.from(track.children);
  if (originalCards.length === 0) return;

  // Measure the width of the original content before duplicating
  let originalWidth = 0;
  originalCards.forEach((card, i) => {
    originalWidth += card.getBoundingClientRect().width;
    if (i < originalCards.length - 1) originalWidth += TRACK_GAP;
  });
  originalWidth += TRACK_GAP; // gap between the last original card and the first clone

  // Duplicate the cards so the track always has enough content to scroll
  originalCards.forEach(card => {
    const clone = card.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    track.appendChild(clone);
  });

  track.dataset.offset = "0";
  track.dataset.loopWidth = originalWidth;

  // Once a slide finishes animating, snap invisibly back into range if needed.
  track.addEventListener("transitionend", () => {
    let offset = parseFloat(track.dataset.offset || "0");
    const loopWidth = parseFloat(track.dataset.loopWidth || "0");

    if (offset <= -loopWidth || offset > 0) {
      const wrapped = ((offset % loopWidth) + loopWidth) % loopWidth * -1;
      track.style.transition = "none";
      track.dataset.offset = wrapped;
      track.style.transform = `translateX(${wrapped}px)`;
      void track.offsetWidth; // Force reflow so the transition-removal takes effect immediately
      track.style.transition = "";
    }
  });
}

// Shared helper: moves a given track by one "step" in the given direction.
function advanceCarousel(track, direction) {
  if (!track) return;

  const firstCard = track.querySelector(":scope > *");
  if (!firstCard) return;

  const stepWidth = firstCard.getBoundingClientRect().width + TRACK_GAP;
  let currentOffset = parseFloat(track.dataset.offset || "0");

  currentOffset += direction * -stepWidth;

  track.dataset.offset = currentOffset;
  track.style.transform = `translateX(${currentOffset}px)`;
}

// Keep one interval timer per track so manual clicks can reset it cleanly
const carouselTimers = {};

function getCarouselDelay(trackId) {
  if (trackId === "highlight-track") return 4500;
  if (trackId === "gallery-track") return 4000;
  return 3500;
}

function startAutoAdvance(trackId) {
  const track = document.getElementById(trackId);
  if (!track) return;

  const delay = getCarouselDelay(trackId);

  carouselTimers[trackId] = setInterval(() => {
    advanceCarousel(track, 1);
  }, delay);
}

function restartAutoAdvance(trackId) {
  if (carouselTimers[trackId]) {
    clearInterval(carouselTimers[trackId]);
  }
  startAutoAdvance(trackId);
}

/**
 * Adds touch scroll and mouse dragging swipe interactions to the carousel track
 */
function enableDragAndTouch(track) {
  let isDragging = false;
  let startX = 0;
  let currentOffset = 0;
  let dragOffset = 0;

  function getClientX(e) {
    return e.touches ? e.touches[0].clientX : e.clientX;
  }

  function dragStart(e) {
    isDragging = true;
    startX = getClientX(e);
    currentOffset = parseFloat(track.dataset.offset || "0");
    track.style.transition = "none";
    
    if (carouselTimers[track.id]) {
      clearInterval(carouselTimers[track.id]);
    }
  }

  function dragMove(e) {
    if (!isDragging) return;
    const x = getClientX(e);
    const deltaX = x - startX;
    dragOffset = currentOffset + deltaX;
    track.style.transform = `translateX(${dragOffset}px)`;
  }

  function dragEnd() {
    if (!isDragging) return;
    isDragging = false;
    track.style.transition = "";

    const deltaX = dragOffset - currentOffset;

    if (deltaX < -50) {
      advanceCarousel(track, 1);
    } else if (deltaX > 50) {
      advanceCarousel(track, -1);
    } else {
      track.style.transform = `translateX(${currentOffset}px)`;
    }

    restartAutoAdvance(track.id);
  }

  track.addEventListener("touchstart", dragStart, { passive: true });
  track.addEventListener("touchmove", dragMove, { passive: true });
  track.addEventListener("touchend", dragEnd);

  track.addEventListener("mousedown", dragStart);
  track.addEventListener("mousemove", dragMove);
  track.addEventListener("mouseup", dragEnd);
  track.addEventListener("mouseleave", dragEnd);
}


/* ========================================================================= */
/* DYNAMIC MULEARN WEB SHEET INTERACTION (WEB APP WEBHOOK PARSING ENGINE)     */
/* ========================================================================= */

const GOOGLE_APPS_SCRIPT_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbwPxXhyhCFnnO8D1sGBDxwO7u-wYXf6sqDo4A5VIc-maOMofHBMVb2RHE3QS2d5MIu6JA/exec";

/**
 * Normalizes standard raw shared Google Drive media viewing URLs into direct binary stream assets
 * FIX: Enforced secure HTTPS endpoints and fixed broken bracket interpolation logic.
 */
/**
 * Normalizes standard raw shared Google Drive media viewing URLs into direct public binary stream assets
 */
function cleanDriveImageUrl(url) {
  if (!url) return "";
  
  let id = "";
  
  if (url.includes("drive.google.com/file/d/")) {
    id = url.split("/file/d/")[1].split("/")[0];
  } else if (url.includes("id=")) {
    id = url.split("id=")[1].split("&")[0];
  }
  
  // If an ID was successfully extracted, use the open public hosting endpoint
  if (id) {
    return `https://docs.google.com/uc?export=view&id=${id}`;
  }
  
  return url;
}

/**
 * Initiates the asynchronous batch runtime using JSON endpoints driven by your GAS engine
 */
async function loadDynamicSpreadsheetData() {
  try {
    const [recRes, galRes, memRes] = await Promise.all([
      fetch(`${GOOGLE_APPS_SCRIPT_WEBAPP_URL}?action=getRecognition`).then(r => r.json()),
      fetch(`${GOOGLE_APPS_SCRIPT_WEBAPP_URL}?action=getGallery`).then(r => r.json()),
      fetch(`${GOOGLE_APPS_SCRIPT_WEBAPP_URL}?action=getMembers`).then(r => r.json())
    ]);

    if (recRes && recRes.status === "success") renderRecognition(recRes.data);
    if (galRes && galRes.status === "success") renderGallery(galRes.data);
    if (memRes && memRes.status === "success") renderMembers(memRes.data);

  } catch (error) {
    console.error("Backend microservice failed execution stream:", error);
  } finally {
    document.querySelectorAll(".carousel-track").forEach(track => {
      setupCarouselLoop(track);
      enableDragAndTouch(track);
      startAutoAdvance(track.id);
    });

    document.querySelectorAll(".arrow-btn").forEach(arrowBtn => {
      arrowBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const track = document.getElementById(arrowBtn.dataset.target);
        const direction = parseInt(arrowBtn.dataset.dir, 10);
        advanceCarousel(track, direction);
        restartAutoAdvance(arrowBtn.dataset.target);
      });
    });
  }
}

/**
 * Maps raw backend JSON structural layers into the target carousel elements 
 * FIX: Applied comprehensive escapeHTML scrubbing across all data fields
 */
function renderRecognition(dataArr) {
  const track = document.getElementById("highlight-track");
  if (!track || !dataArr || dataArr.length === 0) return;
  track.innerHTML = "";

  dataArr.forEach(item => {
    const rawUrl = item.ImageURL || item.imageUrl || item.ImgURL || item.imgUrl || item.src || "";
    const cleanUrl = cleanDriveImageUrl(rawUrl);
    
    // Attribute scrubbing via explicit URL matching constraints can be performed here if preferred
    const imgHtml = cleanUrl ? `<img src="${encodeURI(cleanUrl)}" alt="${escapeHTML(item.Title || item.title || "Highlight")}" class="photo-img">` : "";

    const card = document.createElement("div");
    card.className = "card highlight-card";
    card.innerHTML = `
      <div class="card-media">
        ${imgHtml}
        <span class="tag">${escapeHTML(item.Tag || item.tag || "")}</span>
      </div>
      <div class="card-body">
        <span class="card-date">${escapeHTML(item.Date || item.date || "")}</span>
        <h4>${escapeHTML(item.Title || item.title || "")}</h4>
        <p>${escapeHTML(item.Description || item.description || "")}</p>
      </div>
    `;
    track.appendChild(card);
  });
}

function renderGallery(dataArr) {
  const track = document.getElementById("gallery-track");
  if (!track || !dataArr || dataArr.length === 0) return;
  track.innerHTML = "";

  dataArr.forEach(item => {
    const rawUrl = item.ImageURL || item.imageUrl || item.ImgURL || item.imgUrl || item.src || "";
    const cleanUrl = cleanDriveImageUrl(rawUrl);
    if (!cleanUrl) return;

    const photoCard = document.createElement("div");
    photoCard.className = "photo-card";
    photoCard.innerHTML = `
      <img src="${encodeURI(cleanUrl)}" alt="${escapeHTML(item.AltText || item.altText || "Gallery Image")}" class="photo-img">
    `;
    track.appendChild(photoCard);
  });
}

function renderMembers(dataArr) {
  const gallery = document.querySelector("#about .gallery");
  if (!gallery || !dataArr || dataArr.length === 0) return;
  gallery.innerHTML = ""; 

  dataArr.forEach(item => {
    const rawUrl = item.ImageURL || item.imageUrl || item.ImgURL || item.imgUrl || item.src || "";
    const cleanUrl = cleanDriveImageUrl(rawUrl);
    if (!cleanUrl) return;

    const memberCard = document.createElement("div");
    memberCard.className = "member-card";

    memberCard.innerHTML = `
      <img src="${encodeURI(cleanUrl)}" alt="${escapeHTML(item.AltText || item.Name || "Executive Member")}" class="member-img" />
      <h3 class="member-name">${escapeHTML(item.Name || item.name || "")}</h3>
      <p class="member-role">${escapeHTML(item.Designation || item.designation || item.Role || item.role || "")}</p>
    `;
    gallery.appendChild(memberCard);
  });
}

document.querySelectorAll('.fp').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.fp').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
  });
});

/**
 * Attaches smooth interactive elevation states strictly to the Events page text cards
 */
document.querySelectorAll('#event .event-row .event-text-card').forEach(card => {
  card.addEventListener('mouseenter', () => {
    card.style.transform = 'translateY(-6px)';
    card.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.08)';
  });
  
  card.addEventListener('mouseleave', () => {
    card.style.transform = 'none';
    card.style.boxShadow = 'none';
  });
});

// Initialise the dynamic spreadsheet data loading when the script executes
loadDynamicSpreadsheetData();
