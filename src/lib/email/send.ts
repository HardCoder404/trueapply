import "server-only";

type Email = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

const endpoint = "https://api.resend.com/emails";

export async function sendEmail(email: Email) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from)
    return { sent: false as const, reason: "email is not configured" };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        from,
        to: [email.to],
        subject: email.subject,
        text: email.text,
        html: email.html,
      }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) {
      const body = await response.text();
      console.error(`Resend responded ${response.status}: ${body.slice(0, 200)}`);
      return { sent: false as const, reason: `resend ${response.status}` };
    }
    return { sent: true as const };
  } catch (error) {
    console.error("Email send failed", error);
    return { sent: false as const, reason: "network" };
  }
}
