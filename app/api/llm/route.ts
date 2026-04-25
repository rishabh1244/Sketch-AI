import { NextResponse } from "next/server";
import { createClient } from "@/app/auth/supabase/server";
import { gen_prompt } from "./prompt";

export async function POST(request: Request) {
    try {
        const { USER_CONCEPT, LLM, SKETCH_NAME } = await request.json();

        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const prompt = gen_prompt(USER_CONCEPT);

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

        const cleaned = raw
            .replace(/^```json\s*/i, "")
            .replace(/```\s*$/, "")
            .trim();

        let diagram;
        try {
            diagram = JSON.parse(cleaned);
        } catch {
            throw new Error("LLM returned invalid JSON");
        }
        // Avoid upsert+onConflict here because it requires a DB unique constraint.
        const { data: existingSketch, error: existingError } = await supabase
            .from("sketches")
            .select("id")
            .eq("user_id", user.id)
            .order("id", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (existingError) throw existingError;

        let dbData;

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
