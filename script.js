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

// Initialise every carousel track for seamless looping
document.querySelectorAll(".carousel-track").forEach(track => {
  setupCarouselLoop(track);
});

// Bind every carousel arrow button to scroll its matching track
document.querySelectorAll(".arrow-btn").forEach(arrowBtn => {

  arrowBtn.addEventListener("click", (e) => {
    e.stopPropagation(); // Avoid re-triggering the document click logo/reveal listener

    const track = document.getElementById(arrowBtn.dataset.target);
    const direction = parseInt(arrowBtn.dataset.dir, 10);

    advanceCarousel(track, direction);

    // Manual interaction resets that track's auto-advance timer
    restartAutoAdvance(arrowBtn.dataset.target);
  });
});

// Keep one interval timer per track so manual clicks can reset it cleanly
const carouselTimers = {};
const AUTO_ADVANCE_DELAY = 3500; // 3.5s between automatic slides

function startAutoAdvance(trackId) {
  const track = document.getElementById(trackId);
  if (!track) return;

  carouselTimers[trackId] = setInterval(() => {
    advanceCarousel(track, 1); // Auto-advance always moves forward
  }, AUTO_ADVANCE_DELAY);
}

function restartAutoAdvance(trackId) {
  if (carouselTimers[trackId]) {
    clearInterval(carouselTimers[trackId]);
  }
  startAutoAdvance(trackId);
}

// Start auto-advance for every carousel track currently on the page
document.querySelectorAll(".carousel-track").forEach(track => {
  startAutoAdvance(track.id);
});

