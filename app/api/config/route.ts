import { env } from "@/lib/server";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ ready: Boolean(env.provider()), provider: env.provider(), accessCodeRequired: Boolean(env.accessCode()) });
}
