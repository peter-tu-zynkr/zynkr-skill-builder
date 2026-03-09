import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Only allow safe filename characters (e.g. "1.01.md", "writing-agent.md")
  if (!/^[\w.-]+$/.test(id)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // content/skills/ lives one level above the frontend/ directory
  const filePath = path.join(process.cwd(), "..", "content", "skills", id);

  try {
    const content = await readFile(filePath, "utf-8");
    return new NextResponse(content, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch {
    return new NextResponse("Not Found", { status: 404 });
  }
}
