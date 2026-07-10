import { Resend } from "resend";
import { db, platformConfigTable } from "@workspace/db";
import { eq } from "drizzle-orm";

let resendClient: Resend | null = null;
let fromEmail = "noreply@grainily.com";

async function getResendClient(): Promise<Resend> {
  // Prefer a key set by an admin from the admin dashboard (Configuration > Intégrations) so
  // changes made there take effect immediately, without redeploying or touching env vars.
  const [apiKeyRow] = await db
    .select({ value: platformConfigTable.value })
    .from(platformConfigTable)
    .where(eq(platformConfigTable.key, "resend_api_key"));

  const [fromRow] = await db
    .select({ value: platformConfigTable.value })
    .from(platformConfigTable)
    .where(eq(platformConfigTable.key, "from_email"));

  const envApiKey = process.env.RESEND_API_KEY;
  const envFromEmail = process.env.RESEND_FROM_EMAIL;

  fromEmail = fromRow?.value || envFromEmail || fromEmail;

  const apiKey = apiKeyRow?.value || envApiKey;
  if (!apiKey) throw new Error("Clé API Resend non configurée dans les paramètres.");

  // Reset the cached client if the resolved key changed (e.g. an admin just updated it).
  resendClient = new Resend(apiKey);
  return resendClient;
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const client = await getResendClient();
  const { error } = await client.emails.send({ from: fromEmail, to, subject, html });
  if (error) throw new Error(`Erreur Resend: ${error.message}`);
}

