import { describe, expect, it } from "vitest";

import { resolveProjectPreviewUrl } from "@/lib/arena/preview";
import type { ProjectInfrastructure } from "@/lib/arena/types";

function buildInfrastructure(
  overrides: Partial<ProjectInfrastructure> = {},
): ProjectInfrastructure {
  return {
    status: "local-only",
    notes: [],
    ...overrides,
  };
}

describe("resolveProjectPreviewUrl", () => {
  it("keeps local-only projects on the app preview route", () => {
    const previewUrl = resolveProjectPreviewUrl(
      "signal-safari",
      "https://signal-safari.vercel.app",
      buildInfrastructure(),
    );

    expect(previewUrl).toBe("http://localhost:3000/preview/signal-safari");
  });

  it("falls back to the Vercel project domain when a dead implicit custom domain is stored", () => {
    const previewUrl = resolveProjectPreviewUrl(
      "signal-safari",
      "https://signal-safari.bagsarena.online",
      buildInfrastructure({
        status: "fully-provisioned",
        vercelProjectId: "prj_signal_safari",
        vercelProjectName: "signal-safari",
      }),
    );

    expect(previewUrl).toBe("https://signal-safari.vercel.app");
  });

  it("keeps an explicit remote preview URL when it is not an implicit app subdomain", () => {
    const previewUrl = resolveProjectPreviewUrl(
      "signal-safari",
      "https://signal-safari-git-main-bagsarena.vercel.app",
      buildInfrastructure({
        status: "fully-provisioned",
        vercelProjectId: "prj_signal_safari",
        vercelProjectName: "signal-safari",
      }),
    );

    expect(previewUrl).toBe("https://signal-safari-git-main-bagsarena.vercel.app");
  });
});
