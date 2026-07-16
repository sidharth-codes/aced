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
 * CSS .logo_box.shrunk handles positioning for ALL screen sizes.
 * JS only needs to add the class — no inline style overrides needed.
 */
document.addEventListener("click", (e) => {
  if (!box || !logo) return;

  // Add shrunk class — CSS base rule + media queries handle the rest
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
 * Aligns the shared indicator background pill behind the target menu button
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

  btn.addEventListener("mouseenter", () => {
    moveIndicator(btn);
  });
});

if (navbar) {
  navbar.addEventListener("mouseleave", () => {
    const activeBtn = document.querySelector(".nav-btn.active");
    moveIndicator(activeBtn);
  });
}

window.addEventListener("resize", () => {
  // Re-align the nav indicator pill on resize/orientation change
  const activeBtn = document.querySelector(".nav-btn.active");
  moveIndicator(activeBtn);
  // Note: logo repositioning is fully handled by CSS .logo_box.shrunk rules
});


/* HOME PAGE CAROUSELS                                             */
const TRACK_GAP = 18; // Matches the gap value set on .carousel-track in styles.css

function setupCarouselLoop(track) {
  const originalCards = Array.from(track.children);
  if (originalCards.length === 0) return;

  let originalWidth = 0;
  originalCards.forEach((card, i) => {
    originalWidth += card.getBoundingClientRect().width;
    if (i < originalCards.length - 1) originalWidth += TRACK_GAP;
  });
  originalWidth += TRACK_GAP;

  originalCards.forEach(card => {
    const clone = card.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    track.appendChild(clone);
  });

  track.dataset.offset = "0";
  track.dataset.loopWidth = originalWidth;

  track.addEventListener("transitionend", () => {
    let offset = parseFloat(track.dataset.offset || "0");
    const loopWidth = parseFloat(track.dataset.loopWidth || "0");

    if (offset <= -loopWidth || offset > 0) {
      const wrapped = ((offset % loopWidth) + loopWidth) % loopWidth * -1;
      track.style.transition = "none";
      track.dataset.offset = wrapped;
      track.style.transform = `translateX(${wrapped}px)`;
      void track.offsetWidth; 
      track.style.transition = "";
    }
  });
}

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
/* DYNAMIC MULEARN WEB SHEET INTERACTION                                     */
/* ========================================================================= */

const GOOGLE_APPS_SCRIPT_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbwPxXhyhCFnnO8D1sGBDxwO7u-wYXf6sqDo4A5VIc-maOMofHBMVb2RHE3QS2d5MIu6JA/exec";

/**
 * Normalizes standard raw shared Google Drive media URLs.
 * NOTE: If the main asset path fails cross-origin, you can swap out the direct view URL for the thumbnail URL format.
 */
function cleanDriveImageUrl(url) {
  if (!url) return "";
  
  let id = "";
  if (url.includes("drive.google.com/file/d/")) {
    id = url.split("/file/d/")[1].split("/")[0];
  } else if (url.includes("id=")) {
    id = url.split("id=")[1].split("&")[0];
  }
  
  if (id) {
    return `https://docs.google.com/uc?export=view&id=${id}`;
    // Fallback alternative if needed: return `https://drive.google.com/thumbnail?id=${id}&sz=w1000`;
  }

  return url;
}

/**
 * Initiates the asynchronous batch runtime
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

function renderRecognition(dataArr) {
  const track = document.getElementById("highlight-track");
  if (!track || !dataArr || dataArr.length === 0) return;
  track.innerHTML = "";

  dataArr.forEach(item => {
    const rawUrl = item.ImageURL || item.imageUrl || item.ImgURL || item.imgUrl || item.src || "";
    const cleanUrl = cleanDriveImageUrl(rawUrl);
    
    const imgHtml = cleanUrl ? `<img src="${encodeURI(cleanUrl)}" alt="${escapeHTML(item.Title || item.title || "Highlight")}" class="photo-img" referrerpolicy="no-referrer">` : "";

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
      <img src="${encodeURI(cleanUrl)}" alt="${escapeHTML(item.AltText || item.altText || "Gallery Image")}" class="photo-img" referrerpolicy="no-referrer">
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
      <img src="${encodeURI(cleanUrl)}" alt="${escapeHTML(item.AltText || item.Name || "Executive Member")}" class="member-img" referrerpolicy="no-referrer" />
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

// Run exactly once on script initialization
loadDynamicSpreadsheetData();
