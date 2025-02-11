import { Resource } from "sst";
import jwt from "jsonwebtoken";

export interface Customer {
  customerId: string
}
export function authMiddleware(
  event: any
) {
  const token = event?.headers?.authorization;

  if (!token) {
    throw new Error("Token invalid")
  }

  try {
    return jwt.verify(token, Resource.JwtToken.value) as Customer;
  } catch (error) {
    console.error("JWT verification failed:", error);
    throw new Error("Authentication failed")
  }
}
