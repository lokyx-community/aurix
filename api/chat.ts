
export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  if (!apiKey) {
    return res.status(500).json({
      error: "Gemini API key is missing. Add GEMINI_API_KEY in Vercel Environment Variables.",
    });
  }

  try {
    const messages = Array.isArray(req.body?.messages)
      ? req.body.messages
      : [];

    const contents = messages
      .filter(
        (message: any) =>
          message.role === "user" || message.role === "assistant"
      )
      .map((message: any) => ({
        role: message.role === "assistant" ? "model" : "user",
        parts: [{ text: String(message.content || "") }],
      }));

    const systemInstruction = `
You are PioSwap AI, the official AI assistant for PioSwap.

Help users understand PioSwap features such as swaps, liquidity pools,
staking, referrals, portfolio, and markets.

Be friendly, clear, and concise.
Never ask users to share wallet seed phrases or private keys.
Do not invent transaction statuses, live prices, or financial guarantees.
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemInstruction }],
          },
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", data);
      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "Gemini API request failed. Please try again.",
      });
    }

    const answer =
      data?.candidates?.[0]?.content?.parts
        ?.map((part: any) => part.text || "")
        .join("")
        .trim();

    if (!answer) {
      return res.status(502).json({
        error: "Gemini returned an empty response. Please try again.",
      });
    }

    return res.status(200).json({ answer });
  } catch (error) {
    console.error("PioSwap Gemini backend error:", error);

    return res.status(500).json({
      error: "Unable to contact Gemini. Please try again.",
    });
  }
}
