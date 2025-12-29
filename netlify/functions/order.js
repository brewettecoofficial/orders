export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { customer, items } = JSON.parse(event.body || "{}");

  if (!customer || !items || !items.length) {
    return { statusCode: 400, body: "Invalid order" };
  }

  const SHEET_WEBHOOK_URL =
    "https://script.google.com/macros/s/AKfycbxykUBas8LgoAZZSgWTGV48zB0uQb3bid8gQYWYqIHcfIBL-G9tPBUr2Z68d0mvvtr0_A/exec"; // your script URL

  await fetch(SHEET_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ customer, items })
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ status: "saved" })
  };
}
