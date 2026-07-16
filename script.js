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

    // Scroll the content container back to the top for the new section
    const contentContainer = document.querySelector(".content-container");
    if (contentContainer) {
      contentContainer.scrollTop = 0;
    }
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

  // Clone the full set enough times to fill at least 2× the viewport
  // so infinite scrolling always looks seamless, even with 1 entry
  const viewportWidth = track.parentElement ? track.parentElement.getBoundingClientRect().width : window.innerWidth;
  const setsNeeded = Math.max(1, Math.ceil((viewportWidth * 2) / originalWidth));

  for (let s = 0; s < setsNeeded; s++) {
    originalCards.forEach(card => {
      const clone = card.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      track.appendChild(clone);
    });
  }

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

const GOOGLE_APPS_SCRIPT_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbwvZSkFzkd_KOrfaz4rKIGhP_xCfqN37ZwaJskN-PHU7c_iH8aJFugrRI14tTJ_TJA/exec"

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
    return `https://drive.google.com/thumbnail?id=${id}&sz=w1000`;
  }

  return url;
}

/**
 * Initiates the asynchronous batch runtime
 */
async function loadDynamicSpreadsheetData() {
  try {
    const [recRes, galRes, memRes, newsRes, eventRes] = await Promise.all([
  fetch(`${GOOGLE_APPS_SCRIPT_WEBAPP_URL}?action=getRecognition`).then(r => r.json()),
  fetch(`${GOOGLE_APPS_SCRIPT_WEBAPP_URL}?action=getGallery`).then(r => r.json()),
  fetch(`${GOOGLE_APPS_SCRIPT_WEBAPP_URL}?action=getMembers`).then(r => r.json()),
  fetch(`${GOOGLE_APPS_SCRIPT_WEBAPP_URL}?action=getNews`).then(r => r.json()),
  fetch(`${GOOGLE_APPS_SCRIPT_WEBAPP_URL}?action=getEvents`).then(r => r.json())
]);

    if (recRes && recRes.status === "success") renderRecognition(recRes.data);
    if (galRes && galRes.status === "success") renderGallery(galRes.data);
    if (memRes && memRes.status === "success") renderMembers(memRes.data);
    if (newsRes && newsRes.status === "success") renderNews(newsRes.data);
    if (eventRes && eventRes.status === "success") renderEvents(eventRes.data);

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

/**
 * Global store for all news data so filters can re-render per category
 */
let allNewsData = [];

/**
 * renderNews:
 * Stores news data globally and triggers initial render.
 * Expects columns: Title, Excerpt, Date, Tag, ImageURL, Link, Featured
 */
function renderNews(dataArr) {
  if (!dataArr || dataArr.length === 0) return;
  allNewsData = dataArr;

  // Render the "All" view first
  renderNewsForCategory("all");

  // Wire up filter buttons
  bindNewsFilters();
}

/**
 * renderNewsForCategory:
 * Renders the full news layout (featured + recent grid + earlier list)
 * for a specific category. "all" shows everything.
 */
function renderNewsForCategory(category) {
  const contentEl = document.querySelector("#news .news-content");
  if (!contentEl) return;

  // Filter data by category
  let filtered;
  if (category === "all") {
    filtered = allNewsData;
  } else {
    filtered = allNewsData.filter(item => {
      const tag = (item.Tag || item.tag || "").toLowerCase();
      return tag === category;
    });
  }

  // Clear existing content
  contentEl.innerHTML = "";

  if (filtered.length === 0) {
    contentEl.innerHTML = `<p class="news-empty">No news in this category yet.</p>`;
    return;
  }

  // Separate featured from the rest
  const featuredIdx  = filtered.findIndex(item => (item.Featured || item.featured || "").toUpperCase() === "TRUE");
  const featuredItem = featuredIdx !== -1 ? filtered[featuredIdx] : null;
  const rest         = filtered.filter((_, i) => i !== featuredIdx);

  // --- Feature card ---
  if (featuredItem) {
    const rawUrl  = featuredItem.ImageURL || featuredItem.imageUrl || featuredItem.ImgURL || "";
    const imgUrl  = cleanDriveImageUrl(rawUrl);
    const link    = featuredItem.Link || featuredItem.link || "";

    const featDiv = document.createElement("div");
    featDiv.className = "feat";
    featDiv.innerHTML = `
      <div class="feat-img">
        ${imgUrl
          ? `<img src="${encodeURI(imgUrl)}" alt="${escapeHTML(featuredItem.Title || "")}" class="feat-img-actual" referrerpolicy="no-referrer">`
          : `<div class="feat-img-ph"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/></svg></div>`
        }
      </div>
      <div class="feat-body">
        <span class="feat-tag">${escapeHTML(featuredItem.Tag || featuredItem.tag || "")}</span>
        <span class="feat-date">${escapeHTML(featuredItem.Date || featuredItem.date || "")}</span>
        <h2 class="feat-ttl">${escapeHTML(featuredItem.Title || featuredItem.title || "")}</h2>
        <p class="feat-exc">${escapeHTML(featuredItem.Excerpt || featuredItem.excerpt || "")}</p>
        ${link
          ? `<a href="${encodeURI(link)}" target="_blank" rel="noopener" class="rbtn">Read more</a>`
          : `<button class="rbtn" disabled>Coming soon</button>`
        }
      </div>
    `;
    contentEl.appendChild(featDiv);
  }

  // --- Recent grid (first 3 non-featured rows) ---
  const recentItems = rest.slice(0, 3);
  if (recentItems.length > 0) {
    const recentLabel = document.createElement("div");
    recentLabel.className = "slbl";
    recentLabel.textContent = "Recent";
    contentEl.appendChild(recentLabel);

    const gridDiv = document.createElement("div");
    gridDiv.className = "grid3";

    recentItems.forEach(item => {
      const rawUrl = item.ImageURL || item.imageUrl || item.ImgURL || "";
      const imgUrl = cleanDriveImageUrl(rawUrl);
      const link   = item.Link || item.link || "";
      const tag    = item.Tag || item.tag || "";

      const card = document.createElement("div");
      card.className = "acard";
      card.innerHTML = `
        <div class="card-img">${imgUrl ? `<img src="${encodeURI(imgUrl)}" alt="${escapeHTML(item.Title || "")}" referrerpolicy="no-referrer">` : ""}</div>
        <div class="cbody">
          <span class="ctag">${escapeHTML(tag)}</span>
          <span class="cdate">${escapeHTML(item.Date || item.date || "")}</span>
          <h3 class="cttl">${escapeHTML(item.Title || item.title || "")}</h3>
          <p class="cexc">${escapeHTML(item.Excerpt || item.excerpt || "")}</p>
          ${link
            ? `<a href="${encodeURI(link)}" target="_blank" rel="noopener" class="clnk">Read more</a>`
            : `<button class="clnk" disabled>Coming soon</button>`
          }
        </div>
      `;
      gridDiv.appendChild(card);
    });

    contentEl.appendChild(gridDiv);
  }

  // --- Earlier this year list (remaining rows after the first 3) ---
  const olderItems = rest.slice(3);
  if (olderItems.length > 0) {
    const earlierLabel = document.createElement("div");
    earlierLabel.className = "slbl";
    earlierLabel.textContent = "Earlier this year";
    contentEl.appendChild(earlierLabel);

    const nlistDiv = document.createElement("div");
    nlistDiv.className = "nlist";

    olderItems.forEach(item => {
      const rawUrl = item.ImageURL || item.imageUrl || item.ImgURL || "";
      const imgUrl = cleanDriveImageUrl(rawUrl);
      const link   = item.Link || item.link || "";
      const tag    = item.Tag || item.tag || "";

      const row = document.createElement("div");
      row.className = "nitem";
      row.innerHTML = `
        <div class="lthumb">${imgUrl ? `<img src="${encodeURI(imgUrl)}" alt="${escapeHTML(item.Title || "")}" referrerpolicy="no-referrer">` : ""}</div>
        <div class="lbody">
          <span class="ltag">${escapeHTML(tag)}</span>
          <h4 class="lttl">${link ? `<a href="${encodeURI(link)}" target="_blank" rel="noopener">${escapeHTML(item.Title || "")}</a>` : escapeHTML(item.Title || "")}</h4>
          <p class="lexc">${escapeHTML(item.Excerpt || item.excerpt || "")}</p>
          <span class="ldate">${escapeHTML(item.Date || item.date || "")}</span>
        </div>
      `;
      nlistDiv.appendChild(row);
    });

    contentEl.appendChild(nlistDiv);
  }
}

/**
 * bindNewsFilters:
 * Attaches click handlers to filter pill buttons (.fp).
 * Each category fully re-renders its own Featured / Recent / Earlier sections.
 */
function bindNewsFilters() {
  document.querySelectorAll('.fp').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.fp').forEach(b => b.classList.remove('on'));
      btn.classList.add('on');

      const filter = btn.textContent.trim().toLowerCase();
      renderNewsForCategory(filter);
    });
  });
}

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
function renderEvents(events) {

    const container = document.getElementById("eventsContainer");

    if (!container) return;

    container.innerHTML = "";

    if (!events || events.length === 0) {
        container.innerHTML = "<p>No upcoming events.</p>";
        return;
    }

    events.forEach((event, index) => {

        const reverse = index % 2 === 1;

        const image = cleanDriveImageUrl(event.ImageURL || "");

        container.innerHTML += `
        <div class="event-row ${reverse ? "reverse-row" : ""}">

            ${
                reverse
                ? `
                <div class="event-text-card padding-right-large">
                    <span class="event-meta">${escapeHTML(event.Date)}</span>

                    <h3 class="event-heading">${escapeHTML(event.Title)}</h3>

                    <p class="event-desc-text">
                        ${escapeHTML(event.Description)}
                    </p>

                    <a href="${event.RegistrationLink}"
                       target="_blank"
                       class="animated-button">

                        <svg viewBox="0 0 24 24" class="arr-2">
                            <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"/>
                        </svg>

                        <span class="text">Register</span>

                        <span class="circle"></span>

                        <svg viewBox="0 0 24 24" class="arr-1">
                            <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"/>
                        </svg>

                    </a>
                </div>

                <div class="event-img-frame margin-left-neg">
                    <img src="${image}" alt="${escapeHTML(event.Title)}">
                </div>
                `
                : `
                <div class="event-img-frame margin-right-neg">
                    <img src="${image}" alt="${escapeHTML(event.Title)}">
                </div>

                <div class="event-text-card padding-left-large">
                    <span class="event-meta">${escapeHTML(event.Date)}</span>

                    <h3 class="event-heading">${escapeHTML(event.Title)}</h3>

                    <p class="event-desc-text">
                        ${escapeHTML(event.Description)}
                    </p>

                    <a href="${event.RegistrationLink}"
                       target="_blank"
                       class="animated-button">

                        <svg viewBox="0 0 24 24" class="arr-2">
                            <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"/>
                        </svg>

                        <span class="text">Register</span>

                        <span class="circle"></span>

                        <svg viewBox="0 0 24 24" class="arr-1">
                            <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"/>
                        </svg>

                    </a>
                </div>
                `
            }

        </div>
        `;
    });
}
const queryForm = document.getElementById("queryForm");

if (queryForm) {

    queryForm.addEventListener("submit", function (e) {

        e.preventDefault();

        const submitButton = queryForm.querySelector("button");

        submitButton.disabled = true;
        submitButton.innerText = "Sending...";

        emailjs.sendForm(
    "service_ur0b805",
    "template_mf68aay",
    queryForm
)
        .then(() => {

            alert("Your query has been sent successfully.");

            queryForm.reset();

        })
        .catch((error) => {

            console.error(error);

            alert("Failed to send query. Please try again.");

        })
        .finally(() => {

            submitButton.disabled = false;
            submitButton.innerText = "Send Query";

        });

    });

}
// Run exactly once on script initialization
loadDynamicSpreadsheetData();
