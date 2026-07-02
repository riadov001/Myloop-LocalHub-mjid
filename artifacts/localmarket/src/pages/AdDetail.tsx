import { Link, useParams, useLocation } from "wouter";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { useGetAd, getGetAdQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MapPin, Package, Scale, Phone, Mail, ArrowLeft, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdDetail() {
  const params = useParams();
  const id = Number(params.id);
  const [, setLocation] = useLocation();

  const { data: ad, isLoading, error } = useGetAd(id, {
    query: {
      enabled: !!id && !isNaN(id),
      queryKey: getGetAdQueryKey(id)
    }
  });

  if (isNaN(id)) {
    return (
      <PublicLayout>
        <div className="container py-20 text-center">
          <h2 className="text-2xl font-bold text-destructive">Annonce invalide</h2>
          <Button className="mt-4" onClick={() => setLocation("/annonces")}>Retour aux annonces</Button>
        </div>
      </PublicLayout>
    );
  }

  if (error) {
    return (
      <PublicLayout>
        <div className="container py-20 text-center">
          <h2 className="text-2xl font-bold text-destructive">Erreur</h2>
          <p className="text-muted-foreground mt-2">Impossible de charger cette annonce. Elle a peut-être été supprimée.</p>
          <Button className="mt-4" onClick={() => setLocation("/annonces")}>Retour aux annonces</Button>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="bg-primary/5 py-8 border-b border-border/50">
        <div className="container max-w-4xl">
          <Button variant="ghost" onClick={() => setLocation("/annonces")} className="mb-4 -ml-4 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-2" /> Retour aux annonces
          </Button>
          
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-32" />
              </div>
            </div>
          ) : ad ? (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Badge>{ad.category}</Badge>
                <span className="text-sm text-muted-foreground flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {format(new Date(ad.createdAt), "dd MMM yyyy", { locale: fr })}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{ad.title}</h1>
              <div className="flex flex-wrap gap-4 text-muted-foreground">
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 mr-1.5 text-primary" />
                  <span className="font-medium text-foreground">{ad.location}</span>
                </div>
                <div className="flex items-center">
                  <Package className="h-5 w-5 mr-1.5 text-primary" />
                  <span className="font-medium text-foreground">{ad.product}</span>
                </div>
                {ad.quantity && (
                  <div className="flex items-center">
                    <Scale className="h-5 w-5 mr-1.5 text-primary" />
                    <span className="font-medium text-foreground">{ad.quantity}</span>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="container max-w-4xl py-12">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">Description</h2>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : (
                <div className="prose prose-blue max-w-none text-muted-foreground whitespace-pre-wrap">
                  {ad?.description || "Aucune description fournie pour cette annonce."}
                </div>
              )}
            </section>
          </div>

          <div>
            <Card className="sticky top-24 shadow-lg border-primary/10">
              <CardHeader className="bg-muted/30 border-b pb-4">
                <CardTitle className="text-lg">Contacter l'annonceur</CardTitle>
                <CardDescription>Intéressé par cette annonce ?</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : (
                  <>
                    {ad?.contactEmail ? (
                      <Button className="w-full justify-start h-12" variant="outline" onClick={() => window.location.href = `mailto:${ad.contactEmail}`}>
                        <Mail className="mr-3 h-5 w-5 text-primary" />
                        {ad.contactEmail}
                      </Button>
                    ) : null}
                    
                    {ad?.contactPhone ? (
                      <Button className="w-full justify-start h-12" variant="outline" onClick={() => window.location.href = `tel:${ad.contactPhone}`}>
                        <Phone className="mr-3 h-5 w-5 text-primary" />
                        {ad.contactPhone}
                      </Button>
                    ) : null}

                    {!ad?.contactEmail && !ad?.contactPhone && (
                      <div className="text-center p-4 bg-muted rounded-md text-sm text-muted-foreground">
                        L'annonceur n'a pas laissé de coordonnées directes. Revenez plus tard ou consultez d'autres annonces.
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
