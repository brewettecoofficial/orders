export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { items } = JSON.parse(event.body || "{}");

  if (!items || !items.length) {
    return { statusCode: 400, body: "Invalid order" };
  }

  const lines = items.map(
    item => `${item.qty} × ${item.name}`
  ).join("\n");

  const message = encodeURIComponent(
    `Hi Brewette! I'd like to order:\n${lines}`
  );

  const whatsappNumber = "918331809508"; // replace
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;

  return {
    statusCode: 200,
    body: JSON.stringify({ whatsappUrl })
  };
}
