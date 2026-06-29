import { NextResponse } from "next/server";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  message: z.string().min(10).max(4000),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = contactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please provide a valid name, email, and message." },
        { status: 400 }
      );
    }

    // Lead capture placeholder — wire to CRM/email provider in production.
    console.info("[contact:lead]", {
      name: parsed.data.name,
      email: parsed.data.email,
      messageLength: parsed.data.message.length,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unable to send message." }, { status: 500 });
  }
}
