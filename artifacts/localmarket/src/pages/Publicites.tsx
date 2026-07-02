import { PublicLayout } from "@/components/layout/PublicLayout";
import { useListAdvertisements } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Megaphone, ExternalLink } from "lucide-react";

export default function Publicites() {
  const { data: ads, isLoading } = useListAdvertisements();

  return (
    <PublicLayout>
      <div className="bg-primary/5 py-8 border-b border-border/50">
        <div className="container max-w-6xl">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Megaphone className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Publicités</h1>
              <p className="text-muted-foreground mt-1">Découvrez les offres et contenus mis en avant par notre équipe.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-6xl py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-xl" />
            ))}
          </div>
        ) : ads && ads.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ads.map((ad) => {
              const content = (
                <Card key={ad.id} className="overflow-hidden border-border/50 hover:shadow-md transition-shadow group">
                  <div className="aspect-video bg-muted overflow-hidden">
                    {ad.mediaType === "video" ? (
                      <video
                        src={ad.mediaUrl}
                        className="w-full h-full object-cover"
                        controls
                        muted
                        loop
                        playsInline
                      />
                    ) : (
                      <img
                        src={ad.mediaUrl}
                        alt={ad.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                  </div>
                  <div className="p-4 flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-foreground truncate">{ad.title}</h3>
                    {ad.linkUrl && <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />}
                  </div>
                </Card>
              );

              return ad.linkUrl ? (
                <a key={ad.id} href={ad.linkUrl} target="_blank" rel="noreferrer" className="block">
                  {content}
                </a>
              ) : (
                content
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground gap-3">
            <Megaphone className="h-10 w-10 text-muted-foreground/50" />
            <p className="font-semibold text-lg text-foreground">Aucune publicité pour le moment</p>
            <p className="text-sm">Revenez bientôt pour découvrir nos contenus promotionnels.</p>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
