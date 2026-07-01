import jwt from "jsonwebtoken";

export interface JwtPayload {
  id: string;
  email: string;
  role: string;
  status: string;
  fraternidadeId?: string | null;
}

export interface BadgeTokenPayload {
  type: "badge";
  userId: string;
}

export function generateToken(payload: JwtPayload): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET não configurado");
  }

  const expiresIn = (process.env.JWT_EXPIRES_IN ||
    "24h") as jwt.SignOptions["expiresIn"];

  return jwt.sign(payload, secret, {
    expiresIn,
  });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
}

export function decodeToken(token: string): JwtPayload | null {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch {
    return null;
  }
}

export function generateBadgeToken(userId: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET não configurado");
  }

  return jwt.sign(
    {
      type: "badge",
      userId,
    } satisfies BadgeTokenPayload,
    secret,
    {
      expiresIn: "90d",
    },
  );
}

export function verifyBadgeToken(token: string): BadgeTokenPayload {
  return jwt.verify(token, process.env.JWT_SECRET!) as BadgeTokenPayload;
}
