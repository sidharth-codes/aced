// Retrieve core DOM elements for the brand logo, container, and app UI wrapper
const box = document.getElementById("logo_box");
const logo = document.getElementById("logo");
const appWrapper = document.getElementById("app_wrapper");

/**
 * Click Event Listener on Document:
 * Triggers on first click anywhere on the page.
 * 1. Shrinks and moves the brand logo circle to the top-left corner.
 * 2. Fades in the SPA wrapper containing the navigation and content pages.
 * 3. Initialises the sliding menu indicator position.
 */
document.addEventListener("click", (e) => {
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
    document.body.style.overflow = "hidden";
    
    // Give browser a short moment to layout and render elements before computing coordinates
    setTimeout(() => {
      const activeBtn = document.querySelector(".nav-btn.active");
      moveIndicator(activeBtn);
    }, 50);
  }
});

// Auto-trigger click for testing and headless screenshot capture
setTimeout(() => {
  document.dispatchEvent(new MouseEvent('click'));
}, 100);

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

/* HOME PAGE CAROUSELS                            */
/* Drives the Events / Announcements / Highlights */
/* tracks via the left/right arrow buttons, plus  */
/* automatic looping advance every 3.5s.          */
/*                                                 */
/* Each track's cards are duplicated once so the  */
/* carousel always has enough content to scroll,  */
/* even if the original cards fit within the      */
/* visible width. The loop snaps back instantly   */
/* right after a transition finishes, at the exact*/
/* point where the duplicate set lines up with the*/
/* original set, so it always reads as continuous */
/* forward motion rather than jumping backward.    */

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
  // This only happens at a point where the duplicate content lines up exactly
  // with the original content, so the snap is not visible to the viewer.
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
// direction: 1 = forward (next), -1 = backward (previous)
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
  if (trackId === "highlight-track") {
    return 4500; // 4.5s
  }
  if (trackId === "gallery-track") {
    return 4000; // 4.0s
  }
  return 3500; // Default fallback
}

function startAutoAdvance(trackId) {
  const track = document.getElementById(trackId);
  if (!track) return;

  const delay = getCarouselDelay(trackId);

  carouselTimers[trackId] = setInterval(() => {
    advanceCarousel(track, 1); // Auto-advance always moves forward
  }, delay);
}

function restartAutoAdvance(trackId) {
  if (carouselTimers[trackId]) {
    clearInterval(carouselTimers[trackId]);
  }
  startAutoAdvance(trackId);
}


/* ========================================================================= */
/* DYNAMIC MULEARN WEB SHEET INTERACTION (WEB APP WEBHOOK PARSING ENGINE)     */
/* ========================================================================= */
/**
 * TO CONFIGURATE USING YOUR MULEARN CHAPTER HOOK ROUTE:
 * Deploy your updated Google Apps Script standalone Web App deployment, 
 * paste the production macro executable link below, and pass URL parameter commands
 */
const GOOGLE_APPS_SCRIPT_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbwPxXhyhCFnnO8D1sGBDxwO7u-wYXf6sqDo4A5VIc-maOMofHBMVb2RHE3QS2d5MIu6JA/exec";

/**
 * Normalizes standard raw shared Google Drive media viewing URLs into direct binary stream assets
 */
function cleanDriveImageUrl(url) {
  if (!url) return "";
  if (url.includes("drive.google.com/file/d/")) {
    const id = url.split("/file/d/")[1].split("/")[0];
    return `https://lh3.googleusercontent.com/d/${id}`;
  }
  if (url.includes("id=")) {
    const id = url.split("id=")[1].split("&")[0];
    return `https://lh3.googleusercontent.com/d/${id}`;
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
    // Structural layout components re-indexing step for active carousels
    document.querySelectorAll(".carousel-track").forEach(track => {
      setupCarouselLoop(track);
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
 */
function renderRecognition(dataArr) {
  const track = document.getElementById("highlight-track");
  if (!track || !dataArr || dataArr.length === 0) return;
  track.innerHTML = "";

  dataArr.forEach(item => {
    const rawUrl = item.ImageURL || item.imageUrl || item.ImgURL || item.imgUrl || item.src || "";
    const cleanUrl = cleanDriveImageUrl(rawUrl);
    const imgHtml = cleanUrl ? `<img src="${cleanUrl}" alt="${item.Title || item.title || "Highlight"}" class="photo-img">` : "";

    const card = document.createElement("div");
    card.className = "card highlight-card";
    card.innerHTML = `
      <div class="card-media">
        ${imgHtml}
        <span class="tag">${item.Tag || item.tag || ""}</span>
      </div>
      <div class="card-body">
        <span class="card-date">${item.Date || item.date || ""}</span>
        <h4>${item.Title || item.title || ""}</h4>
        <p>${item.Description || item.description || ""}</p>
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
      <img src="${cleanUrl}" alt="${item.AltText || item.altText || "Gallery Image"}" class="photo-img">
    `;
    track.appendChild(photoCard);
  });
}

/**
 * Renders data to About Page .gallery element
 * Expected Column Layout: ImageURL | AltText | Name | Designation
 */
function renderMembers(dataArr) {
  const gallery = document.querySelector("#about .gallery");
  if (!gallery || !dataArr || dataArr.length === 0) return;
  gallery.innerHTML = ""; // Wipe original template blocks

  dataArr.forEach(item => {
    const rawUrl = item.ImageURL || item.imageUrl || item.ImgURL || item.imgUrl || item.src || "";
    const cleanUrl = cleanDriveImageUrl(rawUrl);
    if (!cleanUrl) return;

    // Create a structured wrapper card for each executive member
    const memberCard = document.createElement("div");
    memberCard.className = "member-card";

    memberCard.innerHTML = `
      <img src="${cleanUrl}" alt="${item.AltText || item.Name || "Executive Member"}" class="member-img" />
      <h3 class="member-name">${item.Name || item.name || ""}</h3>
      <p class="member-role">${item.Designation || item.designation || item.Role || item.role || ""}</p>
    `;
    gallery.appendChild(memberCard);
  });
}

// Initialise the dynamic spreadsheet data loading when the script executes
loadDynamicSpreadsheetData();


/* ========================================================================= */
/* APPS SCRIPT BACKEND MODULE MANIFESTO (PASTE CODE BELOW INTO EXECUTABLE)   */
/* ========================================================================= */
/*
function doGet(e) {
  var action = e.parameter.action;
  var sheet = SpreadsheetApp.getActiveSpreadsheet();
  var output = {};
  
  try {
    if (action === "getRecognition") {
      output = { status: "success", data: readSheetData(sheet.getSheetByName("Recognition")) };
    } else if (action === "getGallery") {
      output = { status: "success", data: readSheetData(sheet.getSheetByName("Gallery")) };
    } else if (action === "getMembers") {
      output = { status: "success", data: readSheetData(sheet.getSheetByName("Members")) };
    } else {
      output = { status: "error", message: "Invalid route directive parameters" };
    }
  } catch(err) {
    output = { status: "error", message: err.toString() };
  }
  
  return ContentService.createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}

function readSheetData(sheetLayer) {
  if (!sheetLayer) return [];
  var data = sheetLayer.getDataRange().getValues();
  var headers = data[0];
  var jsonResult = [];
  
  for (var i = 1; i < data.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j].toString().replace(/\s+/g, '')] = data[i][j];
    }
    jsonResult.push(obj);
  }
  return jsonResult;
}
*/