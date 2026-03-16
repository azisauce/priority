import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SidebarProvider } from "@/components/sidebar-provider";
import AppShell from "@/components/layout/AppShell";

export default async function AppLayout({
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
                <AppShell>{children}</AppShell>
            </div>
        </SidebarProvider>
    );
}
