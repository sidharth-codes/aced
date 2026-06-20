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
