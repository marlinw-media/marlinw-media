const SHOP_PRODUCTS = [
  { id: 1, title: "Bild 01", category: "Editorial", price: 5, description: "Atmosphärischer Platzhalter im MarlinW Stil.", image: "images/img1.jpg" },
  { id: 2, title: "Bild 02", category: "Automotive", price: 5, description: "Kontrastreiche Bildsprache mit moderner Formsprache.", image: "images/img2.jpg" },
  { id: 3, title: "Bild 03", category: "Portrait", price: 5, description: "Minimalistischer Platzhalter für ein Portraitmotiv.", image: "images/img3.jpg" },
  { id: 4, title: "Bild 04", category: "Campaign", price: 5, description: "Visuell starke Szene für Branding und Kampagnen.", image: "images/img4.jpg" },
  { id: 5, title: "Bild 05", category: "Location", price: 5, description: "Architektur und Raumwirkung als Galerie-Motiv.", image: "images/img5.jpg" },
  { id: 6, title: "Bild 06", category: "Studio", price: 5, description: "Hochwertige Studioästhetik mit klarer Lichtkante.", image: "images/img6.jpg" },
  { id: 7, title: "Bild 07", category: "Event", price: 5, description: "Dynamischer Event-Placeholder mit Tiefe.", image: "images/img7.jpg" },
  { id: 8, title: "Bild 08", category: "Commercial", price: 5, description: "Klares Werbemotiv mit elegantem Look.", image: "images/img8.jpg" },
  { id: 9, title: "Bild 09", category: "Social", price: 5, description: "Modernes Social-Visual für Feed oder Story.", image: "images/img9.jpg" },
  { id: 10, title: "Bild 10", category: "Fine Art", price: 5, description: "Galerie-Placeholder mit ruhiger visueller Wirkung.", image: "images/img10.jpg" }
];

const PORTFOLIO_DETAILS = {
  1: {
    title: "Editorial Shooting",
    category: "Fotografie",
    text: "Moderne Portraits, stilvolle Fotoserien und hochwertige Bildwelten, die Persönlichkeit, Ästhetik und Charakter sichtbar machen. Ideal für Personal Branding, Social Media, Kampagnen oder einen professionellen Gesamtauftritt.",
    images: ["images/portfolio1-1.jpg", "images/portfolio1-2.jpg", "images/portfolio1-3.jpg"]
  },
  2: {
    title: "Automotive Content",
    category: "Auto",
    text: "Professionelle Fotos und Videos für Fahrzeuge — ob kinoreif inszeniert, modern und clean oder perfekt zugeschnitten für Instagram, Reels und Social Media. Für Privatkunden, Unternehmen und Marken mit Anspruch.",
    images: ["images/portfolio2-1.jpg", "images/portfolio2-2.jpg", "images/portfolio2-3.jpg"]
  },
  3: {
    title: "Branding Content",
    category: "Branding",
    text: "Produkte und Marken hochwertig in Szene gesetzt — mit starken Bildern und Videos, die Aufmerksamkeit erzeugen, Vertrauen aufbauen und deine Marke professionell präsentieren. Für Kampagnen, Launches und Werbeinhalte.",
    images: ["images/portfolio3-1.jpg", "images/portfolio3-2.jpg", "images/portfolio3-3.jpg"]
  },
  4: {
    title: "Event Coverage",
    category: "Events",
    text: "Begleitung von Events, Firmenevents, Feiern und größeren Produktionen mit Fokus auf Atmosphäre, Emotion und professioneller Dokumentation. Perfekt für Erinnerungen, Werbung und Social Media Nachbereitung.",
    images: ["images/portfolio4-1.jpg", "images/portfolio4-2.jpg", "images/portfolio4-3.jpg"]
  },
  5: {
    title: "Wedding Content",
    category: "Hochzeiten",
    text: "Hochzeiten stilvoll und emotional festgehalten — in Bildern und Videos, die echte Momente transportieren. Elegant, modern und auf Wunsch sowohl zeitlos als auch social-media-tauglich umgesetzt.",
    images: ["images/portfolio5-1.jpg", "images/portfolio5-2.jpg", "images/portfolio5-3.jpg"]
  },
  6: {
    title: "Grafikdesign",
    category: "Design",
    text: "Logos, Flyer, Plakate und visuelle Konzepte, die auf persönliche Wünsche und den Charakter deiner Marke zugeschnitten sind. Individuell gestaltet, professionell aufbereitet und mit klarem Wiedererkennungswert.",
    images: ["images/portfolio6-1.jpg", "images/portfolio6-2.jpg", "images/portfolio6-3.jpg"]
  },
  7: {
    title: "Webdesign",
    category: "Web",
    text: "Individuell angefertigte Websites mit modernem Look, klarer Struktur und starker visueller Wirkung. Passend für Unternehmen, Kreative und Marken, die online professionell und hochwertig auftreten wollen.",
    images: ["images/portfolio7-1.jpg", "images/portfolio7-2.jpg", "images/portfolio7-3.jpg"]
  }
};

