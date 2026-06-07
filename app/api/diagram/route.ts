import { NextResponse } from "next/server";
import { createClient } from "@/app/auth/supabase/server";


export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { data, error } = await supabase
            .from("sketches")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle();

        if (error) throw error;

        return NextResponse.json(data);

    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
}


