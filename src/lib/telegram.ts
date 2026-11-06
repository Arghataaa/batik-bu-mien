export async function sendTelegramMessage(text: string, inline_keyboard?: any) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const adminId = process.env.TELEGRAM_ADMIN_ID;
  if (!token || !adminId) {
    console.error("[Telegram] TELEGRAM_BOT_TOKEN atau TELEGRAM_ADMIN_ID belum dikonfigurasi.");
    return;
  }

  const body: any = {
    chat_id: adminId,
    text,
    parse_mode: "HTML",
  };

  if (inline_keyboard) {
    body.reply_markup = { inline_keyboard };
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[Telegram] Gagal mengirim pesan ke Telegram. Status:", response.status, "Detail:", errText.replace(token, "[REDACTED]"));
    } else {
      console.log("[Telegram] Pesan berhasil dikirim ke admin.");
    }
  } catch (err) {
    console.error("[Telegram] Network error saat mengirim pesan:", err instanceof Error ? err.message : err);
  }
}
