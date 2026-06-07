import { NextResponse } from "next/server";
import { createClient } from "@/app/auth/supabase/server";
import { gen_prompt } from "./prompt";

export async function POST(request: Request) {
    try {
        const { USER_CONCEPT, LLM, SKETCH_NAME, SKETCH_ID, existing_diagram } = await request.json();

        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        let conceptPrompt = USER_CONCEPT;
        if (existing_diagram) {
            conceptPrompt = `You are updating an existing physics simulation diagram.
Here is the current diagram JSON:
${JSON.stringify(existing_diagram.data || existing_diagram, null, 2)}

User instruction for modification or addition: ${USER_CONCEPT}

Add the requested simulation diagram(s) or elements into the canvas. You MUST:
1. Keep and preserve the existing elements and their logic/constants/state.
2. Position the new elements beside the existing ones (offsetting coordinates X or Y) to prevent overlap.
3. Return the complete merged diagram JSON containing BOTH the existing elements and the new elements.`;
        }

        const prompt = gen_prompt(conceptPrompt);

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: LLM,
                messages: [{ role: "user", content: prompt }]
            })
        });

        if (!response.ok) {
            throw new Error("LLM request failed");
        }

        const LLMdata = await response.json();

        const raw = LLMdata?.choices?.[0]?.message?.content;
        if (!raw) {
            throw new Error("Invalid LLM response");
        }

        let cleaned = raw.trim();
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            cleaned = jsonMatch[0];
        }

        let diagram;
        try {
            diagram = JSON.parse(cleaned);
        } catch (err) {
            console.error("LLM parsing failed. Raw response was:", raw);
            throw new Error("LLM returned invalid JSON");
        }

        let dbData;

        if (SKETCH_ID) {
            const { data, error } = await supabase
                .from("sketches")
                .update({
                    data: diagram,
                })
                .eq("id", SKETCH_ID)
                .select()
                .single();

            if (error) throw error;
            dbData = data;
        } else {
            // Avoid upsert+onConflict here because it requires a DB unique constraint.
            const { data: existingSketch, error: existingError } = await supabase
                .from("sketches")
                .select("id")
                .eq("user_id", user.id)
                .order("id", { ascending: false })
                .limit(1)
                .maybeSingle();

            if (existingError) throw existingError;

            if (existingSketch?.id) {
                const { data, error } = await supabase
                    .from("sketches")
                    .update({
                        data: diagram,
                    })
                    .eq("id", existingSketch.id)
                    .select()
                    .single();

                if (error) throw error;
                dbData = data;
            } else {
                const { data, error } = await supabase
                    .from("sketches")
                    .insert({
                        user_id: user.id,
                        data: diagram,
                    })
                    .select()
                    .single();

                if (error) throw error;
                dbData = data;
            }
        }

        return NextResponse.json({
            success: true,
            sketch: dbData
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Something went wrong";
        console.error(err);
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}
