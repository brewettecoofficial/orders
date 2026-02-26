/**
 * Brewette ordering flow (static GitHub Pages)
 * - Time-gated access (Fri-Sat, 9AM-7PM IST)
 * - Stepper buttons update quantities
 * - Total amount updates live
 * - Place Order posts to Apps Script
 */

// ===== CONFIG =====
const UPI_ID = "apoorvak999@oksbi";
const SHEET_WEBHOOK_URL =
  "https://script.google.com/macros/s/AKfycbx7pLv3RSbc4bj2SrMKQgnqiXqgvpJxo-c6UGVKYex1-kjfLersTRQ2_OFeVNlkVpkllA/exec";
const MAX_QTY = 3;

// Menu with launch pricing
const MENU = {
  caramella_regular:          { name: "Caramella",           size: "Regular (250ml)", price: 380 },
  caramella_signature:        { name: "Caramella",           size: "Signature (470ml)", price: 430 },
  orange_coldbrew_regular:    { name: "Orange Cold Brew",    size: "Regular (250ml)", price: 330 },
  orange_coldbrew_signature:  { name: "Orange Cold Brew",    size: "Signature (470ml)", price: 430 },
  oatmilk_matcha_regular:     { name: "Oatmilk Matcha Latte", size: "Regular (250ml)", price: 390 },
  oatmilk_matcha_signature:   { name: "Oatmilk Matcha Latte", size: "Signature (470ml)", price: 490 },
  earl_grey_regular:          { name: "Earl Grey Milk Tea",  size: "Regular (250ml)", price: 360 },
  earl_grey_signature:        { name: "Earl Grey Milk Tea",  size: "Signature (470ml)", price: 430 },
  iced_pourover_regular:      { name: "Iced Pour Over",      size: "Regular (250ml)", price: 320 },
  iced_pourover_signature:    { name: "Iced Pour Over",      size: "Signature (470ml)", price: 380 },
  espresso_tonic_regular:     { name: "Espresso Tonic",      size: "Regular (250ml)", price: 380 },
  espresso_tonic_signature:   { name: "Espresso Tonic",      size: "Signature (470ml)", price: 450 }
};

// State
const order = Object.fromEntries(Object.keys(MENU).map(k => [k, 0]));

// ===== TIME GATE LOGIC =====
function checkBusinessHours() {
  // Forces calculation based on IST (Asia/Kolkata)
  const now = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
  const day = now.getDay(); // 5 = Fri, 6 = Sat
  const hour = now.getHours();

  const openSection = document.getElementById('order-open');
  const closedSection = document.getElementById('order-closed');

  if (!openSection || !closedSection) return;

  // Logic: Open if (Friday OR Saturday) AND (9 AM to 6:59 PM)
  const isWeekendWindow = (day === 5 || day === 6);
  const isWithinTime = (hour >= 9 && hour < 19);

  if (isWeekendWindow && isWithinTime) {
    openSection.style.display = 'block';
    closedSection.style.display = 'none';
  } else {
    openSection.style.display = 'none';
    closedSection.style.display = 'block';
  }
}

// ===== Helpers =====
function formatINR(n) {
  return `₹${n}`;
}

function clampQty(q) {
  return Math.max(0, Math.min(MAX_QTY, q));
}

function computeTotal() {
  return Object.keys(order).reduce(
    (sum, key) => sum + order[key] * MENU[key].price,
    0
  );
}

function render() {
  // Update quantities
  for (const key in order) {
    const qtyEl = document.getElementById(`qty-${key}`);
    if (qtyEl) qtyEl.textContent = order[key];
  }
  // Update single total
  const totalEl = document.getElementById("totalAmount");
  if (totalEl) totalEl.textContent = formatINR(computeTotal());
}

// ===== Stepper buttons =====
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".stepper-btn");
  if (!btn) return;
  const key = btn.dataset.item;
  const change = Number(btn.dataset.change);
  if (!MENU[key]) return;
  order[key] = clampQty(order[key] + change);
  render();
});

// ===== Copy UPI =====
document.getElementById("copyUpiBtn")?.addEventListener("click", async () => {
  const status = document.getElementById("copyStatus");
  try {
    await navigator.clipboard.writeText(UPI_ID);
    status.textContent = "UPI ID copied.";
    setTimeout(() => (status.textContent = ""), 1500);
  } catch {
    status.textContent = `Copy this UPI ID: ${UPI_ID}`;
  }
});

// ===== Submit order =====
document.getElementById("placeOrderBtn")?.addEventListener("click", submitOrder);

async function submitOrder() {
  const name = document.getElementById("customerName").value.trim();
  const phone = document.getElementById("customerPhone").value.trim();
  const address = document.getElementById("customerAddress").value.trim();

  if (!name || !phone || !address) {
    alert("Please fill in all details.");
    return;
  }

  const items = Object.keys(order)
    .filter(k => order[k] > 0)
    .map(k => ({
      name: MENU[k].name,
      size: MENU[k].size,
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
    totalAmount: computeTotal(),
    createdAt: new Date().toISOString()
  }

  const btn = document.getElementById("placeOrderBtn");
  btn.disabled = true;
  btn.textContent = "Placing order...";

  try {
    const res = await fetch(SHEET_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error("Order failed");
    alert("Order placed! Your sip will be delivered soon.");
    // Reset
    for (const k in order) order[k] = 0;
    document.getElementById("customerName").value = "";
    document.getElementById("customerPhone").value = "";
    document.getElementById("customerAddress").value = "";
    render();
  } catch (err) {
    console.error(err);
    alert("Could not save order. Please try again.");
  } finally {
    btn.disabled = false;
    btn.textContent = "Place Order";
  }
}

// ===== Initial Initialization =====
checkBusinessHours();
render();



