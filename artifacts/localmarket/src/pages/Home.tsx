import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Search, MapPin, Package, Scale, ArrowRight, Layers, Euro } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { useListAds, useListCategories, useListUnits } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { MapView } from "@/components/MapView";
import { useTranslation } from "react-i18next";

export default function Home() {
  const { t, i18n } = useTranslation();
  const [, setLocation] = useLocation();
  const [searchLocation, setSearchLocation] = useState("");
  const [category, setCategory] = useState("");
  const [product, setProduct] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [listingType, setListingType] = useState("");

  const { data: ads, isLoading: adsLoading } = useListAds({ limit: 20 });
  const { data: categories } = useListCategories();
  const { data: units } = useListUnits();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchLocation) params.set("location", searchLocation);
    if (category) params.set("category", category);
    if (product) params.set("product", product);
    if (quantity) params.set("quantity", quantity);
    if (unit) params.set("unit", unit);
    if (listingType) params.set("listingType", listingType);
    setLocation(`/annonces?${params.toString()}`);
  };

  const getListingLabel = (ad: { listingType?: string | null; price?: string | null }) => {
    if (ad.listingType === "free") return t("home.listing_free");
    if (ad.listingType === "fixed") return ad.price ? t("home.listing_fixed_price", { price: ad.price }) : t("home.listing_fixed");
    return ad.price ? `${ad.price} €` : t("home.listing_flexible");
  };

  return (
    <PublicLayout>
      <section className="py-16 lg:py-24 overflow-hidden">
        <div className="container max-w-7xl px-4">
          <div className="grid lg:grid-cols-2 gap-10 items-start">
            <motion.div
              className="space-y-8"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <motion.div
                className="inline-flex items-center gap-2 border border-primary/40 bg-primary/10 text-primary text-xs font-semibold px-4 py-1.5 rounded-full uppercase tracking-widest"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.05 }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                {t("home.hero.badge")}
              </motion.div>

              <motion.h1
                className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-foreground"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.12 }}
              >
                {t("home.hero.title_part1")}{" "}
                <span className="text-primary">{t("home.hero.title_highlight")}</span>
              </motion.h1>

              <motion.p
                className="text-lg text-muted-foreground max-w-xl leading-relaxed"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                {t("home.hero.subtitle")}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.28 }}
              >
              <Card className="border-border/60 bg-card shadow-xl shadow-black/30">
                <form onSubmit={handleSearch} className="flex flex-col gap-0">
                  {/* Localisation */}
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
                    <MapPin className="h-4 w-4 text-primary shrink-0" />
                    <div className="flex-1">
                      <div className="text-[10px] font-bold text-primary/80 uppercase tracking-widest mb-0.5">{t("home.search.location_label")}</div>
                      <Input
                        placeholder={t("home.search.location_placeholder")}
                        className="border-0 bg-transparent shadow-none focus-visible:ring-0 p-0 h-auto text-sm text-foreground placeholder:text-muted-foreground"
                        value={searchLocation}
                        onChange={(e) => setSearchLocation(e.target.value)}
                        data-testid="input-location"
                      />
                    </div>
                  </div>

                  {/* Catégorie */}
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
                    <Layers className="h-4 w-4 text-primary shrink-0" />
                    <div className="flex-1">
                      <div className="text-[10px] font-bold text-primary/80 uppercase tracking-widest mb-0.5">{t("home.search.category_label")}</div>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger className="border-0 bg-transparent shadow-none focus:ring-0 p-0 h-auto text-sm text-foreground">
                          <SelectValue placeholder={t("home.search.category_all")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t("home.search.category_all")}</SelectItem>
                          {categories?.map((cat) => (
                            <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Produit */}
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
                    <Package className="h-4 w-4 text-primary shrink-0" />
                    <div className="flex-1">
                      <div className="text-[10px] font-bold text-primary/80 uppercase tracking-widest mb-0.5">{t("home.search.product_label")}</div>
                      <Input
                        placeholder={t("home.search.product_placeholder")}
                        className="border-0 bg-transparent shadow-none focus-visible:ring-0 p-0 h-auto text-sm text-foreground placeholder:text-muted-foreground"
                        value={product}
                        onChange={(e) => setProduct(e.target.value)}
                        data-testid="input-product"
                      />
                    </div>
                  </div>

                  {/* Quantité + Unité */}
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
                    <Scale className="h-4 w-4 text-primary shrink-0" />
                    <div className="flex-1">
                      <div className="text-[10px] font-bold text-primary/80 uppercase tracking-widest mb-0.5">{t("home.search.quantity_label")}</div>
                      <div className="flex gap-2">
                        <Input
                          placeholder={t("home.search.quantity_placeholder")}
                          className="border-0 bg-transparent shadow-none focus-visible:ring-0 p-0 h-auto text-sm text-foreground placeholder:text-muted-foreground flex-1"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          data-testid="input-quantity"
                        />
                        <Select value={unit} onValueChange={setUnit}>
                          <SelectTrigger className="border-0 bg-transparent shadow-none focus:ring-0 p-0 h-auto text-sm w-24 shrink-0">
                            <SelectValue placeholder={t("home.search.unit_placeholder")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{t("home.search.unit_all")}</SelectItem>
                            {units?.map((u) => (
                              <SelectItem key={u.id} value={u.symbol}>{u.symbol}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Prix / Don */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    <Euro className="h-4 w-4 text-primary shrink-0" />
                    <div className="flex-1">
                      <div className="text-[10px] font-bold text-primary/80 uppercase tracking-widest mb-0.5">{t("home.search.price_label")}</div>
                      <Select value={listingType} onValueChange={setListingType}>
                        <SelectTrigger className="border-0 bg-transparent shadow-none focus:ring-0 p-0 h-auto text-sm text-foreground">
                          <SelectValue placeholder={t("home.search.type_all")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t("home.search.type_all")}</SelectItem>
                          <SelectItem value="free">{t("home.search.type_free")}</SelectItem>
                          <SelectItem value="flexible">{t("home.search.type_flexible")}</SelectItem>
                          <SelectItem value="fixed">{t("home.search.type_fixed")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="px-4 pb-4">
                    <Button type="submit" className="w-full h-11 font-semibold text-base" data-testid="button-search">
                      <Search className="h-4 w-4 mr-2" />
                      {t("home.search.submit")}
                    </Button>
                  </div>
                </form>
              </Card>
              </motion.div>
            </motion.div>

            <motion.div
              className="relative h-[320px] md:h-[560px] w-full rounded-2xl overflow-hidden border border-border/50 shadow-2xl shadow-black/40"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
            >
              {adsLoading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-card text-muted-foreground gap-3">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">{t("home.map_loading")}</span>
                </div>
              ) : (
                <MapView ads={ads ?? []} />
              )}
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-16 border-t border-border/30">
        <div className="container max-w-7xl px-4">
          <motion.div
            className="flex items-center justify-between mb-8"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
          >
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">{t("home.latest_ads")}</h2>
              <p className="text-sm text-muted-foreground mt-1">{t("home.latest_ads_subtitle")}</p>
            </div>
            <Button
              variant="ghost"
              onClick={() => setLocation("/annonces")}
              className="text-primary hover:text-primary/80 hover:bg-primary/10 font-semibold group/link"
              data-testid="link-all-ads"
            >
              {t("home.see_all")}
              <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover/link:translate-x-1" />
            </Button>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {adsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="overflow-hidden border-border/50 bg-card">
                  <div className="h-36 bg-muted animate-pulse" />
                  <CardContent className="p-4 space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                  </CardContent>
                </Card>
              ))
            ) : ads?.slice(0, 4).map((ad, idx) => (
              <motion.div
                key={ad.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, delay: idx * 0.08, ease: "easeOut" }}
                whileHover={{ y: -4 }}
              >
              <Card
                className="overflow-hidden border-border/50 bg-card hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 group cursor-pointer"
                onClick={() => setLocation(`/annonces/${ad.id}`)}
                data-testid={`card-ad-${ad.id}`}
              >
                <div className="h-36 bg-primary/10 flex items-center justify-center relative overflow-hidden">
                  <Package className="h-12 w-12 text-primary/30 group-hover:scale-110 group-hover:text-primary/50 transition-all duration-500" />
                  <div className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wide text-foreground border border-border/50">
                    {ad.category}
                  </div>
                  {ad.isPromoted && (
                    <div className="absolute top-2 right-2 bg-amber-500 text-white px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wide">
                      {t("home.promoted")}
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-sm leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-2 text-foreground">
                    {ad.title}
                  </h3>
                  {(ad.quantity || ad.unit) && (
                    <div className="flex items-center text-xs text-muted-foreground mb-1">
                      <Scale className="h-3 w-3 mr-1 shrink-0" />
                      <span>{[ad.quantity, ad.unit].filter(Boolean).join(" ")}</span>
                    </div>
                  )}
                  <div className="flex items-center text-xs text-muted-foreground mb-1">
                    <MapPin className="h-3 w-3 mr-1 shrink-0" />
                    <span className="truncate">{ad.location}</span>
                  </div>
                  {ad.listingType && (
                    <div className="text-xs text-muted-foreground">
                      {getListingLabel(ad)}
                    </div>
                  )}
                  <div className="text-[10px] text-muted-foreground/60 mt-2">
                    {new Date(ad.createdAt).toLocaleDateString(i18n.language === "en" ? "en-GB" : "fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                  </div>
                </CardContent>
              </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

    </PublicLayout>
  );
}
