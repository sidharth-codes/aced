 // Get the logo box and logo elements
 const box = document.getElementById("logo_box");
 const logo = document.getElementById("logo");
// Add a click event listener to change logo box and logo size and position
  document.addEventListener("click", (e) => {
    box.style.left =50 + "px";
    box.style.top = 50 + "px";
    box.style.width=75 + "px";
    box.style.height=75 + "px";
    logo.style.width=75 + "px";
    logo.style.height=75 + "px";
  });