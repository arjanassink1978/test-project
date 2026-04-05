export const API_BASE = "http://localhost:8080";
export const FRONTEND_BASE = "http://localhost:3000";

export const TIMEOUTS = {
  DEFAULT: 5000,
  LONG: 10000,
  NAVIGATION: 10000,
};

export const DEFAULT_USER = {
  username: "user",
  password: "user1234",
  email: "user@example.com",
};

export const DEFAULT_MODERATOR = {
  username: "moderator",
  password: "moderator1234",
  email: "moderator@example.com",
};

export const DEFAULT_ADMIN = {
  username: "admin",
  password: "admin1234",
  email: "admin@example.com",
};

export const SEEDED_CATEGORIES = [
  { name: "Algemeen", description: "Algemene discussies" },
  { name: "Technologie", description: "Tech nieuws en vragen" },
  { name: "Off-topic", description: "Alles wat niet past" },
];

export const SEEDED_PROFILE = {
  username: "user",
  displayName: "Demo User",
  bio: "Software developer and coffee enthusiast",
  location: "Amsterdam, Netherlands",
};
