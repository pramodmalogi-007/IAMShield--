const sendEmail = async ({ to, subject, html }) => {
  try {
    console.log("Sending email to:", to);

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": process.env.BREVO_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: "IAMShield",
          email: "pramodmaloji96@gmail.com",
        },
        to: [
          {
            email: to,
          },
        ],
        subject: subject,
        htmlContent: html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("BREVO ERROR:", data);
      throw new Error(data.message || "Failed to send email");
    }

    console.log("EMAIL SENT:", data);

    return data;
  } catch (err) {
    console.error("EMAIL ERROR:", err);
    throw err;
  }
};

module.exports = sendEmail;