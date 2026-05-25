 const box = document.getElementById("logo_box");
 const logo = document.getElementById("logo");

  document.addEventListener("click", (e) => {
    box.style.left =50 + "px";
    box.style.top = 50 + "px";
    box.style.width=75 + "px";
    box.style.height=75 + "px";
    logo.style.width=75 + "px";
    logo.style.height=75 + "px";
  });