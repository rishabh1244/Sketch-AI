import { NextResponse } from "next/server";

export async function POST(request) {
    const { prompt } = await request.json();
    console.log("recived " , prompt);
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${process.env.API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            "model": "google/gemini-2.0-flash-001",
            "messages": [
                { "role": "user", "content": prompt }
            ]
        })
    });

    const data = await response.json();
    const message = data.choices[0].message.content;
    console.log(message);
    return NextResponse.json({ message });
}


