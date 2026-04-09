let cart = JSON.parse(localStorage.getItem("cart")) || [];

function toggleMenu(){
  const menu = document.getElementById("mobileMenu");
  menu.classList.toggle("open");
}

function goHome(){
  window.location.href="index.html";
}

function addToCart(name,price){
  cart.push({name,price});
  localStorage.setItem("cart",JSON.stringify(cart));
  updateCart();
}

function removeFromCart(index){
  cart.splice(index,1);
  localStorage.setItem("cart",JSON.stringify(cart));
  updateCart();
}

function updateCart(){
  const el = document.getElementById("cart-count");
  if(el) el.innerText = cart.length;
}

function openCart(){
  let text = "Warenkorb:\n\n";
  let total = 0;

  cart.forEach((item,i)=>{
    text += `${item.name} - ${item.price}€\n`;
    total += item.price;
  });

  text += "\nGesamt: " + total + "€";

  alert(text);
}

function login(){
  const name = document.getElementById("name").value;
  localStorage.setItem("user",name);
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
