const SHOP_PRODUCTS = [
  { id: 1, title: "Bild 01", category: "Editorial", price: 5, description: "Atmosphärischer Platzhalter im MarlinW Stil." },
  { id: 2, title: "Bild 02", category: "Automotive", price: 5, description: "Kontrastreiche Bildsprache mit moderner Formsprache." },
  { id: 3, title: "Bild 03", category: "Portrait", price: 5, description: "Minimalistischer Platzhalter für ein Portraitmotiv." },
  { id: 4, title: "Bild 04", category: "Campaign", price: 5, description: "Visuell starke Szene für Branding und Kampagnen." },
  { id: 5, title: "Bild 05", category: "Location", price: 5, description: "Architektur und Raumwirkung als Galerie-Motiv." },
  { id: 6, title: "Bild 06", category: "Studio", price: 5, description: "Hochwertige Studioästhetik mit klarer Lichtkante." },
  { id: 7, title: "Bild 07", category: "Event", price: 5, description: "Dynamischer Event-Placeholder mit Tiefe." },
  { id: 8, title: "Bild 08", category: "Commercial", price: 5, description: "Klares Werbemotiv mit elegantem Look." },
  { id: 9, title: "Bild 09", category: "Social", price: 5, description: "Modernes Social-Visual für Feed oder Story." },
  { id: 10, title: "Bild 10", category: "Fine Art", price: 5, description: "Galerie-Placeholder mit ruhiger visueller Wirkung." }
];

function getStoredUser() {
  return JSON.parse(localStorage.getItem("mw_user") || "null");
}

function setStoredUser(user) {
  localStorage.setItem("mw_user", JSON.stringify(user));
}

function getCart() {
  return JSON.parse(localStorage.getItem("mw_cart") || "[]");
}

function setCart(cart) {
  localStorage.setItem("mw_cart", JSON.stringify(cart));
}

function getDisplayName(user) {
  if (!user) return "Login";
  if (user.email && user.email.includes("@")) {
    return user.email.split("@")[0];
  }
  return user.firstName || user.name || user.username || "Login";
}

function applyTheme() {
  const brandLogo = document.getElementById("brandLogo");
  const cartBrandLogo = document.getElementById("cartBrandLogo");
  const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;

  document.body.classList.toggle("light-mode", prefersLight);

  const themeColor = document.querySelector('meta[name="theme-color"]');
  if (themeColor) {
    themeColor.setAttribute("content", prefersLight ? "#f7f7f7" : "#000000");
  }

  const logoSrc = prefersLight ? "logo-black.png" : "logo-white.png";
  if (brandLogo) brandLogo.src = logoSrc;
  if (cartBrandLogo) cartBrandLogo.src = logoSrc;
}

function initThemeListener() {
  applyTheme();
  const colorScheme = window.matchMedia("(prefers-color-scheme: light)");
  if (colorScheme.addEventListener) {
    colorScheme.addEventListener("change", applyTheme);
  } else if (colorScheme.addListener) {
    colorScheme.addListener(applyTheme);
  }
}

