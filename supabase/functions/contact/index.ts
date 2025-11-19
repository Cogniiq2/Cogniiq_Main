import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { name, email, company, industry, interests, timeline, goal, preferredTime } = await req.json();

    const emailBody = `
Neue Kontaktanfrage von Cogniiq Website
========================================

Name: ${name}
E-Mail: ${email}
Unternehmen/Projekt: ${company}
Branche: ${industry}
Interesse: ${interests.join(", ")}
Wunschzeitraum für Start: ${timeline}
Ziel: ${goal}
Bevorzugte Zeit für Call: ${preferredTime || "Nicht angegeben"}

========================================
Gesendet am: ${new Date().toLocaleString("de-DE", { timeZone: "Europe/Berlin" })}
    `;

    const resendApiKey = "re_fev1ABWU_B5FqQCd1NERxY4fR5mziRab8";

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Cogniiq Website <onboarding@resend.dev>",
        to: ["info@cogniiq.de"],
        subject: `Neue Kontaktanfrage von ${name}`,
        text: emailBody,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      console.error("Resend API error:", errorData);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to send email" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const data = await emailResponse.json();
    console.log("Email sent successfully:", data);

    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully" }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error processing contact form:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
