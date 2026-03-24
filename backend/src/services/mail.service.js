import axios from "axios";

export const sendVerificationEmail = async (email, token) => {
  try {
    const verificationUrl = `${process.env.BASE_URL}/api/auth/verify-email/${token}`;

    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          email: process.env.BREVO_SENDER_EMAIL, // must be verified
        },
        to: [{ email }],
        subject: "Welcome to LinkMind",
        htmlContent: `
  <h2>Welcome to LinkMind</h2>
  <p>Click below to verify:</p>

  <a href="${verificationUrl}" style="color: blue;">
    Verify Email
  </a>

  <p>If button doesn't work, copy this link:</p>
`,
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
      },
    );

    console.log("Email sent:", response.data);
  } catch (error) {
    console.error("Email error:", error.response?.data || error.message);
  }
};