function initMobileMenu() {
  const menuToggle = document.getElementById("menuToggle");
  const mobileMenu = document.getElementById("mobileMenu");
  const mobileLinks = document.querySelectorAll(".mobile-nav a");

  if (!menuToggle || !mobileMenu) return;

  function closeMobileMenu() {
    mobileMenu.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  }

  menuToggle.addEventListener("click", () => {
    const isOpen = mobileMenu.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  mobileLinks.forEach(link => {
    link.addEventListener("click", closeMobileMenu);
  });

  document.addEventListener("click", (event) => {
    const isClickInsideMenu = mobileMenu.contains(event.target);
    const isClickToggle = menuToggle.contains(event.target);

    if (!isClickInsideMenu && !isClickToggle) {
      closeMobileMenu();
    }
  });
}

function initActiveNav() {
  const sections = document.querySelectorAll("main section[id]");
  const allNavLinks = document.querySelectorAll(".desktop-nav a[href^='#'], .mobile-nav a[href^='#']");

  if (!sections.length || !allNavLinks.length) return;

  function setActiveNav() {
    let currentId = "home";

    sections.forEach(section => {
      const top = window.scrollY + 150;
      if (top >= section.offsetTop) {
        currentId = section.getAttribute("id");
      }
    });

    allNavLinks.forEach(link => {
      const href = link.getAttribute("href");
      if (!href.startsWith("#")) return;
      const target = href.replace("#", "");
      link.classList.toggle("active", target === currentId);
    });
  }

  window.addEventListener("scroll", setActiveNav);
  window.addEventListener("load", setActiveNav);
  setActiveNav();
}

function updateUserUI() {
  const user = getStoredUser();
  const displayName = getDisplayName(user);
  const userDisplay = document.getElementById("userDisplay");
  const mobileUserDisplay = document.getElementById("mobileUserDisplay");
  const loginFab = document.getElementById("loginFab");

  if (userDisplay) userDisplay.textContent = displayName;
  if (mobileUserDisplay) mobileUserDisplay.textContent = displayName;
  if (loginFab) loginFab.setAttribute("aria-label", user ? displayName : "Login");
}

function addToCart(productId) {
  const cart = getCart();
  const product = SHOP_PRODUCTS.find(item => item.id === productId);
  if (!product) return;

  cart.push({
    cartId: Date.now() + Math.random(),
    id: product.id,
    title: product.title,
    price: product.price
  });

  setCart(cart);
  updateCartUI();
}

function removeFromCart(cartId) {
  const cart = getCart().filter(item => item.cartId !== cartId);
  setCart(cart);
  updateCartUI();
  renderCartItems();
}

function getCartTotal() {
  return getCart().reduce((sum, item) => sum + item.price, 0);
}

function updateCartUI() {
  const count = getCart().length;
  document.querySelectorAll(".cart-count").forEach(el => {
    el.textContent = count;
  });

  const cartTotal = document.getElementById("cartTotal");
  if (cartTotal) {
    cartTotal.textContent = `${getCartTotal().toFixed(2).replace(".", ",")} €`;
  }
}

function renderCartItems() {
  const cartItems = document.getElementById("cartItems");
  if (!cartItems) return;

  const cart = getCart();

  if (!cart.length) {
    cartItems.innerHTML = `<p class="empty-state">Dein Warenkorb ist aktuell leer.</p>`;
    updateCartUI();
    return;
  }

  cartItems.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div>
        <strong>${item.title}</strong>
        <span>${item.price.toFixed(2).replace(".", ",")} €</span>
      </div>
      <span>${item.price.toFixed(2).replace(".", ",")} €</span>
      <button class="remove-item" type="button" onclick="removeFromCart(${item.cartId})" aria-label="Produkt entfernen">
        🗑
      </button>
    </div>
  `).join("");

  updateCartUI();
}

function openCart() {
  const overlay = document.getElementById("cartOverlay");
  if (!overlay) return;
  overlay.classList.add("open");
  renderCartItems();
  applyTheme();
}

function closeCart() {
  const overlay = document.getElementById("cartOverlay");
  if (!overlay) return;
  overlay.classList.remove("open");
}

function openLightbox(productId) {
  const product = SHOP_PRODUCTS.find(item => item.id === productId);
  const lightbox = document.getElementById("lightbox");
  if (!product || !lightbox) return;

  document.getElementById("lightboxTitle").textContent = product.title;
  document.getElementById("lightboxCategory").textContent = product.category;
  document.getElementById("lightboxDescription").textContent = product.description;
  document.getElementById("lightboxPrice").textContent = `${product.price.toFixed(2).replace(".", ",")} €`;

  const button = document.getElementById("lightboxAddButton");
  button.onclick = () => {
    addToCart(product.id);
    closeLightbox();
    openCart();
  };

  lightbox.classList.add("open");
}

function closeLightbox() {
  const lightbox = document.getElementById("lightbox");
  if (!lightbox) return;
  lightbox.classList.remove("open");
}

function renderShopGrid() {
  const shopGrid = document.getElementById("shopGrid");
  if (!shopGrid) return;

  shopGrid.innerHTML = SHOP_PRODUCTS.map(product => `
    <article class="shop-card" onclick="openLightbox(${product.id})" tabindex="0">
      <div class="shop-image">
        <span class="placeholder-label">${product.category}</span>
        <span class="shop-price-badge">${product.price.toFixed(2).replace(".", ",")} €</span>
      </div>
      <div class="item-body">
        <h3>${product.title}</h3>
        <p>${product.description}</p>
      </div>
    </article>
  `).join("");
}

function initPortfolioCarousel() {
  const carousel = document.getElementById("portfolioCarousel");
  const prev = document.getElementById("portfolioPrev");
  const next = document.getElementById("portfolioNext");
  if (!carousel || !prev || !next) return;

  const getStep = () => {
    const first = carousel.querySelector(".portfolio-slide");
    if (!first) return 360;
    const gap = 18;
    return first.getBoundingClientRect().width + gap;
  };

  prev.addEventListener("click", () => {
    carousel.scrollBy({ left: -getStep(), behavior: "smooth" });
  });

  next.addEventListener("click", () => {
    carousel.scrollBy({ left: getStep(), behavior: "smooth" });
  });

  let isDown = false;
  let startX = 0;
  let scrollLeft = 0;

  carousel.addEventListener("mousedown", (e) => {
    isDown = true;
    carousel.classList.add("dragging");
    startX = e.pageX - carousel.offsetLeft;
    scrollLeft = carousel.scrollLeft;
  });

  carousel.addEventListener("mouseleave", () => {
    isDown = false;
    carousel.classList.remove("dragging");
  });

  carousel.addEventListener("mouseup", () => {
    isDown = false;
    carousel.classList.remove("dragging");
  });

  carousel.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - carousel.offsetLeft;
    const walk = (x - startX) * 1.2;
    carousel.scrollLeft = scrollLeft - walk;
  });
}

function registerUser(event) {
  event.preventDefault();

  const firstName = document.getElementById("registerFirstName").value.trim();
  const lastName = document.getElementById("registerLastName").value.trim();
  const email = document.getElementById("registerEmail").value.trim().toLowerCase();
  const password = document.getElementById("registerPassword").value;
  const confirmPassword = document.getElementById("registerPasswordConfirm").value;
  const message = document.getElementById("registerMessage");

  const users = JSON.parse(localStorage.getItem("mw_users") || "[]");

  if (!firstName || !lastName || !email || !password || !confirmPassword) {
    showFormMessage(message, "Bitte fülle alle Felder aus.", false);
    return;
  }

  if (password !== confirmPassword) {
    showFormMessage(message, "Die Passwörter stimmen nicht überein.", false);
    return;
  }

  if (users.some(user => user.email === email)) {
    showFormMessage(message, "Für diese E-Mail gibt es bereits ein Konto.", false);
    return;
  }

  const newUser = { firstName, lastName, email, password };
  users.push(newUser);
  localStorage.setItem("mw_users", JSON.stringify(users));
  setStoredUser(newUser);

  showFormMessage(
    message,
    "Benutzerkonto gespeichert. Auf GitHub Pages kann keine echte Bestätigungs-E-Mail versendet werden, daher wurde dein Konto lokal angelegt und du wirst jetzt zur Startseite zurückgeleitet.",
    true
  );

  setTimeout(() => {
    window.location.href = "index.html";
  }, 1400);
}

function loginUser(event) {
  event.preventDefault();

  const identifier = document.getElementById("loginIdentifier").value.trim().toLowerCase();
  const password = document.getElementById("loginPassword").value;
  const message = document.getElementById("loginMessage");
  const users = JSON.parse(localStorage.getItem("mw_users") || "[]");

  const user = users.find(entry => {
    const emailMatch = entry.email.toLowerCase() === identifier;
    const usernameMatch = entry.email.split("@")[0].toLowerCase() === identifier;
    return (emailMatch || usernameMatch) && entry.password === password;
  });

  if (!user) {
    showFormMessage(message, "Login fehlgeschlagen. Bitte prüfe E-Mail/Benutzername und Passwort.", false);
    return;
  }

  setStoredUser(user);
  showFormMessage(message, "Login erfolgreich. Du wirst jetzt weitergeleitet.", true);

  setTimeout(() => {
    window.location.href = "index.html";
  }, 900);
}

function showFormMessage(element, text, success) {
  if (!element) return;
  element.textContent = text;
  element.classList.add("show");
  element.classList.toggle("success", success);
  element.classList.toggle("error", !success);
}

function initGlobalEvents() {
  const cartOverlay = document.getElementById("cartOverlay");
  const lightbox = document.getElementById("lightbox");

  if (cartOverlay) {
    cartOverlay.addEventListener("click", (e) => {
      if (e.target === cartOverlay) closeCart();
    });
  }

  if (lightbox) {
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) closeLightbox();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeCart();
      closeLightbox();
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initThemeListener();
  initMobileMenu();
  initActiveNav();
  updateUserUI();
  updateCartUI();
  renderCartItems();
  renderShopGrid();
  initPortfolioCarousel();
  initGlobalEvents();
});
