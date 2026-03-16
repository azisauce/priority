import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/wishlist/:path*",
    "/debts/:path*",
    "/payments/:path*",
    "/expenses/:path*",
    "/simulation/:path*",
    "/profile/:path*",
  ],
};
