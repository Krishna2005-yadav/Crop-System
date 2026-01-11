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

    const [selectedDetection, setSelectedDetection] = useState(null);
    const [visibleDetections, setVisibleDetections] = useState(6);
    const [visibleRecommendations, setVisibleRecommendations] = useState(10);

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

    const handleDeleteDetection = async (id, e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (!window.confirm("Are you sure you want to delete this record?")) return;
        try {
            await axios.delete(`/api/detections/${id}`);
            setDetections(detections.filter(d => d.id !== id));
            if (selectedDetection?.id === id) setSelectedDetection(null);
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
            {/* Full Detail Modal */}
            {selectedDetection && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300"
                    onClick={() => setSelectedDetection(null)}
                >
                    <div
                        className="bg-background w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl p-6 relative animate-in zoom-in-95 duration-300"
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setSelectedDetection(null)}
                            className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors"
                        >
                            <Trash2 className="h-5 w-5 rotate-45" />
                        </button>

                        <div className="flex flex-col items-center text-center space-y-4 pt-4">
                            <div className={cn(
                                "inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ring-1",
                                selectedDetection.disease.toLowerCase().includes("healthy")
                                    ? "bg-green-100 text-green-700 ring-green-200 dark:bg-green-900/40 dark:text-green-300 dark:ring-green-800"
                                    : "bg-red-100 text-red-700 ring-red-200 dark:bg-red-900/40 dark:text-red-300 dark:ring-red-800"
                            )}>
                                {selectedDetection.disease.toLowerCase().includes("healthy") ? <CheckCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                                Historical Analysis Report
                            </div>

                            <h2 className="text-3xl font-extrabold tracking-tight">
                                {selectedDetection.disease_details?.plant || selectedDetection.plant_name}: {selectedDetection.disease_details?.name || selectedDetection.disease.replace(/___/g, ': ').replace(/_/g, ' ')}
                            </h2>
                            <p className="text-muted-foreground font-medium">
                                {selectedDetection.confidence.toFixed(1)}% Confidence • Detected on {format(new Date(selectedDetection.created_at || Date.now()), 'MMM d, yyyy')}
                            </p>

                            <div className="relative h-48 w-48 rounded-full border-4 border-background shadow-lg overflow-hidden my-4">
                                <img src={selectedDetection.image_url} alt="Detection" className="w-full h-full object-cover" loading="lazy" />
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4 w-full text-left">
                                <div className="space-y-2 p-4 bg-muted/40 rounded-xl min-h-[140px]">
                                    <h4 className="font-bold flex items-center gap-2 text-orange-600 dark:text-orange-400">
                                        <AlertTriangle className="h-4 w-4" /> Symptoms
                                    </h4>
                                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                        {selectedDetection.disease_details?.symptoms || "No specific symptom information available for this record."}
                                    </p>
                                </div>
                                <div className="space-y-2 p-4 bg-muted/40 rounded-xl min-h-[140px]">
                                    <h4 className="font-bold flex items-center gap-2 text-green-600 dark:text-green-400">
                                        <CheckCircle className="h-4 w-4" /> Treatment
                                    </h4>
                                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                        {selectedDetection.disease_details?.treatment || "Maintain general crop health and consult an expert if symptoms persist."}
                                    </p>
                                </div>
                            </div>

                            {selectedDetection.all_probabilities && Object.keys(selectedDetection.all_probabilities).length > 0 && (
                                <div className="w-full text-left p-4 bg-muted/20 rounded-xl space-y-3">
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Probability Analysis Breakdown</h4>
                                    <div className="space-y-2">
                                        {Object.entries(selectedDetection.all_probabilities)
                                            .sort(([, a], [, b]) => b - a)
                                            .map(([name, prob]) => (
                                                <div key={name} className="space-y-1">
                                                    <div className="flex justify-between text-xs font-medium">
                                                        <span>{name.replace(/_/g, ' ')}</span>
                                                        <span>{prob.toFixed(1)}%</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                        <div
                                                            className={cn("h-full rounded-full transition-all duration-1000", prob > 70 ? "bg-primary" : "bg-orange-400")}
                                                            style={{ width: `${prob}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}

                            <Button onClick={() => setSelectedDetection(null)} className="w-full rounded-full h-12">Close Report</Button>
                        </div>
                    </div>
                </div>
            )}

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
                <div className="space-y-8 pb-8">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {detections.length === 0 ? (
                            <div className="col-span-full text-center py-12 text-muted-foreground">
                                <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                <p>No disease detection history found.</p>
                            </div>
                        ) : (
                            detections.slice(0, visibleDetections).map((item) => (
                                <Card
                                    key={item.id}
                                    className="overflow-hidden group hover:shadow-lg hover:ring-2 hover:ring-primary/20 transition-all cursor-pointer bg-card border-muted/60"
                                    onClick={(e) => {
                                        if (e.target.closest('button')) return;
                                        setSelectedDetection(item);
                                    }}
                                >
                                    <div className="aspect-[16/10] relative bg-muted overflow-hidden">
                                        {item.image_url ? (
                                            <img
                                                src={item.image_url}
                                                alt={item.plant_name}
                                                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-gray-400">
                                                <ImageIcon className="h-8 w-8" />
                                            </div>
                                        )}
                                        <div className="absolute top-3 right-3 flex gap-1 transform translate-y-[-10px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                            <button
                                                onClick={(e) => handleDeleteDetection(item.id, e)}
                                                className="bg-white/90 dark:bg-gray-900/90 p-2 rounded-full text-destructive hover:bg-destructive hover:text-white transition-all shadow-lg"
                                                title="Delete Record"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                        <div className="absolute bottom-3 left-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0">
                                            <span className="text-[10px] font-bold text-white uppercase tracking-widest bg-primary/80 px-2 py-0.5 rounded shadow-sm">View Report</span>
                                        </div>
                                    </div>
                                    <CardContent className="p-5">
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-lg leading-tight text-foreground line-clamp-2 min-h-[3.5rem] group-hover:text-primary transition-colors">
                                                        {item.disease.replace(/___/g, ': ').replace(/_/g, ' ')}
                                                    </h3>
                                                    <p className="text-sm font-medium text-muted-foreground mt-1 flex items-center gap-1.5">
                                                        <Sprout className="h-3.5 w-3.5 text-primary" />
                                                        {item.plant_name}
                                                    </p>
                                                </div>
                                                <div className="pl-3 self-start mt-1">
                                                    {item.disease.toLowerCase().includes('healthy') ? (
                                                        <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-full shadow-sm">
                                                            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                                        </div>
                                                    ) : (
                                                        <div className="p-1.5 bg-red-100 dark:bg-red-900/30 rounded-full shadow-sm">
                                                            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="pt-2 flex items-center justify-between border-t border-muted/40">
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    {format(new Date(item.created_at || Date.now()), 'MMM d, yyyy')}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <div className="h-1.5 w-12 bg-muted rounded-full overflow-hidden">
                                                        <div className="h-full bg-primary" style={{ width: `${item.confidence}%` }} />
                                                    </div>
                                                    <span className="text-xs font-bold text-primary">
                                                        {item.confidence.toFixed(0)}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                    {visibleDetections < detections.length && (
                        <div className="flex justify-center pt-4">
                            <Button
                                variant="outline"
                                onClick={() => setVisibleDetections(prev => prev + 6)}
                                className="rounded-full px-8 hover:bg-primary hover:text-primary-foreground transition-all"
                            >
                                Load More Detections
                            </Button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
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
                                        {recommendations.slice(0, visibleRecommendations).map((rec) => (
                                            <tr key={rec.id} className="bg-card border-b hover:bg-muted/30">
                                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
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
                    {visibleRecommendations < recommendations.length && (
                        <div className="flex justify-center pt-2">
                            <Button
                                variant="outline"
                                onClick={() => setVisibleRecommendations(prev => prev + 10)}
                                className="rounded-full px-8 hover:bg-primary hover:text-primary-foreground transition-all"
                            >
                                Load More Recommendations
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
