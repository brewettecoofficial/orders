/**
 * Brewette ordering flow (static GitHub Pages)
 * 1) User fills customer details
 * 2) User adjusts quantities
 * 3) Totals update (subtotal + delivery)
 * 4) On Place Order => POST JSON to Apps Script
 * 5) Apps Script appends a row in Google Sheet
 */

// ====== CONFIG ======
const UPI_ID = "apoorvak999@oksbi";
const PAYEE_NAME = "Apoorva Korabondy";

// Paste your Apps Script Web App URL here (Deploy -> Web app -> copy URL)
const SHEET_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbwjx4taFxEhhBdMwfYdrnCXmi_aL-lONoM_hUtqEnKI8tG9Bbc71eG8uXTnZMmbw0g/exec";

// Delivery fee (flat)
const DELIVERY_FEE = 0;

// Max per item
const MAX_QTY = 5;

// Menu
const MENU = {
  coconut_hot:     { name: "Coconut Cloud (Hot)",       price: 350 },
  pourover_hot:    { name: "Hot Pour Over",            price: 325 },
  lavender_tea:    { name: "Lavender Cranberry Tea",   price: 310 },
  caramella_iced:  { name: "Caramella (Iced)",         price: 400 },
  orange_coldbrew: { name: "Orange Cold Brew",         price: 380 },
  oatmilk_matcha:  { name: "Oatmilk Matcha (Iced)",    price: 415 }
};

// State
const order = Object.fromEntries(Object.keys(MENU).map(k => [k, 0]));

// ====== Helpers ======
function formatINR(n) { return `₹${n}`; }

function computeSubtotal() {
  return Object.keys(order).reduce((sum, key) => sum + order[key] * MENU[key].price, 0);
}

function computeTotal() {
  return computeSubtotal() + DELIVERY_FEE;
}

function clampQty(q) {
  return Math.max(0, Math.min(MAX_QTY, q));
}

function buildUpiLink() {
  // Total amount into UPI deep link (works best on Android; varies on iOS)
  const amt = computeTotal();
  return `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(PAYEE_NAME)}&am=${amt}&cu=INR`;
}

function render() {
  // Update qty UI
  for (const key of Object.keys(order)) {
    const el = document.getElementById(`qty-${key}`);
    if (el) el.textContent = String(order[key]);
  }

  const subtotal = computeSubtotal();

  const subtotalEl = document.getElementById("subtotalAmount");
  if (subtotalEl) subtotalEl.textContent = formatINR(subtotal);

  const deliveryEl = document.getElementById("deliveryAmount");
  if (deliveryEl) deliveryEl.textContent = formatINR(DELIVERY_FEE);

  const totalEl = document.getElementById("totalAmount");
  if (totalEl) totalEl.textContent = formatINR(subtotal + DELIVERY_FEE);

  const upiLink = document.getElementById("upiLink");
  if (upiLink) upiLink.href = buildUpiLink();
}
}

  // Totals
  const subtotal = computeSubtotal();
  document.getElementById("subtotalAmount").textContent = formatINR(subtotal);
  document.getElementById("deliveryAmount").textContent = formatINR(DELIVERY_FEE);
  document.getElementById("totalAmount").textContent = formatINR(subtotal + DELIVERY_FEE);

  // Update UPI link with live total
  document.getElementById("upiLink").href = buildUpiLink();
}

// ====== Quantity buttons ======
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".stepper-btn");
  if (!btn) return;

  const key = btn.dataset.item;
  const change = Number(btn.dataset.change || 0);
  if (!MENU[key]) return;

  order[key] = clampQty(order[key] + change);
  render();
});

// ====== Copy UPI ======
document.getElementById("copyUpiBtn").addEventListener("click", async () => {
  const status = document.getElementById("copyStatus");
  try {
    await navigator.clipboard.writeText(UPI_ID);
    status.textContent = "UPI ID copied.";
    setTimeout(() => (status.textContent = ""), 1500);
  } catch {
    status.textContent = `Copy this UPI ID: ${UPI_ID}`;
  }
});

// ====== Submit order ======
document.getElementById("placeOrderBtn").addEventListener("click", submitOrder);

async function submitOrder() {
  const name = document.getElementById("customerName").value.trim();
  const phone = document.getElementById("customerPhone").value.trim();
  const address = document.getElementById("customerAddress").value.trim();

  if (!name || !phone || !address) {
    alert("Please fill in all details.");
    return;
  }

  const items = Object.keys(order)
    .filter((k) => order[k] > 0)
    .map((k) => ({
      key: k,
      name: MENU[k].name,
      qty: order[k],
      price: MENU[k].price,
      lineTotal: order[k] * MENU[k].price
    }));

  if (items.length === 0) {
    alert("Please select at least one drink.");
    return;
  }

  const payload = {
    customer: { name, phone, address },
    items,
    subtotalAmount: computeSubtotal(),
    deliveryFee: DELIVERY_FEE,
    totalAmount: computeTotal(),
    createdAt: new Date().toISOString()
  };

  const btn = document.getElementById("placeOrderBtn");
  btn.disabled = true;
  btn.textContent = "Placing order...";

  try {
    if (!SHEET_WEBHOOK_URL || SHEET_WEBHOOK_URL.includes("PASTE_YOUR")) {
      throw new Error("Apps Script URL not set in script.js");
    }

    // Apps Script often behaves best when sent as text/plain
    const res = await fetch(SHEET_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });

    const text = await res.text();
    if (!res.ok) throw new Error(text || `HTTP ${res.status}`);

    alert("Order saved! ✅");

    // Reset order quantities
    for (const k of Object.keys(order)) order[k] = 0;
    render();

  } catch (err) {
    console.error(err);
    alert("Could not save order. Please try again.");
  } finally {
    btn.disabled = false;
    btn.textContent = "Place Order";
  }
}

// Initial render
render();



