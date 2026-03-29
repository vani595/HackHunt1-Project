// ============================================================
// server/Chatbot.js — Groq API (fast + free, no quota issues)
// ============================================================

const FAQS = [
  { keywords: ["what is hackhunt", "about hackhunt", "tell me about hackhunt"], answer: "🚀 HackHunt is a platform to discover the best hackathons near you — online or in-person!" },
  { keywords: ["how to register", "how do i register", "sign up", "join hackathon"], answer: "📝 Click on any hackathon listing and you'll be redirected to its official registration page!" },
  { keywords: ["free", "cost", "fee", "paid", "entry fee"], answer: "💸 Many hackathons are free! Some may have entry fees — always check the hackathon details page." },
  { keywords: ["beginner", "new", "no experience", "fresher", "newbie"], answer: "🌱 Absolutely! Many hackathons are beginner-friendly. Creativity matters more than experience!" },
  { keywords: ["ongoing", "current", "live", "happening now", "chal rahe"], answer: "🔍 Filter by Status → Open/Ongoing to see all currently running hackathons!" },
  { keywords: ["online", "remote", "virtual", "participate from home"], answer: "🌐 Yes! Many hackathons are fully online — participate from anywhere in the world!" },
  { keywords: ["team", "create team", "find team", "group", "partner"], answer: "👥 Create your own team or join an existing one through the hackathon's official page!" },
  { keywords: ["skills", "what skills", "requirements", "programming"], answer: "💡 Basic programming helps, but creativity and problem-solving are what really count!" },
  { keywords: ["updates", "notifications", "latest", "new hackathon"], answer: "🔔 Check HackHunt regularly for the latest hackathon listings!" },
  { keywords: ["host", "organizer", "create hackathon", "organize"], answer: "🎯 Yes! Organizers can create and manage hackathons through HackHunt!" },
];

function matchFAQ(msg) {
  const lower = msg.toLowerCase().trim();
  for (const faq of FAQS)
    for (const kw of faq.keywords)
      if (lower.includes(kw)) return faq.answer;
  return null;
}

function buildPrompt(userMessage, hackathons) {
  let context = "";
  if (hackathons && hackathons.length > 0) {
    const list = hackathons.map((h, i) =>
      `${i + 1}. "${h.title}" | Location: ${h.location || "Online"} | Status: ${h.status} | Type: ${h.type || "N/A"} | Prize: ${h.totalPrize > 0 ? "₹" + h.totalPrize : "Free"} | Register: ${h.registrationUrl}`
    ).join("\n");
    context = `\n\nHere are relevant hackathons from HackHunt database:\n${list}\n\nUse this real data to answer. Mention specific hackathon names and details.`;
  } else {
    context = "\n\nNo hackathons found matching this filter in our database right now.";
  }
  return context;
}

async function callGroq(userMessage, hackathons) {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    console.log("❌ GROQ_API_KEY not found in .env");
    return null;
  }

  const hackathonContext = buildPrompt(userMessage, hackathons);

  const systemPrompt = `You are HackBot, the friendly AI assistant for HackHunt — a hackathon discovery platform in India.
Answer in 3-5 sentences max. Be friendly and conversational. Use emojis sparingly.
If hackathon data is provided, mention specific names and details from the list.${hackathonContext}`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.log("❌ Groq error:", err);
      return null;
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content;
    if (reply) {
      console.log("✅ Groq replied!");
      return reply.trim();
    }
  } catch (e) {
    console.log("❌ Groq fetch error:", e.message);
  }

  return null;
}

async function handleChat(userMessage, hackathons = []) {
  if (!userMessage?.trim()) return { success: false, reply: "Please type a message! 😊" };

  // Step 1: FAQ check — instant, no API
  const faq = matchFAQ(userMessage);
  if (faq) return { success: true, reply: faq, source: "faq" };

  // Step 2: Groq AI
  const reply = await callGroq(userMessage, hackathons);
  if (reply) return { success: true, reply, source: "groq" };

  return {
    success: false,
    reply: "I'm having trouble right now 😅 Try asking about hackathons or registration!",
  };
}

module.exports = { handleChat };