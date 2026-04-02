import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseServerMock } from "@/lib/demo/supabase-mock";
import { isPreviewMode } from "@/lib/demo/is-preview-mode";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function getSupabaseServerClient() {
  // IMPORTANT:
  // Use ANON key here so Row Level Security (RLS) is enforced.
  // Never use SERVICE_ROLE key in request-scoped server clients.
  if (isPreviewMode()) {
    return createSupabaseServerMock();
  }
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Configure them in .env."
    );
  }

  const cookieStore = cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2]);
          });
        } catch {
          /* مكوّنات السيرفر: تعديل الكوكيز أثناء الرندر غير مسموح في Next.js */
        }
      }
    }
  });
}

