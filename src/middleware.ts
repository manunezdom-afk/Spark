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

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  // Anonymous users can visit /login to create a real account (link identity).
  const isAnonymous = (user as (typeof user & { is_anonymous?: boolean }) | null)?.is_anonymous === true;

  // Public paths: non-anonymous logged-in users on /login or / → /dashboard
  if (PUBLIC_PATHS.has(pathname)) {
    if (user && !isAnonymous && (pathname === "/login" || pathname === "/")) {
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
