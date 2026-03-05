import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Navigation from "@/components/navigation";
import { SidebarProvider } from "@/components/sidebar-provider";
import AuthenticatedLayoutShell from "./layout-shell";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background text-foreground">
        <Navigation />
        <AuthenticatedLayoutShell>{children}</AuthenticatedLayoutShell>
      </div>
    </SidebarProvider>
  );
}
