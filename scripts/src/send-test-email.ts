import { EmailService } from "@workspace/email";

const to = process.argv[2];
if (!to) {
  console.error("Usage: pnpm --filter @workspace/scripts run send-test-email -- <email>");
  process.exit(1);
}

await EmailService.sendWelcome(to, "Test");
console.log(`Email envoyé à ${to}`);
