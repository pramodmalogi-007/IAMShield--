const parseResponse = async (response) => {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
};

export const signupUser = async (payload) => {
  const response = await fetch("/api/auth/signup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
};

export const loginUser = async (payload) => {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
};

export const sendForgotPasswordOtp = async (email) => {
  const response = await fetch("/api/auth/forgot-password/send-otp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  return parseResponse(response);
};

export const verifyForgotPasswordOtp = async (email, otp) => {
  const response = await fetch("/api/auth/forgot-password/verify-otp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, otp }),
  });

  return parseResponse(response);
};

export const resetPasswordWithOtp = async (email, otp, password, confirmPassword) => {
  const response = await fetch("/api/auth/forgot-password/reset-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, otp, password, confirmPassword }),
  });

  return parseResponse(response);
};

export const loginWithGoogle = async (credential) => {
  const response = await fetch("/api/auth/google", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ credential }),
  });

  return parseResponse(response);
};