import { useEffect, useState } from "react";
import axios from "axios";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Loader2, Calendar, AlertTriangle, CheckCircle, Sprout, ImageIcon, Trash2 } from "lucide-react";
import { cn } from "../lib/utils";

export default function History() {
    const [activeTab, setActiveTab] = useState("detections");
    const [detections, setDetections] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchData = async () => {
        setLoading(true);
        try {
            const [detRes, recRes] = await Promise.all([
                axios.get("/api/detections"),
                axios.get("/api/recommendations")
            ]);
            setDetections(detRes.data.detections || []);
            setRecommendations(recRes.data.recommendations || []);
        } catch (err) {
            setError("Failed to load history data");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDeleteDetection = async (id) => {
        if (!window.confirm("Are you sure you want to delete this record?")) return;
        try {
            await axios.delete(`/api/detections/${id}`);
            setDetections(detections.filter(d => d.id !== id));
        } catch (err) {
            alert("Failed to delete record");
        }
    };

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-4 max-w-5xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight mb-2">Analysis History</h1>
                <p className="text-muted-foreground">View your past disease detections and crop recommendations.</p>
            </div>

            <div className="flex space-x-1 rounded-xl bg-muted p-1 mb-8 max-w-md">
                <button
                    onClick={() => setActiveTab("detections")}
                    className={cn(
                        "w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all text-center",
                        activeTab === "detections"
                            ? "bg-background text-primary shadow"
                            : "text-muted-foreground hover:bg-background/50 hover:text-primary"
                    )}
                >
                    Disease Detections
                </button>
                <button
                    onClick={() => setActiveTab("recommendations")}
                    className={cn(
                        "w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all text-center",
                        activeTab === "recommendations"
                            ? "bg-background text-primary shadow"
                            : "text-muted-foreground hover:bg-background/50 hover:text-primary"
                    )}
                >
                    Crop Recommendations
                </button>
            </div>

            {activeTab === "detections" ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {detections.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-muted-foreground">
                            <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-20" />
                            <p>No disease detection history found.</p>
                        </div>
                    ) : (
                        detections.map((item) => (
                            <Card key={item.id} className="overflow-hidden group hover:shadow-md transition-all">
                                <div className="aspect-video relative bg-muted overflow-hidden">
                                    {item.image_url ? (
                                        <img
                                            src={item.image_url}
                                            alt={item.plant_name}
                                            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-gray-400">
                                            <ImageIcon className="h-8 w-8" />
                                        </div>
                                    )}
                                    <div className="absolute top-2 right-2 flex gap-1">
                                        <button
                                            onClick={() => handleDeleteDetection(item.id)}
                                            className="bg-background/90 p-1.5 rounded-full text-destructive hover:bg-destructive/10 transition-colors shadow-sm"
                                            title="Delete"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="font-semibold text-lg truncate pr-2" title={item.disease.replace(/_/g, ' ')}>
                                                {item.disease.replace(/_/g, ' ')}
                                            </h3>
                                            <p className="text-sm text-muted-foreground capitalize">{item.plant_name}</p>
                                        </div>
                                        {item.disease.toLowerCase().includes('healthy') ? (
                                            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                                        ) : (
                                            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
                                        )}
                                    </div>

                                    <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {format(new Date(item.created_at || Date.now()), 'MMM d, yyyy')}
                                        </div>
                                        <span className="bg-muted px-2 py-1 rounded-full font-medium">
                                            {item.confidence.toFixed(1)}% Conf.
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            ) : (
                <div className="grid gap-4">
                    {recommendations.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
                            <Sprout className="h-12 w-12 mx-auto mb-3 opacity-20" />
                            <p>No crop recommendations found.</p>
                        </div>
                    ) : (
                        <div className="border rounded-lg overflow-hidden bg-card shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                                        <tr>
                                            <th className="px-6 py-3">Date</th>
                                            <th className="px-6 py-3">Recommended Crop</th>
                                            <th className="px-6 py-3">N - P - K</th>
                                            <th className="px-6 py-3">Temp / pH</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recommendations.map((rec) => (
                                            <tr key={rec.id} className="bg-card border-b hover:bg-muted/30">
                                                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                                    {format(new Date(rec.created_at || Date.now()), 'MMM d, yyyy h:mm a')}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                                                        <Sprout className="h-3 w-3" />
                                                        {rec.crop}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-muted-foreground">
                                                    {rec.nitrogen} - {rec.phosphorus} - {rec.potassium}
                                                </td>
                                                <td className="px-6 py-4 text-muted-foreground">
                                                    {rec.temperature}°C / {rec.ph} pH
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
