import { useParams, useLocation } from "wouter";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { useGetAd, getGetAdQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MapPin, Package, Scale, Phone, Mail, ArrowLeft, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr, enGB } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";

export default function AdDetail() {
  const { t, i18n } = useTranslation();
  const params = useParams();
  const id = Number(params.id);
  const [, setLocation] = useLocation();

  const { data: ad, isLoading, error } = useGetAd(id, {
    query: {
      enabled: !!id && !isNaN(id),
      queryKey: getGetAdQueryKey(id)
    }
  });

  const dateLocale = i18n.language === "en" ? enGB : fr;

  if (isNaN(id)) {
    return (
      <PublicLayout>
        <div className="container py-20 text-center">
          <h2 className="text-2xl font-bold text-destructive">{t("ad_detail.invalid")}</h2>
          <Button className="mt-4" onClick={() => setLocation("/annonces")}>{t("ad_detail.back_btn")}</Button>
        </div>
      </PublicLayout>
    );
  }

  if (error) {
    return (
      <PublicLayout>
        <div className="container py-20 text-center">
          <h2 className="text-2xl font-bold text-destructive">{t("ad_detail.error")}</h2>
          <p className="text-muted-foreground mt-2">{t("ad_detail.error_desc")}</p>
          <Button className="mt-4" onClick={() => setLocation("/annonces")}>{t("ad_detail.back_btn")}</Button>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="bg-primary/5 py-8 border-b border-border/50">
        <div className="container max-w-4xl">
          <Button variant="ghost" onClick={() => setLocation("/annonces")} className="mb-4 -ml-4 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-2" /> {t("ad_detail.back")}
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
                  {format(new Date(ad.createdAt), "dd MMM yyyy", { locale: dateLocale })}
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
              <h2 className="text-2xl font-semibold mb-4">{t("ad_detail.description")}</h2>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : (
                <div className="prose prose-blue max-w-none text-muted-foreground whitespace-pre-wrap">
                  {ad?.description || t("ad_detail.no_description")}
                </div>
              )}
            </section>
          </div>

          <div>
            <Card className="sticky top-24 shadow-lg border-primary/10">
              <CardHeader className="bg-muted/30 border-b pb-4">
                <CardTitle className="text-lg">{t("ad_detail.contact_title")}</CardTitle>
                <CardDescription>{t("ad_detail.contact_desc")}</CardDescription>
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
                        <Mail className="mr-3 h-5 w-5 text-primary shrink-0" />
                        <span className="truncate">{ad.contactEmail}</span>
                      </Button>
                    ) : null}
                    
                    {ad?.contactPhone ? (
                      <Button className="w-full justify-start h-12" variant="outline" onClick={() => window.location.href = `tel:${ad.contactPhone}`}>
                        <Phone className="mr-3 h-5 w-5 text-primary shrink-0" />
                        <span className="truncate">{ad.contactPhone}</span>
                      </Button>
                    ) : null}

                    {!ad?.contactEmail && !ad?.contactPhone && (
                      <div className="text-center p-4 bg-muted rounded-md text-sm text-muted-foreground">
                        {t("ad_detail.no_contact")}
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
