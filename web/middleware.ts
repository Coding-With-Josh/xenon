import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: { signIn: "/login" },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/chat/:path*",
    "/quiz/:path*",
    "/notes/:path*",
    "/exam/:path*",
    "/analytics/:path*",
    "/mistakes/:path*",
    "/mistakes/:path*",
    "/uploads/:path*",
    "/onboarding",
  ],
};
