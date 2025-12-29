const MAX_QTY = 5;

// Store order state
let order = {
  "Iced White Chocolate Mocha": 0,
  "Iced Nuts About You": 0,
  "Milk Coffee": 0
};

function updateQty(item, change) {
  order[item] += change;
  if (order[item] < 0) order[item] = 0;
  if (order[item] > MAX_QTY) order[item] = MAX_QTY;

  document.getElementById(`qty-${item}`).innerText = order[item];
}

async function submitOrder() {
  const items = Object.entries(order)
    .filter(([_, qty]) => qty > 0)
    .map(([name, qty]) => ({ name, qty }));

  if (items.length === 0) {
    alert("Please select at least one drink.");
    return;
  }

  try {
    const res = await fetch("/.netlify/functions/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items })
    });

    const data = await res.json();
    alert("Order received! We’ll get started shortly.");

  } catch {
    alert("Something went wrong. Try again.");
  }
}
