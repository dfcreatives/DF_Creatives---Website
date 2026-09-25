import { Resend } from "resend";
import { get, update } from "./store";
const pending = new Set<string>();
export async function notifySubmission(id: string) {
  if (pending.has(id)) return;
  pending.add(id);
  try {
    const row = await get("submissions", id);
    if (!row || row.notification_status === "sent") return;
    if (
      !process.env.RESEND_API_KEY ||
      !process.env.NOTIFICATION_EMAIL ||
      !process.env.EMAIL_FROM
    ) {
      await update("submissions", id, {
        notification_status: "not_configured",
      });
      return;
    }
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send(
      {
        from: process.env.EMAIL_FROM,
        to: process.env.NOTIFICATION_EMAIL,
        subject: `New ${row.kind === "application" ? "career application" : "project enquiry"} — DF Creatives`,
        text: `A new ${row.kind} from ${row.name} is ready to review.\n\nOpen your dashboard: ${process.env.SITE_URL}/admin/inbox\n\nPersonal details and documents are available securely in the dashboard.`,
      },
      { idempotencyKey: `submission/${id}` },
    );
    await update("submissions", id, {
      notification_status: error ? "failed" : "sent",
    });
  } catch (e) {
    console.error("Notification failed", id);
    await update("submissions", id, { notification_status: "failed" }).catch(
      () => {},
    );
  } finally {
    pending.delete(id);
  }
}
