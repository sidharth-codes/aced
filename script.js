/**
 * Launch Animation Handler
 * Supports both desktop clicks and mobile touch events.
 */
function startLogoAnimation() {
  // Prevent running twice
  if (box.classList.contains("shrunk")) return;

  // Shrink the logo box and reposition it to top-left
  box.style.left = "50px";
  box.style.top = "50px";
  box.style.width = "75px";
  box.style.height = "75px";

  // Match the inner logo image dimensions
  logo.style.width = "75px";
  logo.style.height = "75px";

  // Enable responsive CSS state
  box.classList.add("shrunk");

  // Reveal SPA wrapper
  if (appWrapper && !appWrapper.classList.contains("visible")) {
    appWrapper.classList.add("visible");
    document.body.style.overflow = "auto";

    setTimeout(() => {
      const activeBtn = document.querySelector(".nav-btn.active");
      moveIndicator(activeBtn);
    }, 50);
  }
}

/**
 * Desktop Support
 */
document.addEventListener("click", startLogoAnimation, {
  once: true
});

/**
 * Mobile Touch Support
 */
document.addEventListener("touchstart", startLogoAnimation, {
  passive: true,
  once: true
});/**
 * Maps raw backend JSON structural layers into the target carousel elements
 * SECURITY-HARDENED VERSION
 */
function renderRecognition(dataArr) {
  const track = document.getElementById("highlight-track");

  if (!track || !dataArr || dataArr.length === 0) return;

  track.innerHTML = "";

  dataArr.forEach(item => {
    const rawUrl =
      item.ImageURL ||
      item.imageUrl ||
      item.ImgURL ||
      item.imgUrl ||
      item.src ||
      "";

    const cleanUrl = cleanDriveImageUrl(rawUrl);

    const card = document.createElement("div");
    card.className = "card highlight-card";

    const media = document.createElement("div");
    media.className = "card-media";

    if (cleanUrl) {
      const img = document.createElement("img");
      img.src = cleanUrl;
      img.alt = item.Title || item.title || "Highlight";
      img.className = "photo-img";
      media.appendChild(img);
    }

    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = item.Tag || item.tag || "";
    media.appendChild(tag);

    const body = document.createElement("div");
    body.className = "card-body";

    const date = document.createElement("span");
    date.className = "card-date";
    date.textContent = item.Date || item.date || "";

    const title = document.createElement("h4");
    title.textContent = item.Title || item.title || "";

    const description = document.createElement("p");
    description.textContent =
      item.Description ||
      item.description ||
      "";

    body.appendChild(date);
    body.appendChild(title);
    body.appendChild(description);

    card.appendChild(media);
    card.appendChild(body);

    track.appendChild(card);
  });
}

/**
 * Gallery Renderer
 * SECURITY-HARDENED VERSION
 */
function renderGallery(dataArr) {
  const track = document.getElementById("gallery-track");

  if (!track || !dataArr || dataArr.length === 0) return;

  track.innerHTML = "";

  dataArr.forEach(item => {
    const rawUrl =
      item.ImageURL ||
      item.imageUrl ||
      item.ImgURL ||
      item.imgUrl ||
      item.src ||
      "";

    const cleanUrl = cleanDriveImageUrl(rawUrl);

    if (!cleanUrl) return;

    const photoCard = document.createElement("div");
    photoCard.className = "photo-card";

    const img = document.createElement("img");
    img.src = cleanUrl;
    img.alt =
      item.AltText ||
      item.altText ||
      "Gallery Image";
    img.className = "photo-img";

    photoCard.appendChild(img);

    track.appendChild(photoCard);
  });
}

/**
 * Renders data to About Page .gallery element
 * Expected Column Layout:
 * ImageURL | AltText | Name | Designation
 *
 * SECURITY-HARDENED VERSION
 */
function renderMembers(dataArr) {
  const gallery = document.querySelector("#about .gallery");

  if (!gallery || !dataArr || dataArr.length === 0) return;

  gallery.innerHTML = "";

  dataArr.forEach(item => {
    const rawUrl =
      item.ImageURL ||
      item.imageUrl ||
      item.ImgURL ||
      item.imgUrl ||
      item.src ||
      "";

    const cleanUrl = cleanDriveImageUrl(rawUrl);

    if (!cleanUrl) return;

    const memberCard = document.createElement("div");
    memberCard.className = "member-card";

    const img = document.createElement("img");
    img.src = cleanUrl;
    img.alt =
      item.AltText ||
      item.Name ||
      "Executive Member";
    img.className = "member-img";

    const name = document.createElement("h3");
    name.className = "member-name";
    name.textContent =
      item.Name ||
      item.name ||
      "";

    const role = document.createElement("p");
    role.className = "member-role";
    role.textContent =
      item.Designation ||
      item.designation ||
      item.Role ||
      item.role ||
      "";

    memberCard.appendChild(img);
    memberCard.appendChild(name);
    memberCard.appendChild(role);

    gallery.appendChild(memberCard);
  });
}