const BOOKING_CONFIG = [
  {
    id: "foto",
    label: "Fotografie",
    intro: "Wähle den fotografischen Bereich, der am besten zu deinem Projekt passt.",
    items: [
      { title: "Business", price: 400, priceLabel: "~400€" },
      { title: "Werbung", price: 300, priceLabel: "~300€" },
      { title: "Immobilien", price: 250, priceLabel: "~250€" },
      { title: "Auto", price: 250, priceLabel: "~250€" },
      { title: "Artist", price: 250, priceLabel: "~250€" }
    ]
  },
  {
    id: "video",
    label: "Video",
    intro: "Wähle das Videopaket als grobe Projekt-Richtung.",
    items: [
      { title: "Musikvideo", price: 450, priceLabel: "ab ~450€", note: "Preis kann stark abweichen" },
      { title: "Auto Videos (Carporn)", price: 400, priceLabel: "ab ~400€" },
      { title: "Hochzeits-Paket", price: 1900, priceLabel: "ab ~1900€" },
      { title: "Events", price: 700, priceLabel: "ab ~700€", note: "Festival, Firmenevents, Shows… Preis kann stark abweichen" },
      { title: "Immobilien Video", price: 400, priceLabel: "ab ~400€" },
      { title: "Business Video", price: 500, priceLabel: "~500€" }
    ]
  },
  {
    id: "foto-video",
    label: "Foto & Video",
    intro: "Besonders stark, wenn ein einheitlicher Look für Bild und Video gewünscht ist.",
    featured: true,
    badge: "Im Durchschnitt 30 % sparen",
    items: [
      { title: "Auto Paket", price: 450, priceLabel: "ab ~450€" },
      { title: "Artist Video & Fotos", price: 500, priceLabel: "ab ~500€" },
      { title: "Commercial Business Paket", price: 750, priceLabel: "ab ~750€", note: "Fotos & Video, um das Business zu bewerben" },
      { title: "Immobilien Paket", price: 600, priceLabel: "ab ~600€", note: "Fotos und Videos für die Immobilie" }
    ]
  },
  {
    id: "grafikdesign",
    label: "Grafikdesign",
    intro: "Für visuelle Gestaltung, Print und markenstarke Designs.",
    items: [
      { title: "Logo", price: 250, priceLabel: "~250€" },
      { title: "Flyer", price: 200, priceLabel: "~200€" },
      { title: "Plakate", price: 200, priceLabel: "~200€" },
      { title: "Kleidung", price: 150, priceLabel: "ab ~150€" },
      { title: "Autofolierungen", price: 500, priceLabel: "~500€" }
    ]
  },
  {
    id: "website",
    label: "Website erstellen",
    intro: "Für Webprojekte mit professionellem Auftritt.",
    items: [
      { title: "Ausschließlich informative Website", price: 800, priceLabel: "800€" },
      { title: "Online Shop", price: 1200, priceLabel: "1200€" }
    ]
  }
];

const INDEX_PRELOAD_IMAGES = [
  "logo-white.png",
  "logo-black.png",
  "profil.jpg",
  "images/portfolio1.jpg",
  "images/portfolio2.jpg",
  "images/portfolio3.jpg",
  "images/portfolio4.jpg",
  "images/portfolio5.jpg",
  "images/portfolio6.jpg",
  "images/portfolio7.jpg",
  "images/partner1.jpg",
  "images/partner2.jpg",
  "images/partner3.jpg",
  "images/portfolio1-1.jpg",
  "images/portfolio1-2.jpg",
  "images/portfolio1-3.jpg",
  "images/portfolio2-1.jpg",
  "images/portfolio2-2.jpg",
  "images/portfolio2-3.jpg",
  "images/portfolio3-1.jpg",
  "images/portfolio3-2.jpg",
  "images/portfolio3-3.jpg",
  "images/portfolio4-1.jpg",
  "images/portfolio4-2.jpg",
  "images/portfolio4-3.jpg",
  "images/portfolio5-1.jpg",
  "images/portfolio5-2.jpg",
  "images/portfolio5-3.jpg",
  "images/portfolio6-1.jpg",
  "images/portfolio6-2.jpg",
  "images/portfolio6-3.jpg",
  "images/portfolio7-1.jpg",
  "images/portfolio7-2.jpg",
  "images/portfolio7-3.jpg"
];

