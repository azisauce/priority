import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Navigation from "@/components/navigation";

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
    <div className="min-h-screen bg-gray-950">
      <Navigation />
      <main className="lg:pl-64">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-16 lg:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}
