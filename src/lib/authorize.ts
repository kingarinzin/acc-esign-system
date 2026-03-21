import { verifyToken } from "@/lib/auth";

export function authorize(req: Request, allowedRoles: string[]) {
  const result = verifyToken(req);

  if (!result.valid) {
    return { ok: false, error: result.message, status: 401 };
  }

  if (!allowedRoles.includes(result.decoded.role)) {
    return { ok: false, error: "Forbidden", status: 403 };
  }

  return { ok: true, user: result.decoded };
}