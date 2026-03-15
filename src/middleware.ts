import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/items/:path*",
    "/groups/:path*",
    "/counterparties/:path*",
    "/tracking/:path*",
    "/debts/:path*",
    "/simulation/:path*",
    "/profile/:path*",
  ],
};
