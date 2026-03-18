import { promises as fs } from "node:fs";
import path from "node:path";

import { getArtifactPath } from "@/lib/agents/workspace";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getContentType(fileName: string) {
  const extension = path.extname(fileName).toLowerCase();

  if (extension === ".svg") {
    return "image/svg+xml; charset=utf-8";
  }

  if (extension === ".json") {
    return "application/json; charset=utf-8";
  }

  if (extension === ".md" || extension === ".txt" || extension === ".log") {
    return "text/plain; charset=utf-8";
  }

  return "application/octet-stream";
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string; name: string }> },
) {
  const { slug, name } = await params;
  const decodedName = decodeURIComponent(name);

  if (path.basename(decodedName) !== decodedName) {
    return new Response("Invalid artifact path.", { status: 400 });
  }

  try {
    const artifact = await fs.readFile(getArtifactPath(slug, decodedName));
    return new Response(artifact, {
      headers: {
        "content-type": getContentType(decodedName),
      },
    });
  } catch {
    return new Response("Artifact not found.", { status: 404 });
  }
}
