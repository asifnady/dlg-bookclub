import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  // Check for custom session cookie first
  const cookie = request.headers.get("cookie") || "";
  const sessionMatch = cookie.match(/dlg_session=([^;]+)/);
  const hasCustomSession = !!sessionMatch;

  const { pathname } = request.nextUrl;

  // Public routes (always accessible)
  const publicRoutes = ["/login", "/auth/callback", "/join", "/"];
  const isPublic = publicRoutes.some((route) => pathname.startsWith(route));
  const isApiRoute = pathname.startsWith("/api/");

  // Always allow API routes and public routes
  if (isApiRoute || isPublic) {
    return NextResponse.next();
  }

  // Check Supabase session as fallback
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Allow if user has custom session OR Supabase session
  if (hasCustomSession || user) {
    return supabaseResponse;
  }

  // Not authenticated — redirect to login
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
