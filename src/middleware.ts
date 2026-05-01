import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

type CookieToSet = { name: string; value: string; options: CookieOptions };

const PUBLIC_PATHS = new Set(["/", "/login", "/auth/callback"]);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/icons") ||
    pathname === "/manifest.json" ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".ico") ||
    pathname.endsWith(".png")
  ) {
    return NextResponse.next();
  }

  const response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Without Supabase credentials we cannot enforce auth. Instead of crashing,
  // route everyone to the landing page (which surfaces the setup instructions).
  if (!supabaseUrl || !supabaseKey) {
    if (pathname === "/" || pathname === "/setup") return response;
    return NextResponse.redirect(new URL("/", request.url));
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet: CookieToSet[]) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Public paths: allow anonymous, but logged-in users on /login → /dashboard
  if (PUBLIC_PATHS.has(pathname)) {
    if (user && (pathname === "/login" || pathname === "/")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return response;
  }

  // Protected: require auth
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Onboarding gate: redirect to /onboarding if no user_context yet
  if (pathname !== "/onboarding") {
    const { data: ctx } = await supabase
      .from("spark_user_context")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!ctx) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
