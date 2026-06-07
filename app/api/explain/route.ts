import { NextResponse } from "next/server";
import { createClient } from "@/app/auth/supabase/server";

export async function POST(request: Request) {
    try {
        const { USER_CONCEPT, LLM, SKETCH_ID, diagram_context } = await request.json();

        // 1. Authenticate user
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return new Response("Unauthorized", { status: 401 });
        }

        // 2. Prepare the prompt for explanation
        const systemPrompt = `You are a physics simulation assistant and tutor.
The user is viewing an interactive physics simulation on their canvas.
Here is the context of their canvas (current simulation state, elements, and customizable parameters):
${JSON.stringify(diagram_context, null, 2)}

User question or instruction: ${USER_CONCEPT}

Explain clearly, step-by-step. Keep it engaging, accurate, and relate it to the current parameters in the simulation. Format your output in Markdown. Do not output raw JSON unless specifically requested.`;

        // 3. Request streaming response from OpenRouter
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: LLM,
                messages: [{ role: "user", content: systemPrompt }],
                stream: true
            })
        });

        if (!response.ok) {
            throw new Error("OpenRouter request failed");
        }

        // 4. Return a streaming Response
        return new Response(response.body, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive"
            }
        });

    } catch (err: any) {
        console.error("Explanation stream error:", err);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
