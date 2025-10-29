"use client";

import { useEffect, useState } from "react";

import { Briefcase, Building2, TrendingUp, Sparkles, Loader2 } from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface OverviewStats {
  totalJobs: number;
  activeJobs: number;
  companies: number;
  newToday: number;
}

interface SourceStat {
  source: string;
  count: number;
}

interface CategoryStat {
  id: string;
  name: string;
  slug: string;
  count: number;
}

interface TrendData {
  date: string;
  count: number;
}

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
  "#FFC658",
  "#FF6B9D",
  "#C084FC",
  "#F472B6",
  "#FB923C",
  "#A78BFA",
];

export default function StatsPage() {
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [sources, setSources] = useState<SourceStat[]>([]);
  const [categories, setCategories] = useState<CategoryStat[]>([]);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const [overviewRes, sourcesRes, categoriesRes, trendsRes] = await Promise.all([
        fetch("/api/stats/overview"),
        fetch("/api/stats/sources"),
        fetch("/api/stats/categories"),
        fetch("/api/stats/trends"),
      ]);

      const [overviewData, sourcesData, categoriesData, trendsData] = await Promise.all([
        overviewRes.json(),
        sourcesRes.json(),
        categoriesRes.json(),
        trendsRes.json(),
      ]);

      if (overviewData.success) setOverview(overviewData.data);
      if (sourcesData.success) setSources(sourcesData.data);
      if (categoriesData.success) setCategories(categoriesData.data);
      if (trendsData.success) setTrends(trendsData.data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-4xl font-bold">Platform Statistics</h1>
        <p className="text-muted-foreground">
          Real-time insights into remote job opportunities across the platform
        </p>
      </div>

      {/* Overview Cards */}
      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.totalJobs.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.activeJobs.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Published listings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Companies</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.companies.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Hiring remotely</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Today</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.newToday.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Posted in last 24h</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sources Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Job Sources Distribution</CardTitle>
            <CardDescription>Where our jobs come from</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sources}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ source, percent }) => `${source}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {sources.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Categories Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Top Job Categories</CardTitle>
            <CardDescription>Most popular job categories</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categories.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Trends Line Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Job Posting Trends</CardTitle>
            <CardDescription>New jobs added over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) =>
                    new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                  }
                />
                <YAxis />
                <Tooltip labelFormatter={(value) => new Date(value).toLocaleDateString()} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#8884d8"
                  activeDot={{ r: 8 }}
                  name="Jobs Posted"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
