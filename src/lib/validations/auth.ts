const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,30}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type FieldErrors = Record<string, string>;

export type RegisterInput = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type LoginInput = {
  identifier: string;
  password: string;
};

function hasLetterAndNumber(value: string): boolean {
  return /[A-Za-z]/.test(value) && /\d/.test(value);
}

export function validateRegisterInput(input: RegisterInput): {
  values: { username: string; email: string; password: string };
  errors: FieldErrors;
} {
  const errors: FieldErrors = {};
  const username = input.username.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password;
  const confirmPassword = input.confirmPassword;

  if (!username) {
    errors.username = "Username is required.";
  } else if (!USERNAME_PATTERN.test(username)) {
    errors.username =
      "Username must be 3–30 characters and use only letters, numbers, and underscores.";
  }

  if (!email) {
    errors.email = "Email is required.";
  } else if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    errors.email = "Enter a valid email address.";
  }

  if (!password) {
    errors.password = "Password is required.";
  } else if (password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  } else if (!hasLetterAndNumber(password)) {
    errors.password = "Password must include at least one letter and one number.";
  }

  if (!confirmPassword) {
    errors.confirmPassword = "Confirm your password.";
  } else if (password !== confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return { values: { username, email, password }, errors };
}

export function validateLoginInput(input: LoginInput): {
  values: { identifier: string; password: string };
  errors: FieldErrors;
} {
  const errors: FieldErrors = {};
  const identifier = input.identifier.trim();
  const password = input.password;

  if (!identifier) {
    errors.identifier = "Email or username is required.";
  }

  if (!password) {
    errors.password = "Password is required.";
  }

  return { values: { identifier, password }, errors };
}

export function clientValidateRegister(input: RegisterInput): FieldErrors {
  return validateRegisterInput(input).errors;
}

export function clientValidateLogin(input: LoginInput): FieldErrors {
  return validateLoginInput(input).errors;
}