function wrap(content: string, title: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><title>${title}</title>
<style>
  body { font-family: Inter, system-ui, sans-serif; background: #f8fafc; margin: 0; padding: 24px; }
  .card { background: #fff; border-radius: 12px; max-width: 560px; margin: 0 auto; padding: 40px 36px; box-shadow: 0 4px 24px rgba(0,0,0,.08); }
  .logo { display: flex; align-items: center; gap: 10px; margin-bottom: 32px; }
  .logo-icon { background: #2563eb; color: white; width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 800; }
  .logo-name { font-size: 18px; font-weight: 700; color: #1e293b; }
  h2 { color: #1e293b; font-size: 22px; margin: 0 0 12px; }
  p { color: #475569; line-height: 1.6; margin: 0 0 16px; }
  .btn { display: inline-block; background: #2563eb; color: #fff !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 8px 0 20px; }
  .footer { color: #94a3b8; font-size: 12px; margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 20px; }
  .badge-success { background: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; display: inline-block; margin-bottom: 16px; }
  .badge-warning { background: #fef9c3; color: #854d0e; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; display: inline-block; margin-bottom: 16px; }
  .badge-error { background: #fee2e2; color: #991b1b; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; display: inline-block; margin-bottom: 16px; }
</style></head>
<body><div class="card">
  <div class="logo"><div class="logo-icon">GR</div><span class="logo-name">Grainily</span></div>
  ${content}
  <div class="footer">Vous recevez cet email car vous avez un compte sur Grainily.<br>Si vous n'êtes pas à l'origine de cette action, ignorez cet email.</div>
</div></body></html>`;
}

export const EmailService = {
  async sendWelcome(to: string, name: string): Promise<void> {
    const html = wrap(`
      <span class="badge-success">Bienvenue !</span>
      <h2>Bonjour ${name}, bienvenue sur Grainily</h2>
      <p>Votre compte a été créé avec succès. Vous pouvez maintenant parcourir les annonces locales, contacter des commerçants et rejoindre notre communauté d'échanges.</p>
      <p>Pour commencer, explorez les annonces disponibles près de chez vous.</p>
      <a href="${process.env.SITE_URL ?? "https://grainily.com"}" class="btn">Découvrir Grainily</a>
      <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
    `, "Bienvenue sur Grainily");
    await sendEmail(to, "Bienvenue sur Grainily !", html);
  },

  async sendEmailVerification(to: string, name: string, token: string): Promise<void> {
    const siteUrl = process.env.SITE_URL ?? "https://grainily.com";
    const link = `${siteUrl}/verification-email?token=${token}`;
    const html = wrap(`
      <span class="badge-warning">Action requise</span>
      <h2>Vérifiez votre adresse email</h2>
      <p>Bonjour ${name},</p>
      <p>Cliquez sur le bouton ci-dessous pour confirmer votre adresse email et activer votre compte Grainily.</p>
      <a href="${link}" class="btn">Vérifier mon email</a>
      <p>Ce lien expire dans <strong>24 heures</strong>.</p>
      <p style="font-size:13px;color:#94a3b8;">Lien direct : <a href="${link}" style="color:#2563eb;">${link}</a></p>
    `, "Vérification de votre email");
    await sendEmail(to, "Vérifiez votre adresse email — Grainily", html);
  },

  async sendPasswordReset(to: string, name: string, token: string): Promise<void> {
    const siteUrl = process.env.SITE_URL ?? "https://grainily.com";
    const link = `${siteUrl}/reinitialiser-mot-de-passe?token=${token}`;
    const html = wrap(`
      <span class="badge-warning">Sécurité</span>
      <h2>Réinitialisation de votre mot de passe</h2>
      <p>Bonjour ${name},</p>
      <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.</p>
      <a href="${link}" class="btn">Réinitialiser mon mot de passe</a>
      <p>Ce lien expire dans <strong>1 heure</strong>. Si vous n'avez pas fait cette demande, ignorez cet email.</p>
    `, "Réinitialisation de mot de passe");
    await sendEmail(to, "Réinitialisation de votre mot de passe — Grainily", html);
  },

  async sendAdApproved(to: string, name: string, adTitle: string): Promise<void> {
    const siteUrl = process.env.SITE_URL ?? "https://grainily.com";
    const html = wrap(`
      <span class="badge-success">Annonce publiée</span>
      <h2>Votre annonce a été approuvée</h2>
      <p>Bonjour ${name},</p>
      <p>Bonne nouvelle ! Votre annonce <strong>"${adTitle}"</strong> a été approuvée par notre équipe et est maintenant visible par tous les utilisateurs de Grainily.</p>
      <a href="${siteUrl}/publicites" class="btn">Voir mes annonces</a>
    `, "Annonce approuvée");
    await sendEmail(to, `Annonce approuvée : "${adTitle}"`, html);
  },

  async sendAdRejected(to: string, name: string, adTitle: string, reason?: string): Promise<void> {
    const html = wrap(`
      <span class="badge-error">Annonce refusée</span>
      <h2>Votre annonce n'a pas été approuvée</h2>
      <p>Bonjour ${name},</p>
      <p>Votre annonce <strong>"${adTitle}"</strong> n'a pas pu être publiée${reason ? ` pour la raison suivante : <em>${reason}</em>` : ""}.</p>
      <p>Vous pouvez modifier votre annonce et la soumettre à nouveau en respectant nos conditions d'utilisation.</p>
    `, "Annonce refusée");
    await sendEmail(to, `Annonce refusée : "${adTitle}"`, html);
  },

  async sendSubscriptionConfirmation(to: string, name: string, planName: string): Promise<void> {
    const html = wrap(`
      <span class="badge-success">Abonnement actif</span>
      <h2>Votre abonnement ${planName} est confirmé</h2>
      <p>Bonjour ${name},</p>
      <p>Votre abonnement <strong>${planName}</strong> est maintenant actif. Vous pouvez dès à présent publier vos annonces sur Grainily.</p>
    `, "Abonnement confirmé");
    await sendEmail(to, `Abonnement ${planName} confirmé — Grainily`, html);
  },

  async sendSubscriptionCancelled(to: string, name: string, planName: string): Promise<void> {
    const html = wrap(`
      <span class="badge-warning">Abonnement annulé</span>
      <h2>Votre abonnement ${planName} a été annulé</h2>
      <p>Bonjour ${name},</p>
      <p>Votre abonnement <strong>${planName}</strong> a été annulé. Vos annonces resteront visibles jusqu'à la fin de la période en cours.</p>
    `, "Abonnement annulé");
    await sendEmail(to, `Abonnement ${planName} annulé — Grainily`, html);
  },

  async sendDonationConfirmation(to: string, name: string, amount: number): Promise<void> {
    const html = wrap(`
      <span class="badge-success">Merci !</span>
      <h2>Merci pour votre don de ${amount} €</h2>
      <p>Bonjour ${name},</p>
      <p>Votre don de <strong>${amount} €</strong> a bien été reçu. Merci de soutenir Grainily et notre mission d'échanges locaux.</p>
      <p>Votre générosité aide à maintenir une plateforme libre et accessible à toute la communauté.</p>
    `, "Confirmation de don");
    await sendEmail(to, `Merci pour votre don de ${amount} € — Grainily`, html);
  },

  async sendStorageAlert(to: string, usedPercent: number, usedGb: number, totalGb: number): Promise<void> {
    const html = wrap(`
      <span class="badge-error">Alerte stockage</span>
      <h2>Alerte : espace de stockage critique</h2>
      <p>L'espace de stockage de la plateforme Grainily est à <strong>${usedPercent}%</strong> de sa capacité.</p>
      <p>Utilisé : <strong>${usedGb} Go</strong> sur <strong>${totalGb} Go</strong></p>
      <p>Veuillez libérer de l'espace ou augmenter la capacité de stockage dès que possible.</p>
    `, "Alerte stockage critique");
    await sendEmail(to, `Alerte stockage : ${usedPercent}% utilisé — Grainily`, html);
  },
};
