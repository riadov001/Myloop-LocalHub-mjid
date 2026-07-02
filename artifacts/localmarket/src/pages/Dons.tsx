import { useState } from "react";
import { Heart, Leaf, Users, Shield, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { useToast } from "@/hooks/use-toast";

const AMOUNTS = [5, 10, 20, 50];

const IMPACTS = [
  { icon: Leaf, title: "Échanges locaux", desc: "Chaque don soutient des milliers d'échanges de produits locaux entre voisins." },
  { icon: Users, title: "Communauté", desc: "Vous aidez à maintenir une plateforme gratuite et accessible à tous." },
  { icon: Shield, title: "Infrastructure", desc: "Vos dons financent les serveurs, la sécurité et le développement." },
];

export default function Dons() {
  const { toast } = useToast();
  const [selected, setSelected] = useState<number | null>(10);
  const [custom, setCustom] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const amount = custom ? Number(custom) : (selected ?? 0);

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount < 1) {
      toast({ title: "Montant invalide", description: "Veuillez saisir un montant d'au moins 1 €.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/donations/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // en centimes
          donorName: name || undefined,
          donorEmail: email || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur lors de la création du don.");
      if (data.url) {
        window.location.href = data.url; // redirection Stripe Checkout
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de la création du don.";
      toast({ title: "Erreur", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      <section className="py-16 lg:py-24">
        <div className="container max-w-5xl px-4">
          <div className="text-center mb-14 space-y-4">
            <div className="inline-flex items-center gap-2 border border-red-300 bg-red-50 text-red-600 text-xs font-semibold px-4 py-1.5 rounded-full uppercase tracking-widest">
              <Heart className="h-3.5 w-3.5 fill-current" />
              Soutenir LocalMarket
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
              Ensemble, faisons grandir<br />
              <span className="text-primary">les échanges locaux</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              LocalMarket est une plateforme communautaire. Votre don, même modeste, fait une vraie différence pour maintenir ce service gratuit et ouvert à tous.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div className="space-y-8">
              <div className="space-y-4">
                {IMPACTS.map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex gap-4">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{title}</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 space-y-3">
                <h3 className="font-bold text-foreground">Vos dons permettent de :</h3>
                <ul className="space-y-2">
                  {[
                    "Maintenir les serveurs 24h/24",
                    "Développer de nouvelles fonctionnalités",
                    "Modérer les annonces et assurer la qualité",
                    "Garder l'accès gratuit pour tous",
                    "Développer la communauté locale",
                  ].map(item => (
                    <li key={item} className="flex items-center gap-2 text-sm text-foreground">
                      <Check className="h-4 w-4 text-green-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <Card className="border-border/50 shadow-2xl shadow-black/10">
              <CardContent className="p-8">
                <form onSubmit={handleDonate} className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-foreground mb-1">Faire un don</h2>
                    <p className="text-sm text-muted-foreground">Paiement sécurisé par Stripe</p>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-foreground">Choisissez un montant</label>
                    <div className="grid grid-cols-4 gap-2">
                      {AMOUNTS.map(a => (
                        <button
                          key={a}
                          type="button"
                          onClick={() => { setSelected(a); setCustom(""); }}
                          className={`h-11 rounded-lg border-2 text-sm font-bold transition-all ${
                            selected === a && !custom
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-card text-foreground hover:border-primary/50"
                          }`}
                        >
                          {a} €
                        </button>
                      ))}
                    </div>
                    <div className="relative">
                      <Input
                        type="number"
                        min="1"
                        placeholder="Autre montant..."
                        value={custom}
                        onChange={e => { setCustom(e.target.value); setSelected(null); }}
                        className="pl-8"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-semibold">€</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-foreground">Vos informations</label>
                    <Input
                      placeholder="Votre prénom (optionnel)"
                      value={name}
                      onChange={e => setName(e.target.value)}
                    />
                    <Input
                      type="email"
                      placeholder="Email pour le reçu (optionnel)"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 font-bold text-base bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                    disabled={loading || !amount || amount < 1}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Traitement...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Heart className="h-4 w-4 fill-current" />
                        {amount >= 1 ? `Donner ${amount} €` : "Donner"}
                      </span>
                    )}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    Paiement 100% sécurisé par Stripe. Vous recevrez un reçu par email.
                    <br />LocalMarket ne stocke pas vos données bancaires.
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
