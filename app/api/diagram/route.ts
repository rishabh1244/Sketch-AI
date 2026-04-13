import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
    const filePath = path.join(process.cwd(), 'app', 'data', 'diagram.json');

    if (!fs.existsSync(filePath)) {
        return NextResponse.json(null, { status: 404 });
    }

    try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        return NextResponse.json(JSON.parse(raw));
    } catch {
        return NextResponse.json(null, { status: 500 });
    }
}

