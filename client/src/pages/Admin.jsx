import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
    Users,
    Activity,
    Shield,
    Search,
    Ban,
    CheckCircle,
    Trash2,
    Loader2,
    Leaf,
    Sprout,
    AlertTriangle,
    BarChart3
} from "lucide-react";
import { cn } from "../lib/utils";
import axios from "axios";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

export default function Admin() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // User Management State
    const [searchTerm, setSearchTerm] = useState("");
    const [processingUser, setProcessingUser] = useState(null);
    const [actionModal, setActionModal] = useState({ show: false, user: null, type: '' });

    useEffect(() => {
        fetchAdminData();
    }, []);

    const fetchAdminData = async () => {
        setLoading(true);
        try {
            const [statsRes, usersRes] = await Promise.all([
                axios.get("/api/admin/stats"),
                axios.get("/api/admin/users")
            ]);
            setStats(statsRes.data);
            setUsers(usersRes.data.users || []);
        } catch (err) {
            setError(err.response?.data?.error || "Failed to load admin data");
        } finally {
            setLoading(false);
        }
    };

    const handleUserAction = async (userId, action, reason = "") => {
        setProcessingUser(userId);
        try {
            if (action === 'delete') {
                await axios.delete(`/api/admin/users/${userId}`);
                setUsers(prev => prev.filter(u => u.id !== userId));
            } else {
                await axios.put(`/api/admin/users/${userId}/status`, {
                    action,
                    reason,
                    duration_days: action === 'ban' ? 7 : 0 // Default 7 days for temp ban
                });
                // Refresh user list to get updated status
                const { data } = await axios.get("/api/admin/users");
                setUsers(data.users || []);
            }
            setActionModal({ show: false, user: null, type: '' });
        } catch (err) {
            alert(err.response?.data?.error || "Action failed");
        } finally {
            setProcessingUser(null);
        }
    };

    const filteredUsers = users.filter(u =>
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

    return (
        <div className="container mx-auto py-8 px-4 max-w-7xl">
            <header className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <Shield className="h-8 w-8 text-primary" />
                    <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                </div>
                <p className="text-muted-foreground">Monitor platform statistics and manage user accounts.</p>
            </header>

            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-100 dark:border-blue-900/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{stats?.total_users}</div>
                        <p className="text-xs text-blue-600/60 dark:text-blue-400/60">Registered accounts</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-100 dark:border-green-900/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">Diseases Detect.</CardTitle>
                        <Leaf className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-700 dark:text-green-400">{stats?.total_detections}</div>
                        <p className="text-xs text-green-600/60 dark:text-green-400/60">Scans processed</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-100 dark:border-amber-900/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-400">Recs Generated</CardTitle>
                        <Sprout className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">{stats?.total_recommendations}</div>
                        <p className="text-xs text-amber-600/60 dark:text-amber-400/60">Crop suggestions</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-100 dark:border-purple-900/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-400">Activity</CardTitle>
                        <Activity className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">Active</div>
                        <p className="text-xs text-purple-600/60 dark:text-purple-400/60">Platform status</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 mb-8">
                {/* Disease Stats */}
                <Card>
                    <CardHeader>
                        <CardTitle>Disease Analytics</CardTitle>
                        <CardDescription>Most frequent disease predictions</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats?.disease_stats?.slice(0, 5).map((item, i) => (
                                <div key={i} className="flex items-center">
                                    <div className="w-full max-w-[120px] text-sm truncate mr-2" title={item.name}>{item.name.replace(/_/g, ' ')}</div>
                                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary/80 rounded-full"
                                            style={{ width: `${(item.count / stats.total_detections) * 100}%` }}
                                        />
                                    </div>
                                    <div className="ml-2 text-sm font-mono w-10 text-right">{item.count}</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Crop Stats */}
                <Card>
                    <CardHeader>
                        <CardTitle>Crop Trends</CardTitle>
                        <CardDescription>Most recommended crops</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats?.crop_stats?.slice(0, 5).map((item, i) => (
                                <div key={i} className="flex items-center">
                                    <div className="w-full max-w-[120px] text-sm truncate mr-2">{item.name}</div>
                                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-green-500 rounded-full"
                                            style={{ width: `${(item.count / stats.total_recommendations) * 100}%` }}
                                        />
                                    </div>
                                    <div className="ml-2 text-sm font-mono w-10 text-right">{item.count}</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* User Management */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <CardTitle>User Management</CardTitle>
                            <CardDescription>Manage user access and permissions</CardDescription>
                        </div>
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search users..."
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-muted-foreground border-b">
                                <tr>
                                    <th className="p-4 font-medium">User</th>
                                    <th className="p-4 font-medium">Status</th>
                                    <th className="p-4 font-medium text-center">Activity</th>
                                    <th className="p-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((u) => (
                                    <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                        <td className="p-4">
                                            <div className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                                {u.username}
                                                {u.is_admin === 1 && <Shield className="h-3 w-3 text-blue-500" />}
                                            </div>
                                            <div className="text-muted-foreground text-xs">{u.email}</div>
                                        </td>
                                        <td className="p-4">
                                            {u.banned_until ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                                                    <Ban className="h-3 w-3" />
                                                    Banned
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                    <CheckCircle className="h-3 w-3" />
                                                    Active
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="text-xs text-muted-foreground">
                                                <span className="font-medium text-gray-900 dark:text-gray-100">{u.detection_count}</span> scans •
                                                <span className="font-medium text-gray-900 dark:text-gray-100 mx-1">{u.recommendation_count}</span> recs
                                            </div>
                                        </td>
                                        <td className="p-4 text-right space-x-2">
                                            {u.id !== user?.id && (
                                                <>
                                                    {u.banned_until ? (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                            onClick={() => handleUserAction(u.id, 'unban')}
                                                            disabled={processingUser === u.id}
                                                        >
                                                            Unban
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                                            onClick={() => setActionModal({ show: true, user: u, type: 'ban' })}
                                                            disabled={processingUser === u.id}
                                                        >
                                                            Ban
                                                        </Button>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => setActionModal({ show: true, user: u, type: 'delete' })}
                                                        disabled={processingUser === u.id}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Action Modal */}
            <AnimatePresence>
                {actionModal.show && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6"
                        >
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                {actionModal.type === 'delete' ? (
                                    <><Trash2 className="text-red-500" /> Delete User</>
                                ) : (
                                    <><Ban className="text-amber-500" /> Ban User</>
                                )}
                            </h2>

                            <div className="mb-6">
                                <p className="text-muted-foreground mb-4">
                                    {actionModal.type === 'delete'
                                        ? `Are you surely you want to delete ${actionModal.user.username}? This cannot be undone.`
                                        : `Select ban type for ${actionModal.user.username}:`
                                    }
                                </p>

                                {actionModal.type === 'ban' && (
                                    <div className="flex flex-col gap-3">
                                        <Button
                                            variant="outline"
                                            className="justify-start border-amber-200 hover:bg-amber-50 text-amber-800"
                                            onClick={() => handleUserAction(actionModal.user.id, 'ban')}
                                        >
                                            <div className="text-left">
                                                <div className="font-semibold">Temporary Ban (7 Days)</div>
                                                <div className="text-xs opacity-70">For minor violations</div>
                                            </div>
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="justify-start border-red-200 hover:bg-red-50 text-red-800"
                                            onClick={() => handleUserAction(actionModal.user.id, 'permanent_ban')}
                                        >
                                            <div className="text-left">
                                                <div className="font-semibold">Permanent Ban</div>
                                                <div className="text-xs opacity-70">For severe violations</div>
                                            </div>
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-3">
                                <Button variant="ghost" onClick={() => setActionModal({ show: false, user: null, type: '' })}>
                                    Cancel
                                </Button>
                                {actionModal.type === 'delete' && (
                                    <Button
                                        variant="destructive"
                                        onClick={() => handleUserAction(actionModal.user.id, 'delete')}
                                    >
                                        Confirm Delete
                                    </Button>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
