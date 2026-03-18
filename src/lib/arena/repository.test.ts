import { describe, expect, it } from "vitest";

import { arenaRepository } from "@/lib/arena/repository";

describe("arena repository", () => {
  it("approves a launch and moves the project live", async () => {
    const project = await arenaRepository.approveLaunch("project-ghost-kitchen");

    expect(project.launchStatus).toBe("live");
    expect(project.token.status).toBe("live");
    expect(project.token.launchSignature).toContain("launch-ghost-kitchen");
  });
});