let currentPortfolioId = null;
let currentPortfolioImageIndex = 0;
let activeBookingTab = BOOKING_CONFIG[0].id;
let portfolioTouchStartX = 0;
let portfolioTouchStartY = 0;

function getStoredUser() {
  return JSON.parse(localStorage.getItem("mw_user") || "null");
}

function setStoredUser(user) {
  localStorage.setItem("mw_user", JSON.stringify(user));
}

function getAllUsers() {
  return JSON.parse(localStorage.getItem("mw_users") || "[]");
}

function setAllUsers(users) {
  localStorage.setItem("mw_users", JSON.stringify(users));
}

function updateStoredUser(updatedUser) {
  const users = getAllUsers();
  const index = users.findIndex(user => user.email === updatedUser.email);
  if (index !== -1) {
    users[index] = updatedUser;
    setAllUsers(users);
  }
  setStoredUser(updatedUser);
}

function getDisplayName(user) {
  if (!user) return "Login";
  if (user.email && user.email.includes("@")) return user.email.split("@")[0];
  return "Profil";
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPassword(password) {
  return password.length >= 8 && password.length <= 14;
}

function preloadImages(imagePaths) {
  imagePaths.forEach(path => {
    const img = new Image();
    img.decoding = "async";
    img.loading = "eager";
    img.src = path;
  });
}

function preloadIndexPageAssets() {
  if (!document.getElementById("portfolioCarousel")) return;
  preloadImages(INDEX_PRELOAD_IMAGES);
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
  if (colorScheme.addEventListener) colorScheme.addEventListener("change", applyTheme);
  else if (colorScheme.addListener) colorScheme.addListener(applyTheme);
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

  mobileLinks.forEach(link => link.addEventListener("click", closeMobileMenu));

  document.addEventListener("click", event => {
    const isClickInsideMenu = mobileMenu.contains(event.target);
    const isClickToggle = menuToggle.contains(event.target);
    if (!isClickInsideMenu && !isClickToggle) closeMobileMenu();
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
      if (top >= section.offsetTop) currentId = section.getAttribute("id");
    });

    allNavLinks.forEach(link => {
      const href = link.getAttribute("href");
      if (!href.startsWith("#")) return;
      link.classList.toggle("active", href.replace("#", "") === currentId);
    });
  }

  window.addEventListener("scroll", setActiveNav);
  window.addEventListener("load", setActiveNav);
  setActiveNav();
}

function initProfileMenu() {
  const profile = document.getElementById("profileBox");
  const trigger = document.getElementById("profileTrigger");
  if (!profile || !trigger) return;

  trigger.addEventListener("click", e => {
    const loggedOut = profile.classList.contains("logged-out");
    if (loggedOut) {
      window.location.href = "login.html";
      return;
    }
    e.preventDefault();
    profile.classList.toggle("open");
  });

  document.addEventListener("click", e => {
    if (!profile.contains(e.target)) profile.classList.remove("open");
  });
}

function logoutUser() {
  localStorage.removeItem("mw_user");
  window.location.href = "index.html";
}

function updateUserUI() {
  const user = getStoredUser();
  const profileBox = document.getElementById("profileBox");
  const profileTrigger = document.getElementById("profileTrigger");
  const profileShort = document.getElementById("profileShort");
  const userDisplay = document.getElementById("userDisplay");
  const mobileUserDisplay = document.getElementById("mobileUserDisplay");
  const profileLinks = document.querySelectorAll(".requires-user");
  const authOnlyLinks = document.querySelectorAll(".auth-only");

  if (profileTrigger) profileTrigger.textContent = user ? "Profil" : "Login";
  if (userDisplay) userDisplay.textContent = "Login";
  if (mobileUserDisplay) mobileUserDisplay.textContent = user ? "Profil" : "Login";
  if (profileShort) profileShort.textContent = getDisplayName(user);
  if (profileBox) profileBox.classList.toggle("logged-out", !user);

  profileLinks.forEach(el => {
    el.style.display = user ? "block" : "none";
  });

  authOnlyLinks.forEach(el => {
    el.style.display = user ? "none" : "block";
  });

  if (mobileUserDisplay) {
    mobileUserDisplay.href = user ? "profile.html" : "login.html";
  }
}

