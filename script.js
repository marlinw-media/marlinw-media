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
  if (user.email && user.email.includes("@")) {
    return user.email.split("@")[0];
  }
  return "Profil";
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPassword(password) {
  return password.length >= 8 && password.length <= 14;
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

function initProfileMenu() {
  const profile = document.getElementById("profileBox");
  const trigger = document.getElementById("profileTrigger");

  if (!profile || !trigger) return;

  trigger.addEventListener("click", (e) => {
    const loggedOut = profile.classList.contains("logged-out");
    if (loggedOut) {
      window.location.href = "login.html";
      return;
    }

    e.preventDefault();
    profile.classList.toggle("open");
  });

  document.addEventListener("click", (e) => {
    if (!profile.contains(e.target)) {
      profile.classList.remove("open");
    }
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
  const loginFab = document.getElementById("loginFab");
  const profileLinks = document.querySelectorAll(".requires-user");
  const authOnlyLinks = document.querySelectorAll(".auth-only");

  if (profileTrigger) {
    profileTrigger.textContent = user ? "Profil" : "Login";
  }

  if (userDisplay) userDisplay.textContent = "Login";
  if (mobileUserDisplay) mobileUserDisplay.textContent = user ? "Profil" : "Login";
  if (profileShort) profileShort.textContent = getDisplayName(user);
  if (loginFab) loginFab.setAttribute("aria-label", user ? "Profil" : "Login");

  if (profileBox) {
    profileBox.classList.toggle("logged-out", !user);
  }

  profileLinks.forEach(el => {
    el.style.display = user ? "block" : "none";
  });

  authOnlyLinks.forEach(el => {
    el.style.display = user ? "block" : "none";
  });
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

  if (pw.value.length > 0 && !validLength) {
    pwHint.classList.add("show");
  } else {
    pwHint.classList.remove("show");
  }

  if (pw2.value.length > 0 && !matches) {
    matchHint.classList.add("show");
  } else {
    matchHint.classList.remove("show");
  }

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

  const newUser = {
    firstName,
    lastName,
    email,
    password,
    orders: []
  };

  users.push(newUser);
  setAllUsers(users);
  setStoredUser(newUser);

  showFormMessage(
    message,
    "Benutzerkonto gespeichert. In dieser GitHub-Pages-Version werden die Daten lokal im Browser gespeichert. Du wirst jetzt zur Startseite weitergeleitet.",
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

    if (current.value.length > 0 && !currentMatches) {
      currentHint.classList.add("show");
    } else {
      currentHint.classList.remove("show");
    }

    next.disabled = !currentMatches;
    confirm.disabled = !currentMatches;

    if (next.value.length > 0 && !nextValid) {
      lengthHint.classList.add("show");
    } else {
      lengthHint.classList.remove("show");
    }

    if (confirm.value.length > 0 && !matches) {
      matchHint.classList.add("show");
    } else {
      matchHint.classList.remove("show");
    }

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
        ${order.items.map(item => `<div>${item.title} – ${item.price.toFixed(2).replace(".", ",")} €</div>`).join("")}
      </div>
    </article>
  `).join("");
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
  initProfileMenu();
  updateUserUI();
  updateCartUI();
  renderCartItems();
  renderShopGrid();
  initPortfolioCarousel();
  initRegisterValidation();
  initProfilePage();
  initPasswordPage();
  renderOrders();
  initGlobalEvents();
});
