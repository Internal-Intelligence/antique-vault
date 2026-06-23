import type { NextApiRequest, NextApiResponse } from "next";

export function requireCronAuth(req: NextApiRequest, res: NextApiResponse): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  if (req.headers.authorization !== `Bearer ${secret}`) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}

export function requireMethod(req: NextApiRequest, res: NextApiResponse, methods: string[]): boolean {
  if (!methods.includes(req.method ?? "")) {
    res.status(405).json({ error: "Method not allowed" });
    return false;
  }
  return true;
}