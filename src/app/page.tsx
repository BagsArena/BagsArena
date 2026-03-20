import { SplashEntry } from "@/components/marketing/splash-entry";
import { SiteHeader } from "@/components/site-header";
import { arenaRepository } from "@/lib/arena/repository";
import { formatSeasonLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function Home() {
  const snapshot = await arenaRepository.getSnapshot();
  const seasonLabel = formatSeasonLabel(snapshot.season.name, snapshot.season.slug);

  return (
    <div className="min-h-screen overflow-hidden">
      <SiteHeader
        seasonSlug={snapshot.season.slug}
        seasonName={snapshot.season.name}
        overlay
        minimal
      />
      <SplashEntry
        seasonSlug={snapshot.season.slug}
        seasonName={seasonLabel}
        houseAgents={snapshot.agents.length}
      />
    </div>
  );
}
