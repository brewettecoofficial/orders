const MAX_QTY = 5;

// Store order state
const PRICES = {
  "Iced White Chocolate Mocha": 220,
  "Iced Nuts About You": 210,
  "Milk Coffee": 160
};

let order = {
  "Iced White Chocolate Mocha": 0,
  "Iced Nuts About You": 0,
  "Milk Coffee": 0
};

function updateQty(item, change) {
  order[item] += change;

  if (order[item] < 0) order[item] = 0;
  if (order[item] > 5) order[item] = 5;

  document.getElementById(`qty-${item}`).innerText = order[item];

  calculateTotal(); // 👈 IMPORTANT
}

async function submitOrder() {
  const name = document.getElementById("customerName").value.trim();
  const phone = document.getElementById("customerPhone").value.trim();
  const address = document.getElementById("customerAddress").value.trim();

  if (!name || !phone || !address) {
    alert("Please fill in all details.");
    return;
  }

  const items = Object.entries(order)
    .filter(([_, qty]) => qty > 0)
    .map(([name, qty]) => ({
      name,
      qty,
      price: PRICES[name]
    }));

  if (items.length === 0) {
    alert("Please select at least one drink.");
    return;
  }

  const totalAmount = calculateTotal();

  fetch("https://script.google.com/macros/s/AKfycbx7wGkwEjAqOtNb-bhXa2PahXbjWLG1oJMUL6uFAZ5oNeB1vt0Sx4ZmiXYNKut0-ZjIdg/exec", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({customer, items, totalAmount })
    })
    .then(() => {console.log("Saved to sheet");})
    .catch(err => {console.error("Sheet error", err);});

function calculateTotal() {
  let total = 0;

  for (const item in order) {
    total += order[item] * PRICES[item];
  }

  document.getElementById("totalAmount").innerText = `₹${total}`;
  return total;
}




