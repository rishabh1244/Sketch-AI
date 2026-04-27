import { NextResponse } from "next/server";
import { createClient } from "@/app/auth/supabase/server";
import { gen_message } from "./message";
import OpenAI from "openai";


//slow and worse but ill leave it here .
export async function POST(request: Request) {
    try {
        const { USER_CONCEPT, LLM, SKETCH_NAME } = await request.json();

        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const messages = gen_message(USER_CONCEPT);

        const client = new OpenAI({
             baseURL: 'https://integrate.api.nvidia.com/v1',
                apiKey: process.env.NVIDIA_KEY!,
        });

        const response = await client.chat.completions.create({
            model: 'meta/llama-3.3-70b-instruct',
            messages,
        });

        const raw = response.choices?.[0]?.message?.content;
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
                .update({ data: diagram })
                .eq("id", existingSketch.id)
                .select()
                .single();
            if (error) throw error;
            dbData = data;
        } else {
            const { data, error } = await supabase
                .from("sketches")
                .insert({ user_id: user.id, data: diagram })
                .select()
                .single();
            if (error) throw error;
            dbData = data;
        }

        return NextResponse.json({ success: true, sketch: dbData });

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Something went wrong";
        console.error(err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
