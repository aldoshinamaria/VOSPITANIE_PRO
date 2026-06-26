import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_DEMO_HOST = "vospitanie-pro.vercel.app";

export function middleware(request: NextRequest) {
  if (request.nextUrl.hostname === PUBLIC_DEMO_HOST && request.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/demo", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/"
};
