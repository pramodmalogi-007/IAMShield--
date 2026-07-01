const brevo = require("@getbrevo/brevo");

const apiInstance = new brevo.TransactionalEmailsApi();

apiInstance.setApiKey(
  brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY
);

const sendEmail = async ({ to, subject, html }) => {
  try {
    console.log("Sending email to:", to);

    const email = new brevo.SendSmtpEmail();

    email.sender = {
      name: "IAMShield",
      email: "pramodmaloji96@gmail.com",
    };

    email.to = [
      {
        email: to,
      },
    ];

    email.subject = subject;
    email.htmlContent = html;

    const result = await apiInstance.sendTransacEmail(email);

    console.log("EMAIL SENT:", result.body);

    return result.body;
  } catch (err) {
    console.error("BREVO ERROR:", err.response?.body || err);
    throw err;
  }
};

module.exports = sendEmail;