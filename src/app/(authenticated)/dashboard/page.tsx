"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
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
    <div className="bg-card border border-border rounded-lg p-6 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-muted rounded-lg" />
        <div className="h-4 w-24 bg-muted rounded" />
      </div>
      <div className="h-8 w-20 bg-muted rounded" />
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
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Overview of your purchase priorities
        </p>
      </div>

      {/* Formula Display Carousel */}
      <div className="bg-linear-to-br from-card to-background border border-border rounded-xl p-3 sm:p-6 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-8 hidden sm:block">
          <TrendingUp className="w-36 h-36 text-primary" />
        </div>

        <CarouselCard />
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
                className="bg-card border border-border rounded-lg p-6"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {stat.value}
                </p>
              </div>
            );
          })}
      </div>

      {/* Top Priority Items */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
          <h2 className="text-base sm:text-lg font-semibold text-foreground">
            Top Priority Items
          </h2>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-6 bg-muted rounded animate-pulse" />
            ))}
          </div>
        ) : !data?.topItems.length ? (
          <div className="p-6 text-center text-muted-foreground">
            No items yet. Add some items to see your top priorities.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="px-3 sm:px-6 py-3 font-medium">Rank</th>
                  <th className="px-3 sm:px-6 py-3 font-medium">Item Name</th>
                  <th className="px-3 sm:px-6 py-3 font-medium">Priority</th>
                  <th className="hidden sm:table-cell px-3 sm:px-6 py-3 font-medium">Price</th>
                  <th className="hidden sm:table-cell px-3 sm:px-6 py-3 font-medium">Value Score</th>
                </tr>
              </thead>
              <tbody>
                {data.topItems.map((item, index) => (
                  <tr
                    key={item.id}
                    className="border-b border-border last:border-0 hover:bg-accent/50"
                  >
                    <td className="px-3 sm:px-6 py-3 text-muted-foreground">{index + 1}</td>
                    <td className="px-3 sm:px-6 py-3 text-foreground font-medium">
                      <div>{item.itemName}</div>
                      <div className="sm:hidden text-xs text-muted-foreground mt-0.5">
                        ${item.pricing.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} · VS: {item.score.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 text-muted-foreground">
                      {item.priority.toFixed(2)}
                    </td>
                    <td className="hidden sm:table-cell px-3 sm:px-6 py-3 text-muted-foreground">
                      ${item.pricing.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="hidden sm:table-cell px-3 sm:px-6 py-3 text-primary font-medium">
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
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
          <h2 className="text-base sm:text-lg font-semibold text-foreground">Recent Items</h2>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-6 bg-muted rounded animate-pulse" />
            ))}
          </div>
        ) : !data?.recentItems.length ? (
          <div className="p-6 text-center text-muted-foreground">
            No recent items.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {data.recentItems.map((item) => (
              <li
                key={item.id}
                className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3 hover:bg-accent/50"
              >
                <div>
                  <p className="text-foreground font-medium">{item.itemName}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.group?.groupName ?? "No group"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground">
                    ${item.pricing.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-muted-foreground">
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

function CarouselCard() {
  const [index, setIndex] = useState(0);
  const slides = [
    {
      title: "Scoring",
      content: (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <p className="text-sm text-muted-foreground mb-2 font-medium uppercase tracking-wider">Priority Score Calculation</p>
              <div className="font-mono text-sm space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-foreground/80">
                  <span>Σ(Answer × <span className="text-primary">Weight</span>)</span>
                  <span>/</span>
                  <span>Σ(<span className="text-primary">Weight</span>)</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Weighted average across all configured parameters per group</p>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <p className="text-sm text-muted-foreground mb-2 font-medium uppercase tracking-wider">Value Score</p>
              <p className="font-mono text-lg text-foreground">
                Priority<sup className="text-primary">5</sup> / Price
              </p>
            </div>
          </div>

          <div className="space-y-2 text-foreground/80">
            <h3 className="font-semibold text-foreground">How it works</h3>
            <p className="text-sm leading-relaxed">
              The <span className="text-primary font-medium">Priority Score</span> is a weighted average of your custom parameters. Configure them in <Link className="text-primary font-medium" href="/priority-params">Params</Link>.
            </p>
            <p className="text-sm leading-relaxed">
              The <span className="text-primary font-medium">Value Score</span> exponentially weights high-priority items against cost so small, critical purchases bubble up.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Simulation",
      content: (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Simulation selects which items to buy each month.</p>
          <div className="mt-2 rounded-lg bg-muted/50 p-4 border border-border">
            <p className="text-sm font-medium text-foreground mb-2">Greedy (default)</p>
            <p className="text-sm text-foreground/80">Picks highest-scoring items (Priority^5 / Price) and acquires them when cash or first installment is affordable.</p>
          </div>
          <div className="mt-2 rounded-lg bg-muted/50 p-4 border border-border">
            <p className="text-sm font-medium text-foreground mb-2">Optimal (knapsack)</p>
            <p className="text-sm text-foreground/80">Solves a knapsack per month to maximise acquired priority; exact for small sets, fast approximation for larger ones.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/simulation" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">Run Simulation</Link>
            <Link href="/simulation" className="text-sm text-muted-foreground underline">Advanced options</Link>
          </div>
        </div>
      ),
    },
  ];

  const prev = () => setIndex((i) => (i - 1 + slides.length) % slides.length);
  const next = () => setIndex((i) => (i + 1) % slides.length);

  const trackRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);

  const onPointerDown = (e: React.PointerEvent) => {
    const el = trackRef.current;
    if (!el) return;
    (e.target as Element).setPointerCapture(e.pointerId);
    setDragging(true);
    setStartX(e.clientX);
    setDragOffset(0);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging || !trackRef.current) return;
    const delta = e.clientX - startX;
    setDragOffset(delta);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragging) return;
    const delta = dragOffset;
    const threshold = 50; // px
    setDragging(false);
    setDragOffset(0);
    try {
      (e.target as Element).releasePointerCapture(e.pointerId);
    } catch { }
    if (delta < -threshold) {
      next();
    } else if (delta > threshold) {
      prev();
    }
  };

  const percentOffset = () => {
    const el = trackRef.current;
    if (!el) return 0;
    const w = el.getBoundingClientRect().width || 1;
    return (dragOffset / w) * 100;
  };

  return (
    <div className="relative">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base sm:text-xl font-bold text-foreground mb-0 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <span className="hidden sm:inline">Priority Intelligence Formula</span>
          <span className="sm:hidden">Formula</span>
        </h2>
      </div>

      {/* edge arrows
      <button
        onClick={prev}
        aria-label="Previous"
        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 rounded-full p-2 bg-input border border-border hover:bg-muted"
      >
        ‹
      </button>
      <button
        onClick={next}
        aria-label="Next"
        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 rounded-full p-2 bg-input border border-border hover:bg-muted"
      >
        ›
      </button> */}

      <div className="overflow-hidden rounded-lg" ref={trackRef} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} onPointerLeave={onPointerUp} style={{ cursor: dragging ? "grabbing" : "grab" }}>
        <div
          className="flex transition-transform duration-300"
          style={{ transform: `translateX(calc(-${index * 100}% + ${percentOffset()}%))` }}
        >
          {slides.map((s, i) => (
            <div key={i} className="w-full shrink-0 p-4">
              {s.content}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`h-2 w-8 rounded-full ${i === index ? "bg-primary" : "bg-muted/50"}`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
