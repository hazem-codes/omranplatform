import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  try {
    const { messages, language, action } = await req.json();

    let systemPrompt = "";
    if (action === "generate_description") {
      systemPrompt = language === "ar"
        ? "أنت مساعد هندسي محترف. أنشئ وصفاً تفصيلياً لمشروع هندسي بناءً على العنوان المعطى. اكتب باللغة العربية."
        : "You are a professional engineering assistant. Generate a detailed project description based on the given title.";
    } else if (action === "compare_bids") {
      systemPrompt = language === "ar"
        ? "أنت محلل عروض هندسية. قارن العروض المقدمة وقدم توصية مع التبرير. اكتب باللغة العربية."
        : "You are an engineering bid analyst. Compare the given bids and provide a recommendation with justification.";
    } else {
      systemPrompt = language === "ar"
        ? "أنت مساعد عمران الذكي — مساعد منصة عمران للخدمات الهندسية في المملكة العربية السعودية. ساعد المستخدمين في أسئلتهم حول المشاريع والعروض والعقود. أجب باللغة العربية."
        : "You are Omran AI Assistant — the assistant for Omran Engineering Services Platform in Saudi Arabia. Help users with questions about projects, bids, and contracts.";
    }

    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    const response = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: apiMessages,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service error", status: response.status }), {
        status: 502,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ content }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});
