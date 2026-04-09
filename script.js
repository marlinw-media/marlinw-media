let cart = JSON.parse(localStorage.getItem("cart")) || [];

function toggleMenu(){
  const menu = document.getElementById("mobileMenu");
  menu.style.display = menu.style.display === "block" ? "none" : "block";
}

function addToCart(name,price){
  cart.push({name,price});
  localStorage.setItem("cart",JSON.stringify(cart));
  updateCart();
}

function updateCart(){
  const count = document.getElementById("cart-count");
  if(count) count.innerText = cart.length;
}

function openCart(){
  alert(JSON.stringify(cart));
}

function login(){
  const name = document.getElementById("name").value;
  localStorage.setItem("user",name);
  window.location.href="index.html";
}

function goHome(){
  window.location.href="index.html";
}

window.onload = () => {
  updateCart();

  const user = localStorage.getItem("user");
  if(user){
    const el = document.getElementById("userDisplay");
    if(el) el.innerText = user;
  }
};
