"use client";

import { useEffect, useState } from "react";
import { Package, FolderOpen, DollarSign, TrendingUp } from "lucide-react";

interface DashboardData {
  totalItems: number;
  totalGroups: number;
  totalValue: number;
  averagePriority: number;
  topItems: {
    id: string;
    itemName: string;
    priority: number;
    pricing: number;
    score: number;
  }[];
  recentItems: {
    id: string;
    itemName: string;
    pricing: number;
    createdAt: string;
    group: { id: string; groupName: string } | null;
  }[];
}

function StatSkeleton() {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gray-800 rounded-lg" />
        <div className="h-4 w-24 bg-gray-800 rounded" />
      </div>
      <div className="h-8 w-20 bg-gray-800 rounded" />
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const stats = data
    ? [
        {
          label: "Total Items",
          value: data.totalItems.toString(),
          icon: Package,
        },
        {
          label: "Total Groups",
          value: data.totalGroups.toString(),
          icon: FolderOpen,
        },
        {
          label: "Total Value",
          value: `$${data.totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          icon: DollarSign,
        },
        {
          label: "Avg Priority",
          value: data.averagePriority.toFixed(2),
          icon: TrendingUp,
        },
      ]
    : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Dashboard</h1>
        <p className="text-gray-400 mt-1">
          Overview of your purchase priorities
        </p>
      </div>

      {/* Formula Display Card */}
      <div className="bg-gray-900 border-l-4 border-blue-500 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-100 mb-3">
          Priority Formula
        </h2>
        <div className="space-y-2 font-mono text-sm">
          <p className="text-blue-400">
            Priority Score = (Urgency × 0.30) + (Impact × 0.30) + (Risk ×
            0.25) + (Frequency × 0.15)
          </p>
          <p className="text-blue-400">
            Value Score = Priority<sup>5</sup> / Price
          </p>
        </div>
        <p className="text-gray-400 text-sm mt-3">
          Items are ranked by their value score — high priority items at lower
          prices are purchased first.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
          : stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="bg-gray-900 border border-gray-800 rounded-lg p-6"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-blue-400" />
                    </div>
                    <span className="text-sm text-gray-400">{stat.label}</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-100">
                    {stat.value}
                  </p>
                </div>
              );
            })}
      </div>

      {/* Top Priority Items */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-gray-100">
            Top Priority Items
          </h2>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-6 bg-gray-800 rounded animate-pulse" />
            ))}
          </div>
        ) : !data?.topItems.length ? (
          <div className="p-6 text-center text-gray-400">
            No items yet. Add some items to see your top priorities.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-800">
                  <th className="px-6 py-3 font-medium">Rank</th>
                  <th className="px-6 py-3 font-medium">Item Name</th>
                  <th className="px-6 py-3 font-medium">Priority</th>
                  <th className="px-6 py-3 font-medium">Price</th>
                  <th className="px-6 py-3 font-medium">Value Score</th>
                </tr>
              </thead>
              <tbody>
                {data.topItems.map((item, index) => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-800 last:border-0 hover:bg-gray-800/50"
                  >
                    <td className="px-6 py-3 text-gray-400">{index + 1}</td>
                    <td className="px-6 py-3 text-gray-100 font-medium">
                      {item.itemName}
                    </td>
                    <td className="px-6 py-3 text-gray-300">
                      {item.priority.toFixed(2)}
                    </td>
                    <td className="px-6 py-3 text-gray-300">
                      ${item.pricing.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-3 text-blue-400 font-medium">
                      {item.score.toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Items */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-gray-100">Recent Items</h2>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-6 bg-gray-800 rounded animate-pulse" />
            ))}
          </div>
        ) : !data?.recentItems.length ? (
          <div className="p-6 text-center text-gray-400">
            No recent items.
          </div>
        ) : (
          <ul className="divide-y divide-gray-800">
            {data.recentItems.map((item) => (
              <li
                key={item.id}
                className="px-6 py-4 flex items-center justify-between hover:bg-gray-800/50"
              >
                <div>
                  <p className="text-gray-100 font-medium">{item.itemName}</p>
                  <p className="text-sm text-gray-400">
                    {item.group?.groupName ?? "No group"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-gray-300">
                    ${item.pricing.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-gray-400">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
