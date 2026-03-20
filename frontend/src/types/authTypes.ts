export type User = {
  id: string;
  username: string;
  email: string;
  role: "user" | "admin";
  method: "local" | "google";
};

export type RegisterPayload = {
  username: string;
  email: string;
  password: string;
  confirm_password: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type UserResponse = {
  user: User;
};
