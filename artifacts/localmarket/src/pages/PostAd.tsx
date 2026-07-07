import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useCreateAd, useListCategories, useListUnits } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function PostAd() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createAd = useCreateAd();
  const [isSuccess, setIsSuccess] = useState(false);

  const formSchema = z.object({
    title: z.string().min(5, t("post_ad.errors.title_min")),
    description: z.string().optional(),
    location: z.string().min(2, t("post_ad.errors.location_required")),
    category: z.string().min(1, t("post_ad.errors.category_required")),
    product: z.string().min(2, t("post_ad.errors.product_required")),
    quantity: z.string().optional(),
    unit: z.string().optional(),
    listingType: z.enum(["free", "flexible", "fixed"]).default("flexible"),
    price: z.string().optional(),
    isPromoted: z.boolean().default(false),
    promotionDuration: z.number().optional(),
    subscriptionType: z.enum(["none", "weekly", "monthly", "annual"]).default("none"),
    subscriptionPrice: z.string().optional(),
    contactPhone: z.string().optional(),
    contactEmail: z.string().email(t("post_ad.errors.email_invalid")).optional().or(z.literal('')),
  });

  const userToken = typeof window !== "undefined" ? localStorage.getItem("userToken") : null;
  const userRole = typeof window !== "undefined" ? localStorage.getItem("userRole") : null;
  const isMerchant = Boolean(userToken) && userRole === "merchant";

  useEffect(() => {
    if (!isMerchant) {
      setLocation("/inscription-marchand");
    }
  }, [isMerchant, setLocation]);

  const { data: categories } = useListCategories();
  const { data: units } = useListUnits();
  const { data: promotionPrices } = useQuery<{ id: number; duration: number; label: string; price: string; active: boolean }[]>({
    queryKey: ["/api/promotion-prices"],
    queryFn: () => fetch("/api/promotion-prices").then((r) => r.json()),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      category: "",
      product: "",
      quantity: "",
      unit: "",
      listingType: "flexible",
      price: "",
      isPromoted: false,
      promotionDuration: undefined,
      subscriptionType: "none",
      subscriptionPrice: "",
      contactPhone: "",
      contactEmail: "",
    },
  });

  const listingType = form.watch("listingType");
  const isPromoted = form.watch("isPromoted");
  const subscriptionType = form.watch("subscriptionType");

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const selectedPromoPrice = promotionPrices?.find(p => p.duration === values.promotionDuration);
    createAd.mutate(
      {
        data: {
          ...values,
          price: values.listingType === "free" ? undefined : values.price || undefined,
          isPromoted: values.isPromoted,
          promotionDuration: values.isPromoted ? values.promotionDuration : undefined,
          promotionPrice: values.isPromoted && selectedPromoPrice ? selectedPromoPrice.price : undefined,
          subscriptionType: values.subscriptionType || "none",
          subscriptionPrice: values.subscriptionType !== "none" ? values.subscriptionPrice || undefined : undefined,
        }
      },
      {
        onSuccess: () => {
          setIsSuccess(true);
        },
        onError: () => {
          toast({
            title: t("common.error"),
            description: t("post_ad.errors.submit_error"),
            variant: "destructive",
          });
        },
      }
    );
  };

  if (isSuccess) {
    return (
      <PublicLayout>
        <div className="container max-w-2xl py-20 flex flex-col items-center justify-center text-center">
          <div className="h-24 w-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="h-12 w-12" />
          </div>
          <h1 className="text-3xl font-bold mb-4">{t("post_ad.success.title")}</h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-md">
            {t("post_ad.success.desc")}
          </p>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => setLocation("/annonces")}>
              {t("post_ad.success.see_ads")}
            </Button>
            <Button onClick={() => { setIsSuccess(false); form.reset(); }}>
              {t("post_ad.success.post_another")}
            </Button>
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (!isMerchant) {
    return null;
  }

  return (
    <PublicLayout>
      <div className="bg-primary/5 py-8 border-b border-border/50">
        <div className="container max-w-3xl">
          <Button variant="ghost" onClick={() => setLocation("/")} className="mb-4 -ml-4 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-2" /> {t("post_ad.back")}
          </Button>
          <h1 className="text-3xl font-bold">{t("post_ad.title")}</h1>
          <p className="text-muted-foreground mt-2">{t("post_ad.subtitle")}</p>
        </div>
      </div>

      <div className="container max-w-3xl py-12">
        <Card className="shadow-lg border-primary/10">
          <CardHeader className="bg-muted/30 border-b border-border/50 pb-8">
            <CardTitle>{t("post_ad.card_title")}</CardTitle>
            <CardDescription>{t("post_ad.card_desc")}</CardDescription>
          </CardHeader>
          <CardContent className="pt-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">{t("post_ad.fields.title")} <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder={t("post_ad.fields.title_placeholder")} className="h-12" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("post_ad.fields.location")} <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder={t("post_ad.fields.location_placeholder")} className="h-12" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("post_ad.fields.category")} <span className="text-destructive">*</span></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12">
                              <SelectValue placeholder={t("post_ad.fields.category_placeholder")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories?.map((cat) => (
                              <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="product"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("post_ad.fields.product")} <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder={t("post_ad.fields.product_placeholder")} className="h-12" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("post_ad.fields.quantity")}</FormLabel>
                          <FormControl>
                            <Input placeholder={t("post_ad.fields.quantity_placeholder")} className="h-12" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="unit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("post_ad.fields.unit")} <span className="text-destructive">*</span></FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12">
                                <SelectValue placeholder={t("post_ad.fields.unit_placeholder")} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {units?.map((u) => (
                                <SelectItem key={u.id} value={u.symbol}>{u.name} ({u.symbol})</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("post_ad.fields.description")}</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t("post_ad.fields.description_placeholder")}
                            className="min-h-[120px] resize-y"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Section Prix / Don */}
                <div className="space-y-6 pt-6 border-t border-border">
                  <h3 className="text-lg font-semibold">{t("post_ad.transaction.title")}</h3>

                  <FormField
                    control={form.control}
                    name="listingType"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                          >
                            <div>
                              <RadioGroupItem value="free" id="free" className="peer sr-only" />
                              <Label
                                htmlFor="free"
                                className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer text-center"
                              >
                                <span className="text-base font-semibold">{t("post_ad.transaction.free")}</span>
                                <span className="text-xs text-muted-foreground mt-1">{t("post_ad.transaction.free_sub")}</span>
                              </Label>
                            </div>
                            <div>
                              <RadioGroupItem value="flexible" id="flexible" className="peer sr-only" />
                              <Label
                                htmlFor="flexible"
                                className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer text-center"
                              >
                                <span className="text-base font-semibold">{t("post_ad.transaction.flexible")}</span>
                                <span className="text-xs text-muted-foreground mt-1">{t("post_ad.transaction.flexible_sub")}</span>
                              </Label>
                            </div>
                            <div>
                              <RadioGroupItem value="fixed" id="fixed" className="peer sr-only" />
                              <Label
                                htmlFor="fixed"
                                className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer text-center"
                              >
                                <span className="text-base font-semibold">{t("post_ad.transaction.fixed")}</span>
                                <span className="text-xs text-muted-foreground mt-1">{t("post_ad.transaction.fixed_sub")}</span>
                              </Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {(listingType === "flexible" || listingType === "fixed") && (
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {listingType === "fixed" ? t("post_ad.transaction.amount_required") : t("post_ad.transaction.amount")}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={listingType === "fixed" ? t("post_ad.transaction.amount_placeholder_fixed") : t("post_ad.transaction.amount_placeholder_flexible")}
                              type="number"
                              step="0.01"
                              min="0"
                              className="h-12"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* Section Mise en avant */}
                <div className="space-y-6 pt-6 border-t border-border">
                  <div>
                    <h3 className="text-lg font-semibold">{t("post_ad.promotion.title")}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{t("post_ad.promotion.subtitle")}</p>
                  </div>

                  <FormField
                    control={form.control}
                    name="isPromoted"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <RadioGroup
                            onValueChange={(val) => field.onChange(val === "true")}
                            value={String(field.value)}
                            className="flex gap-6"
                          >
                            <div className="flex items-center gap-2">
                              <RadioGroupItem value="false" id="promo-no" />
                              <Label htmlFor="promo-no" className="cursor-pointer font-normal">{t("post_ad.promotion.no")}</Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <RadioGroupItem value="true" id="promo-yes" />
                              <Label htmlFor="promo-yes" className="cursor-pointer font-normal">{t("post_ad.promotion.yes")}</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {isPromoted && promotionPrices && promotionPrices.length > 0 && (
                    <FormField
                      control={form.control}
                      name="promotionDuration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("post_ad.promotion.duration")} <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={(val) => field.onChange(Number(val))}
                              value={field.value ? String(field.value) : ""}
                              className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                            >
                              {promotionPrices.filter(p => p.active).map((promo) => (
                                <div key={promo.id}>
                                  <RadioGroupItem value={String(promo.duration)} id={`promo-${promo.id}`} className="peer sr-only" />
                                  <Label
                                    htmlFor={`promo-${promo.id}`}
                                    className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer text-center"
                                  >
                                    <span className="text-base font-semibold">{promo.label}</span>
                                    <span className="text-primary font-bold mt-1">{promo.price} €</span>
                                  </Label>
                                </div>
                              ))}
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* Section Abonnement */}
                <div className="space-y-6 pt-6 border-t border-border">
                  <div>
                    <h3 className="text-lg font-semibold">{t("post_ad.subscription.title")}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{t("post_ad.subscription.subtitle")}</p>
                  </div>

                  <FormField
                    control={form.control}
                    name="subscriptionType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("post_ad.subscription.type")}</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="grid grid-cols-2 md:grid-cols-4 gap-3"
                          >
                            {[
                              { value: "none", label: t("post_ad.subscription.none"), sub: t("post_ad.subscription.none_sub") },
                              { value: "weekly", label: t("post_ad.subscription.weekly"), sub: t("post_ad.subscription.weekly_sub") },
                              { value: "monthly", label: t("post_ad.subscription.monthly"), sub: t("post_ad.subscription.monthly_sub") },
                              { value: "annual", label: t("post_ad.subscription.annual"), sub: t("post_ad.subscription.annual_sub") },
                            ].map((opt) => (
                              <div key={opt.value}>
                                <RadioGroupItem value={opt.value} id={`sub-${opt.value}`} className="peer sr-only" />
                                <Label
                                  htmlFor={`sub-${opt.value}`}
                                  className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer text-center"
                                >
                                  <span className="text-sm font-semibold">{opt.label}</span>
                                  <span className="text-xs text-muted-foreground mt-0.5">{opt.sub}</span>
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {subscriptionType !== "none" && (
                    <FormField
                      control={form.control}
                      name="subscriptionPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("post_ad.subscription.price")}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex: 25.00"
                              type="number"
                              step="0.01"
                              min="0"
                              className="h-12"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* Section Contact */}
                <div className="space-y-6 pt-6 border-t border-border">
                  <h3 className="text-lg font-semibold">{t("post_ad.contact.title")}</h3>
                  <p className="text-sm text-muted-foreground -mt-4">
                    {t("post_ad.contact.subtitle")}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="contactEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("post_ad.contact.email")}</FormLabel>
                          <FormControl>
                            <Input placeholder={t("post_ad.contact.email_placeholder")} type="email" className="h-12" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contactPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("post_ad.contact.phone")}</FormLabel>
                          <FormControl>
                            <Input placeholder={t("post_ad.contact.phone_placeholder")} className="h-12" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-border flex justify-end">
                  <Button type="submit" size="lg" className="w-full md:w-auto min-w-[200px]" disabled={createAd.isPending}>
                    {createAd.isPending ? t("post_ad.submitting") : t("post_ad.submit")}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  );
}
