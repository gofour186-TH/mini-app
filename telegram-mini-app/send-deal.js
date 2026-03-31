exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Telegram env vars are missing" })
    };
  }

  try {
    const payload = JSON.parse(event.body || "{}");
    const lines = [
      "New FXBridge deal",
      "",
      "Client: " + (payload.fullName || "-"),
      "Username: " + (payload.username || "-"),
      "Telegram ID: " + (payload.telegramId || "-"),
      "Direction: " + (payload.direction || "-"),
      "From: " + (payload.amountFrom || "-"),
      "To: " + (payload.amountTo || "-"),
      "Comment: " + (payload.comment || "-"),
      "Deal ID: " + (payload.dealId || "-")
    ];

    const response = await fetch("https://api.telegram.org/bot" + token + "/sendMessage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: lines.join("\n")
      })
    });

    const data = await response.json();
    if (!response.ok || !data.ok) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Telegram send failed", details: data })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || "Unknown error" })
    };
  }
};
