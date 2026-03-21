import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { PlusCircle, Database, Settings, ShieldAlert } from "lucide-react";
import AdminGuard from "@/components/auth/AdminGuard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        {/* Navbar is sticky top-0, h-16 (4rem) */}
        <Navbar />

        <div className="flex flex-1 relative bg-background">
          {/* Sidebar */}
          <aside className="fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 border-r border-white/5 bg-surface-lowest hidden md:flex flex-col">
            <div className="p-6">
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-primary" /> Admin Panel
              </h2>
            </div>
            <nav className="flex-1 px-4 space-y-2">
              <Link
                href="/admin/create"
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/5 text-muted-foreground hover:text-white transition-colors"
              >
                <PlusCircle className="w-4 h-4" /> Add Problem
              </Link>
              <Link
                href="/admin/view"
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/5 text-muted-foreground hover:text-white transition-colors"
              >
                <Database className="w-4 h-4" /> All Problems
              </Link>
              <div className="flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground cursor-not-allowed opacity-50 relative group mt-4">
                <Settings className="w-4 h-4" /> Settings
                <span className="absolute left-full ml-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background border border-white/10 text-xs px-2 py-1 rounded">Soon</span>
              </div>
            </nav>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 md:ml-64 flex flex-col min-h-[calc(100vh-4rem)]">
            <div className="flex-1">
              {children}
            </div>
            <Footer />
          </main>
        </div>
      </div>
    </AdminGuard>
  );
}