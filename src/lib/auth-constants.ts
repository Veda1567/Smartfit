export const SESSION_COOKIE_NAME = "smartfit_session";

/** Session lifetime: 7 days */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export type SessionUser = {
  id: string;
  email: string;
  username: string;
  role: string;
};

export type SessionPayload = {
  userId: string;
  email: string;
  username: string;
  role: string;
};
