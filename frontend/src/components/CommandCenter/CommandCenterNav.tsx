"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, Plus, PackagePlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function CommandCenterNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const isViewer = user?.role === "VIEWER";

  const tabs = [
    { name: "Repair", href: "/dashboard/command-center/repair" },
    { name: "MFG", href: "/dashboard/command-center/mfg" },
    { name: "Locations Topology", href: "/dashboard/command-center/locations" },
  ];

  return (
    <div className="mb-6">
      {/* Actions Row */}
      <div className="mb-8 flex items-center justify-between">
        <div className="relative w-full max-w-xl">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="search assets"
            className="block w-full pl-10 pr-3 py-2 border-2 border-gray-600 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:border-gray-900 sm:text-sm transition-colors"
          />
        </div>
        <div className="flex items-center gap-4 ml-6">
          {!isViewer && (
            <>
              <button 
                onClick={() => router.push('/dashboard/users?add=true')}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border-2 border-gray-600 rounded-md hover:bg-gray-50 focus:outline-none transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add User
              </button>
              <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border-2 border-gray-600 rounded-md hover:bg-gray-50 focus:outline-none transition-colors">
                <PackagePlus className="h-4 w-4" />
                Register Assets
              </button>
            </>
          )}
        </div>
      </div>
      <h1 className="text-xl text-gray-600 mb-4">
        Workshop Operations Command Center
      </h1>
      <div className="flex space-x-4">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`px-6 py-1 text-sm font-medium border-2 rounded-md transition-colors ${
                isActive
                  ? "border-gray-900 bg-gray-200 text-gray-900"
                  : "border-gray-600 text-gray-700 hover:bg-gray-100"
              }`}
            >
              {tab.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