function getCart() {
  return JSON.parse(localStorage.getItem("mw_cart") || "[]");
}

function setCart(cart) {
  localStorage.setItem("mw_cart", JSON.stringify(cart));
}

function addToCart(productId) {
  const cart = getCart();
  const product = SHOP_PRODUCTS.find(item => item.id === productId);
  if (!product) return;

  cart.push({
    cartId: Date.now() + Math.random(),
    id: product.id,
    title: product.title,
    price: product.price,
    image: product.image
  });

  setCart(cart);
  updateCartUI();
}

function addCustomBookingItem(title, price, category) {
  const cart = getCart();
  cart.push({
    cartId: Date.now() + Math.random(),
    id: `booking-${Date.now()}`,
    title: `${category}: ${title}`,
    price,
    image: ""
  });
  setCart(cart);
  updateCartUI();
  renderCartItems();
  openCart();
}

function removeFromCart(cartId) {
  const cart = getCart().filter(item => item.cartId !== cartId);
  setCart(cart);
  updateCartUI();
  renderCartItems();
}

function getCartTotal() {
  return getCart().reduce((sum, item) => sum + Number(item.price || 0), 0);
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
        <span>${Number(item.price).toFixed(2).replace(".", ",")} €</span>
      </div>
      <span>${Number(item.price).toFixed(2).replace(".", ",")} €</span>
      <button class="remove-item" type="button" onclick="removeFromCart(${item.cartId})">Löschen</button>
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

function checkout() {
  const user = getStoredUser();
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  window.location.href = "failed.html";
}

function openLightbox(productId) {
  const product = SHOP_PRODUCTS.find(item => item.id === productId);
  const lightbox = document.getElementById("lightbox");
  if (!product || !lightbox) return;

  document.getElementById("lightboxTitle").textContent = product.title;
  document.getElementById("lightboxCategory").textContent = product.category;
  document.getElementById("lightboxDescription").textContent = product.description;
  document.getElementById("lightboxPrice").textContent = `${product.price.toFixed(2).replace(".", ",")} €`;

  const image = document.getElementById("lightboxImage");
  if (image) {
    image.style.backgroundImage = `url('${product.image}')`;
    image.style.backgroundSize = "cover";
    image.style.backgroundPosition = "center";
  }

  const button = document.getElementById("lightboxAddButton");
  if (button) {
    button.onclick = () => {
      addToCart(product.id);
      closeLightbox();
      openCart();
    };
  }

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
      <div class="shop-image" style="background-image:url('${product.image}'); background-size:cover; background-position:center;">
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

function initHorizontalCarousel(carouselId, prevId, nextId) {
  const carousel = document.getElementById(carouselId);
  const prev = document.getElementById(prevId);
  const next = document.getElementById(nextId);
  if (!carousel || !prev || !next) return;

  const getStep = () => {
    const first = carousel.children[0];
    if (!first) return 360;
    const styles = window.getComputedStyle(carousel);
    const gap = parseFloat(styles.columnGap || styles.gap || 18);
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

  carousel.addEventListener("mousedown", e => {
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

  carousel.addEventListener("mousemove", e => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - carousel.offsetLeft;
    const walk = (x - startX) * 1.2;
    carousel.scrollLeft = scrollLeft - walk;
  });
}

function openPortfolioModal(id) {
  const modal = document.getElementById("portfolioModal");
  const data = PORTFOLIO_DETAILS[id];
  if (!modal || !data) return;

  currentPortfolioId = id;
  currentPortfolioImageIndex = 0;

  document.getElementById("portfolioModalCategory").textContent = data.category;
  document.getElementById("portfolioModalTitle").textContent = data.title;
  document.getElementById("portfolioModalText").textContent = data.text;

  updatePortfolioModalImage();
  modal.classList.add("open");
}

function updatePortfolioModalImage() {
  const data = PORTFOLIO_DETAILS[currentPortfolioId];
  const imageEl = document.getElementById("portfolioModalImage");
  const counterEl = document.getElementById("portfolioModalCounter");
  if (!data || !imageEl || !counterEl) return;

  const currentImage = data.images[currentPortfolioImageIndex];
  imageEl.style.backgroundImage = `url('${currentImage}')`;
  imageEl.style.backgroundSize = "cover";
  imageEl.style.backgroundPosition = "center";
  counterEl.textContent = `${currentPortfolioImageIndex + 1} / ${data.images.length}`;
}

function changePortfolioDetailImage(direction) {
  const data = PORTFOLIO_DETAILS[currentPortfolioId];
  if (!data) return;

  currentPortfolioImageIndex += direction;

  if (currentPortfolioImageIndex < 0) currentPortfolioImageIndex = data.images.length - 1;
  if (currentPortfolioImageIndex >= data.images.length) currentPortfolioImageIndex = 0;

  updatePortfolioModalImage();
}

function closePortfolioModal() {
  const modal = document.getElementById("portfolioModal");
  if (!modal) return;
  modal.classList.remove("open");
}

function showFormMessage(element, text, success) {
  if (!element) return;
  element.textContent = text;
  element.classList.add("show");
  element.classList.toggle("success", success);
  element.classList.toggle("error", !success);
}

function validateRegisterPasswordFields() {
  const pw = document.getElementById("registerPassword");
  const pw2 = document.getElementById("registerPasswordConfirm");
  const pwHint = document.getElementById("registerPasswordHint");
  const matchHint = document.getElementById("registerPasswordMatchHint");
  const button = document.getElementById("registerSubmit");
  if (!pw || !pw2 || !button) return;

  const validLength = isValidPassword(pw.value);
  const matches = pw.value === pw2.value && pw2.value.length > 0;

  if (pwHint) pwHint.classList.toggle("show", pw.value.length > 0 && !validLength);
  if (matchHint) matchHint.classList.toggle("show", pw2.value.length > 0 && !matches);

  button.disabled = !(validLength && matches);
}

function registerUser(event) {
  event.preventDefault();

  const firstName = document.getElementById("registerFirstName").value.trim();
  const lastName = document.getElementById("registerLastName").value.trim();
  const email = document.getElementById("registerEmail").value.trim().toLowerCase();
  const password = document.getElementById("registerPassword").value;
  const confirmPassword = document.getElementById("registerPasswordConfirm").value;
  const message = document.getElementById("registerMessage");

  const users = getAllUsers();

  if (!firstName || !lastName || !email || !password || !confirmPassword) {
    showFormMessage(message, "Bitte fülle alle Felder aus.", false);
    return;
  }

  if (!isValidEmail(email)) {
    showFormMessage(message, "Bitte gib eine gültige E-Mail-Adresse ein.", false);
    return;
  }

  if (!isValidPassword(password)) {
    showFormMessage(message, "Das Passwort muss 8-14 Zeichen lang sein.", false);
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

  const newUser = { firstName, lastName, email, password, orders: [] };
  users.push(newUser);
  setAllUsers(users);
  setStoredUser(newUser);

  showFormMessage(
    message,
    "Benutzerkonto gespeichert. In dieser statischen Version werden die Daten lokal im Browser gespeichert. Du wirst jetzt zur Startseite weitergeleitet.",
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
  const users = getAllUsers();

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

function initRegisterValidation() {
  const pw = document.getElementById("registerPassword");
  const pw2 = document.getElementById("registerPasswordConfirm");
  if (!pw || !pw2) return;

  pw.addEventListener("input", validateRegisterPasswordFields);
  pw2.addEventListener("input", validateRegisterPasswordFields);
  validateRegisterPasswordFields();
}

function initProfilePage() {
  const user = getStoredUser();
  if (!document.getElementById("profileEmail")) return;
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const email = document.getElementById("profileEmail");
  const first = document.getElementById("profileFirstName");
  const last = document.getElementById("profileLastName");
  const pw = document.getElementById("profilePasswordMasked");

  email.value = user.email;
  first.value = user.firstName || "";
  last.value = user.lastName || "";
  pw.value = "••••••••";

  initEditableField(first, "firstName");
  initEditableField(last, "lastName");
}

function initEditableField(input, key) {
  const button = document.querySelector(`[data-edit="${key}"]`);
  if (!input || !button) return;

  input.disabled = true;

  button.addEventListener("click", () => {
    if (input.disabled) {
      input.disabled = false;
      input.focus();
      button.textContent = "Speichern";
      return;
    }

    const user = getStoredUser();
    if (!user) return;

    user[key] = input.value.trim();
    updateStoredUser(user);
    input.disabled = true;
    button.textContent = "Bearbeiten";
  });
}

function initPasswordPage() {
  const user = getStoredUser();
  const email = document.getElementById("passwordEmail");
  const current = document.getElementById("currentPassword");
  const next = document.getElementById("newPassword");
  const confirm = document.getElementById("confirmPassword");
  const currentHint = document.getElementById("currentPasswordHint");
  const lengthHint = document.getElementById("newPasswordLengthHint");
  const matchHint = document.getElementById("newPasswordMatchHint");
  const save = document.getElementById("savePasswordButton");

  if (!email) return;
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  email.value = user.email;
  next.disabled = true;
  confirm.disabled = true;
  save.disabled = true;

  function validateAll() {
    const currentMatches = current.value === user.password;
    const nextValid = isValidPassword(next.value);
    const matches = next.value === confirm.value && confirm.value.length > 0;

    if (currentHint) currentHint.classList.toggle("show", current.value.length > 0 && !currentMatches);
    next.disabled = !currentMatches;
    confirm.disabled = !currentMatches;
    if (lengthHint) lengthHint.classList.toggle("show", next.value.length > 0 && !nextValid);
    if (matchHint) matchHint.classList.toggle("show", confirm.value.length > 0 && !matches);
    save.disabled = !(currentMatches && nextValid && matches);
  }

  current.addEventListener("input", validateAll);
  next.addEventListener("input", validateAll);
  confirm.addEventListener("input", validateAll);
  validateAll();
}

function saveNewPassword(event) {
  event.preventDefault();
  const user = getStoredUser();
  if (!user) return;

  const current = document.getElementById("currentPassword").value;
  const next = document.getElementById("newPassword").value;
  const confirm = document.getElementById("confirmPassword").value;
  const message = document.getElementById("passwordMessage");

  if (current !== user.password) {
    showFormMessage(message, "Das aktuelle Passwort stimmt nicht.", false);
    return;
  }

  if (!isValidPassword(next)) {
    showFormMessage(message, "Das neue Passwort muss 8-14 Zeichen lang sein.", false);
    return;
  }

  if (next !== confirm) {
    showFormMessage(message, "Die neuen Passwörter müssen übereinstimmen.", false);
    return;
  }

  user.password = next;
  updateStoredUser(user);
  showFormMessage(message, "Passwort erfolgreich gespeichert.", true);
}

function renderOrders() {
  const grid = document.getElementById("ordersGrid");
  if (!grid) return;

  const user = getStoredUser();
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const orders = user.orders || [];

  if (!orders.length) {
    grid.innerHTML = `
      <article class="order-card">
        <h3>Noch keine Bestellungen</h3>
        <p>Hier erscheint später dein Bestellverlauf.</p>
      </article>
    `;
    return;
  }

  grid.innerHTML = orders.map((order, index) => `
    <article class="order-card">
      <h3>Bestellung ${index + 1}</h3>
      <p>Datum: ${order.date}</p>
      <p>Gesamt: ${order.total}</p>
      <div class="order-products">
        ${order.items.map(item => `<div>${item.title} – ${Number(item.price).toFixed(2).replace(".", ",")} €</div>`).join("")}
      </div>
    </article>
  `).join("");
}

function renderBookingTabs() {
  const tabsEl = document.getElementById("bookingTabs");
  if (!tabsEl) return;

  tabsEl.innerHTML = BOOKING_CONFIG.map(group => `
    <button type="button"
      class="booking-tab ${group.id === activeBookingTab ? "active" : ""} ${group.featured ? "booking-tab-highlight" : ""}"
      data-booking-tab="${group.id}">
      ${group.label}
      ${group.featured ? '<span class="booking-tab-save-dot"></span>' : ""}
    </button>
  `).join("");

  tabsEl.querySelectorAll("[data-booking-tab]").forEach(button => {
    button.addEventListener("click", () => {
      activeBookingTab = button.getAttribute("data-booking-tab");
      renderBookingTabs();
      renderBookingConfigurator();
    });
  });
}

function renderBookingConfigurator() {
  const configurator = document.getElementById("bookingConfigurator");
  if (!configurator) return;

  const activeGroup = BOOKING_CONFIG.find(group => group.id === activeBookingTab) || BOOKING_CONFIG[0];

  configurator.innerHTML = `
    <div class="booking-panel ${activeGroup.featured ? "booking-panel-featured" : ""}">
      ${activeGroup.featured ? `
        <span class="booking-badge">
          <span class="booking-badge-dot"></span>
          ${activeGroup.badge}
        </span>
      ` : ""}

      <div class="booking-panel-head">
        <small class="hero-eyebrow">${activeGroup.label}</small>
        <h2>${activeGroup.label}</h2>
        <p>${activeGroup.intro}</p>
      </div>

      <div class="booking-options-grid">
        ${activeGroup.items.map(item => `
          <article class="booking-option-card">
            <div class="booking-option-head">
              <h3>${item.title}</h3>
              <span class="booking-option-price">${item.priceLabel}</span>
            </div>
            ${item.note ? `<p class="booking-option-note">${item.note}</p>` : `<p class="booking-option-note">Schätzpreis auf Basis vergangener Projekte.</p>`}
            <button
              type="button"
              class="button ${activeGroup.featured ? "primary" : ""}"
              data-booking-add='${JSON.stringify({
                category: activeGroup.label,
                title: item.title,
                price: item.price
              }).replace(/'/g, "&apos;")}'>
              Zum Warenkorb
            </button>
          </article>
        `).join("")}
      </div>
    </div>
  `;

  configurator.querySelectorAll("[data-booking-add]").forEach(button => {
    button.addEventListener("click", () => {
      const data = JSON.parse(button.getAttribute("data-booking-add"));
      addCustomBookingItem(data.title, data.price, data.category);
    });
  });
}

function initBookingPage() {
  const configurator = document.getElementById("bookingConfigurator");
  if (!configurator) return;
  renderBookingTabs();
  renderBookingConfigurator();
}

function initPortfolioSwipe() {
  const imageEl = document.getElementById("portfolioModalImage");
  if (!imageEl) return;

  imageEl.addEventListener("touchstart", event => {
    const touch = event.changedTouches[0];
    portfolioTouchStartX = touch.clientX;
    portfolioTouchStartY = touch.clientY;
  }, { passive: true });

  imageEl.addEventListener("touchend", event => {
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - portfolioTouchStartX;
    const deltaY = touch.clientY - portfolioTouchStartY;

    if (Math.abs(deltaX) < 40 || Math.abs(deltaY) > 80) return;
    if (!document.getElementById("portfolioModal")?.classList.contains("open")) return;

    if (deltaX < 0) changePortfolioDetailImage(1);
    else changePortfolioDetailImage(-1);
  }, { passive: true });
}

function initGlobalEvents() {
  const cartOverlay = document.getElementById("cartOverlay");
  const lightbox = document.getElementById("lightbox");
  const portfolioModal = document.getElementById("portfolioModal");

  if (cartOverlay) {
    cartOverlay.addEventListener("click", e => {
      if (e.target === cartOverlay) closeCart();
    });
  }

  if (lightbox) {
    lightbox.addEventListener("click", e => {
      if (e.target === lightbox) closeLightbox();
    });
  }

  if (portfolioModal) {
    portfolioModal.addEventListener("click", e => {
      if (e.target === portfolioModal) closePortfolioModal();
    });
  }

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      closeCart();
      closeLightbox();
      closePortfolioModal();
    }

    if (document.getElementById("portfolioModal")?.classList.contains("open")) {
      if (e.key === "ArrowRight") changePortfolioDetailImage(1);
      if (e.key === "ArrowLeft") changePortfolioDetailImage(-1);
    }
  });

  initPortfolioSwipe();
}

document.addEventListener("DOMContentLoaded", () => {
  preloadIndexPageAssets();
  initThemeListener();
  initMobileMenu();
  initActiveNav();
  initProfileMenu();
  updateUserUI();
  updateCartUI();
  renderCartItems();
  renderShopGrid();
  initHorizontalCarousel("portfolioCarousel", "portfolioPrev", "portfolioNext");
  initHorizontalCarousel("partnerCarousel", "partnerPrev", "partnerNext");
  initRegisterValidation();
  initProfilePage();
  initPasswordPage();
  renderOrders();
  initBookingPage();
  initGlobalEvents();
});
