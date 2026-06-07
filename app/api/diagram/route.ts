import { NextResponse } from "next/server";
import { createClient } from "@/app/auth/supabase/server";

export const dynamic = "force-dynamic";

// GET /api/diagram - Retrieve sketch(es)
export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");
        const folderId = searchParams.get("folder_id");

        if (id) {
            // Fetch single sketch
            const { data, error } = await supabase
                .from("sketches")
                .select("*")
                .eq("id", id)
                .eq("user_id", user.id)
                .maybeSingle();

            if (error) throw error;
            return NextResponse.json(data);
        }

        // Fetch multiple sketches
        let query = supabase
            .from("sketches")
            .select("*")
            .eq("user_id", user.id);

        if (folderId === "root") {
            query = query.is("folder_id", null);
        } else if (folderId) {
            query = query.eq("folder_id", folderId);
        }

        const { data, error } = await query.order("updated_at", { ascending: false });

        if (error) throw error;
        return NextResponse.json(data || []);

    } catch (err) {
        console.error("Error in GET /api/diagram:", err);
        return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
    }
}

// POST /api/diagram - Create or Duplicate a sketch
export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json().catch(() => ({}));
        const name = body.name || "Untitled Sketch";
        const folderId = body.folder_id || null;
        const sketchData = body.data || { elements: [] };

        const { data, error } = await supabase
            .from("sketches")
            .insert({
                name,
                user_id: user.id,
                folder_id: folderId,
                data: sketchData
            })
            .select()
            .single();

        if (error) {
            console.error("Supabase insert error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (err) {
        console.error("Error in POST /api/diagram:", err);
        const message = err instanceof Error ? err.message : String(err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// PUT /api/diagram - Update sketch details (Rename, Move folder, Update elements)
export async function PUT(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { id, name, folder_id, data: sketchData } = body;

        if (!id) {
            return NextResponse.json({ error: "Missing sketch ID" }, { status: 400 });
        }

        const updatePayload: Record<string, any> = {
            updated_at: new Date().toISOString()
        };
        if (name !== undefined) updatePayload.name = name;
        if (folder_id !== undefined) updatePayload.folder_id = folder_id;
        if (sketchData !== undefined) updatePayload.data = sketchData;

        const { data, error } = await supabase
            .from("sketches")
            .update(updatePayload)
            .eq("id", id)
            .eq("user_id", user.id)
            .select()
            .single();

        if (error) {
            console.error("Supabase update error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (err) {
        console.error("Error in PUT /api/diagram:", err);
        const message = err instanceof Error ? err.message : String(err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// DELETE /api/diagram - Delete a sketch
export async function DELETE(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Missing sketch ID" }, { status: 400 });
        }

        const { error } = await supabase
            .from("sketches")
            .delete()
            .eq("id", id)
            .eq("user_id", user.id);

        if (error) {
            console.error("Supabase delete error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Error in DELETE /api/diagram:", err);
        const message = err instanceof Error ? err.message : String(err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
