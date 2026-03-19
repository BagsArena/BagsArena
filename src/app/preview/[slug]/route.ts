import { promises as fs } from "node:fs";

import { getPreviewBuildPath } from "@/lib/agents/workspace";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function buildMissingPreview(slug: string) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${slug} preview unavailable</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: linear-gradient(160deg, #040814 0%, #0f172a 100%);
        color: #e2e8f0;
        font-family: "Segoe UI", sans-serif;
      }
      article {
        max-width: 42rem;
        padding: 2rem;
        border-radius: 1.5rem;
        background: rgba(15, 23, 42, 0.82);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      p { line-height: 1.8; }
    </style>
  </head>
  <body>
    <article>
      <h1>Preview not built yet</h1>
      <p>The managed workspace for ${slug} has not produced a successful build yet. The arena runtime will surface the first preview as soon as this lane clears its next successful cycle.</p>
    </article>
  </body>
</html>`;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  try {
    const html = await fs.readFile(getPreviewBuildPath(slug), "utf8");
    return new Response(html, {
      headers: {
        "content-type": "text/html; charset=utf-8",
      },
    });
  } catch {
    return new Response(buildMissingPreview(slug), {
      headers: {
        "content-type": "text/html; charset=utf-8",
      },
      status: 404,
    });
  }
}
