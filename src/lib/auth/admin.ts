import { NextResponse } from "next/server";

import { env } from "@/lib/env";

function readBearerToken(request: Request) {
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice("Bearer ".length).trim();
  }

  return null;
}

export function requireAdminAccess(request: Request) {
  if (!env.arenaAdminToken) {
    return null;
  }

  const headerToken =
    request.headers.get("x-arena-admin-token") ?? readBearerToken(request);

  if (headerToken === env.arenaAdminToken) {
    return null;
  }

  return NextResponse.json(
    {
      error: "Admin authorization required.",
    },
    { status: 401 },
  );
}
