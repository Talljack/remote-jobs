import { Resend } from "resend";

/**
 * Get Resend instance (lazy initialization)
 */
function getResendClient() {
  return new Resend(process.env.RESEND_API_KEY);
}

interface JobNotificationData {
  userEmail: string;
  userName: string | null;
  subscriptionName: string;
  jobs: Array<{
    id: string;
    title: string;
    companyName: string;
    salaryMin: number | null;
    salaryMax: number | null;
    salaryCurrency: string | null;
    remoteType: string;
    type: string;
    location: string | null;
    publishedAt: Date | null;
  }>;
}

/**
 * Generate HTML email for job notifications
 */
function generateJobNotificationEmail(data: JobNotificationData): string {
  const { userName, subscriptionName, jobs } = data;

  const jobsHTML = jobs
    .map(
      (job) => `
    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px; background: white;">
      <h3 style="margin: 0 0 8px 0; color: #111827; font-size: 18px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/jobs/${job.id}" style="color: #2563eb; text-decoration: none;">
          ${job.title}
        </a>
      </h3>
      <p style="margin: 4px 0; color: #6b7280; font-size: 14px;">
        <strong>${job.companyName}</strong>
        ${job.location ? ` • ${job.location}` : ""}
      </p>
      ${
        job.salaryMin || job.salaryMax
          ? `<p style="margin: 4px 0; color: #059669; font-size: 14px; font-weight: 600;">
          ${job.salaryCurrency || "USD"} ${job.salaryMin?.toLocaleString() || "N/A"} - ${job.salaryMax?.toLocaleString() || "N/A"}
        </p>`
          : ""
      }
      <div style="margin-top: 8px;">
        <span style="display: inline-block; padding: 4px 12px; background: #dbeafe; color: #1e40af; border-radius: 12px; font-size: 12px; margin-right: 8px;">
          ${job.type.replace("_", " ")}
        </span>
        <span style="display: inline-block; padding: 4px 12px; background: #dcfce7; color: #166534; border-radius: 12px; font-size: 12px;">
          ${job.remoteType.replace("_", " ")}
        </span>
      </div>
      <div style="margin-top: 12px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/jobs/${job.id}" style="display: inline-block; padding: 8px 16px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-size: 14px;">
          View Details
        </a>
      </div>
    </div>
  `
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Remote Jobs Matching Your Subscription</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f9fafb;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="margin: 0; color: #111827; font-size: 24px;">RemoteJobs</h1>
      <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 14px;">New remote jobs matching your subscription</p>
    </div>

    <!-- Greeting -->
    <div style="background: white; padding: 24px; border-radius: 8px; margin-bottom: 24px; border: 1px solid #e5e7eb;">
      <p style="margin: 0 0 12px 0; color: #111827; font-size: 16px;">
        Hi ${userName || "there"},
      </p>
      <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
        We found <strong>${jobs.length} new remote ${jobs.length === 1 ? "job" : "jobs"}</strong> matching your subscription: <strong>"${subscriptionName}"</strong>
      </p>
    </div>

    <!-- Jobs List -->
    ${jobsHTML}

    <!-- Footer -->
    <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/console/subscriptions" style="color: #2563eb; text-decoration: none;">Manage your subscriptions</a>
        •
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/console" style="color: #2563eb; text-decoration: none;">View all saved jobs</a>
      </p>
      <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 12px;">
        You're receiving this because you subscribed to job notifications on RemoteJobs.
      </p>
      <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 12px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color: #9ca3af; text-decoration: none;">RemoteJobs.dev</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Send job notification email
 */
export async function sendJobNotificationEmail(
  data: JobNotificationData
): Promise<{ success: boolean; error?: string }> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not configured, skipping email");
    return { success: false, error: "Email service not configured" };
  }

  try {
    const html = generateJobNotificationEmail(data);
    const resend = getResendClient();

    await resend.emails.send({
      from: "RemoteJobs <notifications@remotejobs.dev>",
      to: data.userEmail,
      subject: `${data.jobs.length} New Remote ${data.jobs.length === 1 ? "Job" : "Jobs"} - ${data.subscriptionName}`,
      html,
    });

    return { success: true };
  } catch (error) {
    console.error("Error sending email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
