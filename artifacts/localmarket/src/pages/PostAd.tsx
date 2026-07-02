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

const formSchema = z.object({
  title: z.string().min(5, "Le titre doit faire au moins 5 caractères"),
  description: z.string().optional(),
  location: z.string().min(2, "La localisation est requise"),
  category: z.string().min(1, "La catégorie est requise"),
  product: z.string().min(2, "Le produit est requis"),
  quantity: z.string().optional(),
  unit: z.string().optional(),
  listingType: z.enum(["free", "flexible", "fixed"]).default("flexible"),
  price: z.string().optional(),
  isPromoted: z.boolean().default(false),
  promotionDuration: z.number().optional(),
  subscriptionType: z.enum(["none", "weekly", "monthly", "annual"]).default("none"),
  subscriptionPrice: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email("Email invalide").optional().or(z.literal('')),
});

export default function PostAd() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createAd = useCreateAd();
  const [isSuccess, setIsSuccess] = useState(false);

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
            title: "Erreur",
            description: "Une erreur est survenue lors de la création de l'annonce.",
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
          <h1 className="text-3xl font-bold mb-4">Annonce envoyée !</h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-md">
            Votre annonce a bien été enregistrée. Elle est actuellement en cours de révision par notre équipe et sera publiée prochainement.
          </p>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => setLocation("/annonces")}>
              Voir les annonces
            </Button>
            <Button onClick={() => { setIsSuccess(false); form.reset(); }}>
              Déposer une autre annonce
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
            <ArrowLeft className="h-4 w-4 mr-2" /> Retour à l'accueil
          </Button>
          <h1 className="text-3xl font-bold">Déposer une annonce</h1>
          <p className="text-muted-foreground mt-2">Partagez vos produits, ressources ou services avec la communauté locale.</p>
        </div>
      </div>

      <div className="container max-w-3xl py-12">
        <Card className="shadow-lg border-primary/10">
          <CardHeader className="bg-muted/30 border-b border-border/50 pb-8">
            <CardTitle>Détails de l'annonce</CardTitle>
            <CardDescription>Remplissez les informations ci-dessous avec le plus de précision possible.</CardDescription>
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
                        <FormLabel className="text-base">Titre de l'annonce <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Tomates bio du jardin à échanger" className="h-12" {...field} />
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
                        <FormLabel>Localisation <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Place du marché, Centre-ville" className="h-12" {...field} />
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
                        <FormLabel>Catégorie <span className="text-destructive">*</span></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12">
                              <SelectValue placeholder="Sélectionnez une catégorie" />
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
                        <FormLabel>Produit / Élément <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Tomates Coeur de Boeuf" className="h-12" {...field} />
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
                          <FormLabel>Quantité</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: 5, 10, 2" className="h-12" {...field} />
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
                          <FormLabel>Unité <span className="text-destructive">*</span></FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12">
                                <SelectValue placeholder="Unité de mesure" />
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
                        <FormLabel>Description détaillée</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Décrivez votre produit, vos conditions d'échange, etc."
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
                  <h3 className="text-lg font-semibold">Type de transaction</h3>

                  <FormField
                    control={form.control}
                    name="listingType"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="grid grid-cols-3 gap-4"
                          >
                            <div>
                              <RadioGroupItem value="free" id="free" className="peer sr-only" />
                              <Label
                                htmlFor="free"
                                className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer text-center"
                              >
                                <span className="text-base font-semibold">Don gratuit</span>
                                <span className="text-xs text-muted-foreground mt-1">Aucun montant</span>
                              </Label>
                            </div>
                            <div>
                              <RadioGroupItem value="flexible" id="flexible" className="peer sr-only" />
                              <Label
                                htmlFor="flexible"
                                className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer text-center"
                              >
                                <span className="text-base font-semibold">Prix libre</span>
                                <span className="text-xs text-muted-foreground mt-1">Montant facultatif</span>
                              </Label>
                            </div>
                            <div>
                              <RadioGroupItem value="fixed" id="fixed" className="peer sr-only" />
                              <Label
                                htmlFor="fixed"
                                className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer text-center"
                              >
                                <span className="text-base font-semibold">Prix fixe</span>
                                <span className="text-xs text-muted-foreground mt-1">Montant obligatoire</span>
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
                            Montant (€) {listingType === "fixed" && <span className="text-destructive">*</span>}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={listingType === "fixed" ? "Ex: 15.00" : "Ex: 10.00 (facultatif)"}
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
                    <h3 className="text-lg font-semibold">Mise en avant de l'annonce</h3>
                    <p className="text-sm text-muted-foreground mt-1">Augmentez la visibilité de votre annonce en la mettant en avant.</p>
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
                              <Label htmlFor="promo-no" className="cursor-pointer font-normal">Non</Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <RadioGroupItem value="true" id="promo-yes" />
                              <Label htmlFor="promo-yes" className="cursor-pointer font-normal">Oui</Label>
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
                          <FormLabel>Durée de mise en avant <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={(val) => field.onChange(Number(val))}
                              value={field.value ? String(field.value) : ""}
                              className="grid grid-cols-3 gap-4"
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
                    <h3 className="text-lg font-semibold">Abonnement</h3>
                    <p className="text-sm text-muted-foreground mt-1">Proposez votre produit en livraison régulière (panier hebdomadaire, mensuel, etc.).</p>
                  </div>

                  <FormField
                    control={form.control}
                    name="subscriptionType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type d'abonnement</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="grid grid-cols-2 md:grid-cols-4 gap-3"
                          >
                            {[
                              { value: "none", label: "Aucun", sub: "Pas d'abonnement" },
                              { value: "weekly", label: "Hebdomadaire", sub: "Chaque semaine" },
                              { value: "monthly", label: "Mensuel", sub: "Chaque mois" },
                              { value: "annual", label: "Annuel", sub: "Chaque année" },
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
                          <FormLabel>Tarif de l'abonnement (€)</FormLabel>
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
                  <h3 className="text-lg font-semibold">Contact (Optionnel)</h3>
                  <p className="text-sm text-muted-foreground -mt-4">
                    Laissez un moyen de vous joindre directement.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="contactEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email de contact</FormLabel>
                          <FormControl>
                            <Input placeholder="votre@email.fr" type="email" className="h-12" {...field} />
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
                          <FormLabel>Téléphone</FormLabel>
                          <FormControl>
                            <Input placeholder="06 12 34 56 78" className="h-12" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-border flex justify-end">
                  <Button type="submit" size="lg" className="w-full md:w-auto min-w-[200px]" disabled={createAd.isPending}>
                    {createAd.isPending ? "Envoi en cours..." : "Publier l'annonce"}
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
