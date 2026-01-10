import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { BarChart3, Leaf, Sprout, History, ArrowUpRight, Loader2, Microscope } from "lucide-react";
import { cn } from "../lib/utils";

export default function Dashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await axios.get("/api/dashboard-data");
                setStats(data);
            } catch (err) {
                setError("Failed to load dashboard data");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Welcome Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                        <p className="text-muted-foreground mt-1">
                            Welcome back, {user?.username}! Here's an overview of your farming activities.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Link to="/detect-disease">
                            <Button className="gap-2 shadow-sm">
                                <Microscope className="h-4 w-4" /> Detect Disease
                            </Button>
                        </Link>
                        <Link to="/recommend-crop">
                            <Button variant="outline" className="gap-2 shadow-sm">
                                <Sprout className="h-4 w-4" /> Recommend Crop
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Analyses</CardTitle>
                            <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.total_detections || 0}</div>
                            <p className="text-xs text-muted-foreground">Disease detection reports</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Recommendations</CardTitle>
                            <Sprout className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.total_recs || 0}</div>
                            <p className="text-xs text-muted-foreground">Crop suggestions generated</p>
                        </CardContent>
                    </Card>
                    {/* Placeholders for other stats if available in future */}
                    <Card className="bg-primary/5 border-primary/20">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-primary">Healthy Crops</CardTitle>
                            <Leaf className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-primary">--</div>
                            <p className="text-xs text-primary/70">From your recent scans</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    {/* Recent Activity / Chart Placeholder */}
                    <Card className="col-span-4">
                        <CardHeader>
                            <CardTitle>Activity Overview</CardTitle>
                            <CardDescription>
                                Summary of your disease detections and crop recommendations over the past 12 months.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pl-2">
                            {/* Very Basic Bar Chart Visualization */}
                            <div className="h-[200px] w-full flex items-end gap-2 px-4 py-2 border-b border-l dark:border-gray-700 bg-muted/30 rounded-md">
                                {stats?.months?.slice(0, 8).map((month, i) => {
                                    const count = (stats?.recs_by_month?.[i] || 0) + (stats?.detections_by_month?.[i] || 0); // Assuming API returns similar structure or we use recs
                                    // Mocking height for visual if data is 0
                                    const height = count > 0 ? `${Math.min(count * 10, 100)}%` : '5%';
                                    return (
                                        <div key={month} className="flex-1 flex flex-col items-center gap-2 group">
                                            <div
                                                className="w-full bg-primary/20 group-hover:bg-primary/40 transition-colors rounded-t-sm relative"
                                                style={{ height }}
                                            >
                                                <span className="opacity-0 group-hover:opacity-100 absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold bg-white px-1 rounded shadow">{count}</span>
                                            </div>
                                            <span className="text-[10px] text-muted-foreground rotate-0 truncate w-full text-center">{month}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent History List */}
                    <Card className="col-span-3">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Recent Detections</CardTitle>
                                <CardDescription>Your latest disease analysis results</CardDescription>
                            </div>
                            <Link to="/history">
                                <Button variant="outline" size="sm" className="gap-2">
                                    View All <ArrowUpRight className="h-4 w-4" />
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex justify-center py-4"><Loader2 className="animate-spin h-6 w-6 text-gray-400" /></div>
                            ) : stats?.recent_detections?.length > 0 ? (
                                <div className="space-y-4">
                                    {stats.recent_detections.map((item) => (
                                        <div key={item.id} className="flex items-center gap-4 p-3 bg-white rounded-lg border shadow-sm">
                                            <div className="h-12 w-12 rounded-full bg-gray-100 flex-shrink-0 overflow-hidden">
                                                {item.image_url ? (
                                                    <img src={item.image_url} alt={item.plant_name} className="h-full w-full object-cover" />
                                                ) : (
                                                    <Leaf className="h-6 w-6 m-3 text-gray-400" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {item.disease.replace(/_/g, ' ')}
                                                </p>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {item.plant_name} • {new Date(item.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${item.disease.toLowerCase().includes('healthy') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {item.disease.toLowerCase().includes('healthy') ? 'Healthy' : 'Disease'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                                    <History className="h-10 w-10 mb-3 opacity-20" />
                                    <p>No recent detections found</p>
                                    <Link to="/detect-disease">
                                        <Button variant="link" className="mt-2 text-primary">Start Detection &rarr;</Button>
                                    </Link>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
