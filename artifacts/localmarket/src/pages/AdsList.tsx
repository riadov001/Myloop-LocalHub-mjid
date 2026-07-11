import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { Search, MapPin, Package, Scale, Layers, Euro, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { useListAds, useListCategories, useListUnits } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";

export default function AdsList() {
  const { t } = useTranslation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);

  const [location, setSearchLocation] = useState(params.get("location") || "");
  const [category, setCategory] = useState(params.get("category") || "");
  const [product, setProduct] = useState(params.get("product") || "");
  const [quantity, setQuantity] = useState(params.get("quantity") || "");
  const [unit, setUnit] = useState(params.get("unit") || "");
  const [listingType, setListingType] = useState(params.get("listingType") || "");
  const [sortBy, setSortBy] = useState(params.get("sortBy") || "newest");

  const [, setUrlLocation] = useLocation();

  const { data: categories } = useListCategories();
  const { data: units } = useListUnits();

  const { data: ads, isLoading } = useListAds({
    location: location || undefined,
    category: category && category !== "all" ? category : undefined,
    product: product || undefined,
    quantity: quantity || undefined,
    unit: unit && unit !== "all" ? unit : undefined,
    listingType: listingType && listingType !== "all" ? listingType : undefined,
    sortBy: sortBy as "newest" | "oldest" | "price_asc" | "price_desc",
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const newParams = new URLSearchParams();
    if (location) newParams.set("location", location);
    if (category && category !== "all") newParams.set("category", category);
    if (product) newParams.set("product", product);
    if (quantity) newParams.set("quantity", quantity);
    if (unit && unit !== "all") newParams.set("unit", unit);
    if (listingType && listingType !== "all") newParams.set("listingType", listingType);
    if (sortBy && sortBy !== "newest") newParams.set("sortBy", sortBy);
    setUrlLocation(`/annonces?${newParams.toString()}`);
  };

  const handleReset = () => {
    setSearchLocation("");
    setCategory("");
    setProduct("");
    setQuantity("");
    setUnit("");
    setListingType("");
    setSortBy("newest");
    setUrlLocation("/annonces");
  };

  const getListingLabel = (ad: { listingType?: string | null; price?: string | null }) => {
    if (ad.listingType === "free") return t("ads.listing_free");
    if (ad.listingType === "fixed") return ad.price ? t("ads.listing_fixed_price", { price: ad.price }) : t("ads.listing_fixed");
    return ad.price ? `${ad.price} €` : t("ads.listing_flexible");
  };

  return (
    <PublicLayout>
      <div className="bg-primary/5 py-8 border-b border-border/50">
        <div className="container max-w-6xl">
          <h1 className="text-3xl font-bold mb-6">{t("ads.title")}</h1>

          <Card className="p-4 shadow-sm border-primary/10 bg-card">
            <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="flex items-center px-3 bg-muted/30 rounded-md border border-transparent focus-within:border-primary focus-within:bg-background transition-colors">
                <MapPin className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />
                <Input
                  placeholder={t("ads.search.location")}
                  className="border-0 bg-transparent shadow-none focus-visible:ring-0 px-0 h-10"
                  value={location}
                  onChange={(e) => setSearchLocation(e.target.value)}
                />
              </div>

              <div className="flex items-center px-3 bg-muted/30 rounded-md border border-transparent focus-within:border-primary focus-within:bg-background transition-colors">
                <Layers className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="border-0 bg-transparent shadow-none focus:ring-0 px-0 h-10 flex-1">
                    <SelectValue placeholder={t("ads.search.category")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("ads.search.category_all")}</SelectItem>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center px-3 bg-muted/30 rounded-md border border-transparent focus-within:border-primary focus-within:bg-background transition-colors">
                <Package className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />
                <Input
                  placeholder={t("ads.search.product")}
                  className="border-0 bg-transparent shadow-none focus-visible:ring-0 px-0 h-10"
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                />
              </div>

              <div className="flex items-center px-3 bg-muted/30 rounded-md border border-transparent focus-within:border-primary focus-within:bg-background transition-colors">
                <Scale className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />
                <Input
                  placeholder={t("ads.search.quantity")}
                  className="border-0 bg-transparent shadow-none focus-visible:ring-0 px-0 h-10 w-20 shrink-0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger className="border-0 bg-transparent shadow-none focus:ring-0 px-0 h-10 flex-1">
                    <SelectValue placeholder={t("ads.search.unit")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("ads.search.unit_all")}</SelectItem>
                    {units?.map((u) => (
                      <SelectItem key={u.id} value={u.symbol}>{u.symbol}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center px-3 bg-muted/30 rounded-md border border-transparent focus-within:border-primary focus-within:bg-background transition-colors">
                <Euro className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />
                <Select value={listingType} onValueChange={setListingType}>
                  <SelectTrigger className="border-0 bg-transparent shadow-none focus:ring-0 px-0 h-10 flex-1">
                    <SelectValue placeholder={t("ads.search.price_type")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("ads.search.type_all")}</SelectItem>
                    <SelectItem value="free">{t("ads.search.type_free")}</SelectItem>
                    <SelectItem value="flexible">{t("ads.search.type_flexible")}</SelectItem>
                    <SelectItem value="fixed">{t("ads.search.type_fixed")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center px-3 bg-muted/30 rounded-md border border-transparent focus-within:border-primary focus-within:bg-background transition-colors">
                <ArrowUpDown className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="border-0 bg-transparent shadow-none focus:ring-0 px-0 h-10 flex-1">
                    <SelectValue placeholder={t("ads.search.sort")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">{t("ads.search.sort_newest")}</SelectItem>
                    <SelectItem value="oldest">{t("ads.search.sort_oldest")}</SelectItem>
                    <SelectItem value="price_asc">{t("ads.search.sort_price_asc")}</SelectItem>
                    <SelectItem value="price_desc">{t("ads.search.sort_price_desc")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1 h-10">
                  <Search className="h-4 w-4 mr-2" />
                  {t("ads.search.filter")}
                </Button>
                <Button type="button" variant="outline" className="h-10" onClick={handleReset}>
                  {t("ads.search.reset")}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>

      <div className="container max-w-6xl py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="h-48 bg-muted animate-pulse" />
                <CardContent className="p-5 space-y-3">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))
          ) : ads?.length ? (
            ads.map((ad) => (
              <Card key={ad.id} className="overflow-hidden flex flex-col hover-elevate transition-all border-border/50 bg-card group cursor-pointer" onClick={() => setUrlLocation(`/annonces/${ad.id}`)}>
                <div className="h-48 bg-primary/5 flex items-center justify-center relative border-b border-border/50">
                  <Package className="h-16 w-16 text-primary/20 group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute top-3 left-3 bg-background/95 backdrop-blur-sm px-2.5 py-1 text-xs font-semibold rounded-md shadow-sm border border-border/50">
                    {ad.category}
                  </div>
                  {ad.isPromoted && (
                    <div className="absolute top-3 right-3 bg-amber-500 text-white px-2.5 py-1 text-xs font-bold rounded-md">
                      {t("ads.promoted")}
                    </div>
                  )}
                </div>
                <CardContent className="p-5 flex-1 flex flex-col">
                  <h3 className="font-semibold text-lg line-clamp-2 mb-3 group-hover:text-primary transition-colors">{ad.title}</h3>
                  {ad.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
                      {ad.description}
                    </p>
                  )}
                  <div className="space-y-2 mt-auto pt-4 border-t border-border/50">
                    <div className="flex items-center text-sm text-foreground font-medium">
                      <Package className="h-4 w-4 mr-2 text-primary/70 shrink-0" />
                      <span className="truncate">{ad.product}</span>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-2 shrink-0" />
                      <span className="truncate">{ad.location}</span>
                    </div>
                    {(ad.quantity || ad.unit) && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Scale className="h-4 w-4 mr-2 shrink-0" />
                        <span>{[ad.quantity, ad.unit].filter(Boolean).join(" ")}</span>
                      </div>
                    )}
                    {ad.listingType && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Euro className="h-4 w-4 mr-2 shrink-0" />
                        <span>{getListingLabel(ad)}</span>
                      </div>
                    )}
                  </div>
                  <Button
                    className="w-full mt-6 group-hover:bg-primary group-hover:text-primary-foreground transition-colors shadow-sm"
                    onClick={(e) => { e.stopPropagation(); setUrlLocation(`/annonces/${ad.id}`); }}
                  >
                    {t("ads.contact")}
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-center bg-muted/30 rounded-lg border border-dashed">
              <div className="h-16 w-16 bg-muted flex items-center justify-center rounded-full mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-2">{t("ads.empty.title")}</h3>
              <p className="text-muted-foreground max-w-md">
                {t("ads.empty.description")}
              </p>
              <Button variant="outline" className="mt-6" onClick={handleReset}>
                {t("ads.empty.reset")}
              </Button>
            </div>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
