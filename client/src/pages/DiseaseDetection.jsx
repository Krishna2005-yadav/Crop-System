import { useState, useRef } from "react";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Upload, X, Loader2, AlertTriangle, CheckCircle, Info, History } from "lucide-react";
import { cn } from "../lib/utils";
import { useAuth } from "../context/AuthContext";

export default function DiseaseDetection() {
    const { user } = useAuth();
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            if (selectedFile.size > 10 * 1024 * 1024) {
                setError("File size must be less than 10MB");
                return;
            }
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
            setError("");
            setResult(null);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const selectedFile = e.dataTransfer.files[0];
        if (selectedFile) {
            if (selectedFile.size > 10 * 1024 * 1024) {
                setError("File size must be less than 10MB");
                return;
            }
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
            setError("");
            setResult(null);
        }
    };

    const clearFile = () => {
        setFile(null);
        setPreview(null);
        setResult(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const analyzeImage = async () => {
        if (!file) return;

        setLoading(true);
        setError("");

        const formData = new FormData();
        formData.append("image", file);

        try {
            // 1. Get Prediction
            const { data } = await axios.post("/predict-disease", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (data.success) {
                setResult(data);

                // 2. Log Detection (Silent background save)
                if (user) {
                    try {
                        await axios.post("/api/detections", {
                            plant_name: data.prediction.split('___')[0].replace('_', ' '), // Extract plant name from class
                            disease: data.prediction,
                            confidence: data.confidence,
                            image_url: data.image_path,
                            all_probabilities: data.all_probabilities
                        });
                    } catch (logErr) {
                        console.error("Failed to log detection", logErr);
                    }
                }
            } else {
                setError(data.error || "Prediction failed");
            }
        } catch (err) {
            setError(err.message || "An error occurred during analysis");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto py-8 px-4 max-w-6xl">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold tracking-tight mb-2">Crop Disease Detection</h1>
                <p className="text-muted-foreground">Upload a photo of your crop leaf to identify diseases and get treatment advice.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Upload Section */}
                <div className="space-y-4">
                    <Card className={cn("border-2 border-dashed transition-all", preview ? "border-primary/50 bg-primary/5" : "hover:border-primary/50 hover:bg-muted/50")}>
                        <CardContent
                            className="flex flex-col items-center justify-center py-12 px-4 text-center cursor-pointer"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleDrop}
                            onClick={() => !preview && fileInputRef.current.click()}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                            />

                            {preview ? (
                                <div className="relative w-full aspect-square md:aspect-video rounded-lg overflow-hidden shadow-sm">
                                    <img src={preview} alt="Preview" className="w-full h-full object-contain bg-black/5" />
                                    <button
                                        onClick={(e) => { e.stopPropagation(); clearFile(); }}
                                        className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
                                        <Upload className="h-8 w-8" />
                                    </div>
                                    <h3 className="font-semibold text-lg mb-1">Click to upload or drag & drop</h3>
                                    <p className="text-sm text-muted-foreground max-w-xs">
                                        Support JPG, PNG, WEBP. Max size 10MB.
                                    </p>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {file && !result && (
                        <Button onClick={analyzeImage} disabled={loading} className="w-full text-lg h-12">
                            {loading ? (
                                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Analyzing Crop...</>
                            ) : (
                                "Run Analysis"
                            )}
                        </Button>
                    )}

                    {error && (
                        <div className="bg-destructive/10 text-destructive p-4 rounded-lg flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 mt-0.5" />
                            <p>{error}</p>
                        </div>
                    )}
                </div>

                {/* Results Section */}
                <div className="space-y-4">
                    {!result && !loading && (
                        <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground bg-muted/50 rounded-xl border border-dashed">
                            <Info className="h-12 w-12 mb-4 opacity-20" />
                            <h3 className="text-lg font-medium mb-2">No Analysis Yet</h3>
                            <p>Upload an image and run analysis to see disease details, confidence scores, and recommendations here.</p>
                        </div>
                    )}

                    {loading && (
                        <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4 bg-white rounded-xl border shadow-sm">
                            <Loader2 className="h-12 w-12 text-primary animate-spin" />
                            <div>
                                <h3 className="font-medium text-lg">Analyzing Image...</h3>
                                <p className="text-muted-foreground text-sm">Our AI is checking for disease patterns.</p>
                            </div>
                        </div>
                    )}

                    {result && (
                        <div className="space-y-6 max-w-4xl mx-auto">
                            {/* 1. Instant Report Header */}
                            <div className="flex flex-col items-center text-center space-y-3 mb-8">
                                <div className={cn(
                                    "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm transition-all animate-in fade-in zoom-in duration-500",
                                    result.prediction.toLowerCase().includes("healthy")
                                        ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 ring-1 ring-green-200 dark:ring-green-800"
                                        : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 ring-1 ring-red-200 dark:ring-red-800"
                                )}>
                                    {result.prediction.toLowerCase().includes("healthy") ? (
                                        <CheckCircle className="h-4 w-4" />
                                    ) : (
                                        <AlertTriangle className="h-4 w-4" />
                                    )}
                                    Instant Report: Analysis Complete
                                </div>
                                <h2 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                                    {result.disease_details ? `${result.disease_details.plant}: ${result.disease_details.name}` : result.prediction.replace(/___/g, ': ').replace(/_/g, ' ')}
                                </h2>
                                <p className="text-xl text-muted-foreground font-medium">
                                    {result.confidence.toFixed(1)}% Confidence • {result.disease_details?.plant || 'Unknown Plant'}
                                </p>
                            </div>

                            {/* 2. Visual Comparison Section */}
                            <div className="flex flex-wrap justify-center gap-12 py-6">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="relative group">
                                        <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-primary/10 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                                        <div className="relative h-48 w-48 rounded-full border-4 border-white dark:border-gray-800 shadow-xl overflow-hidden bg-muted">
                                            <img src={preview} alt="Uploaded Leaf" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold tracking-wide text-muted-foreground uppercase">Uploaded Leaf</span>
                                </div>

                                <div className="flex flex-col items-center gap-3">
                                    <div className="relative group">
                                        <div className="absolute -inset-1 bg-gradient-to-r from-green-500/20 to-emerald-500/10 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                                        <div className="relative h-48 w-48 rounded-full border-4 border-white dark:border-gray-800 shadow-xl overflow-hidden bg-muted flex items-center justify-center">
                                            <div className="absolute inset-0 bg-green-500/5 dark:bg-green-500/10" />
                                            {/* Using a generic leaf icon as we don't have a specific reference image in DB yet */}
                                            <Info className="h-12 w-12 text-primary/40" />
                                            <img
                                                src={result.prediction.toLowerCase().includes("corn") ? "/images/diseases/corn_common_rust.png" : "/images/diseases/potato_late_blight.png"}
                                                alt="Reference Leaf"
                                                className="absolute inset-0 w-full h-full object-cover opacity-60 grayscale hover:grayscale-0 transition-all duration-500"
                                            />
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold tracking-wide text-muted-foreground uppercase">Reference: {result.disease_details?.name || result.prediction.replace(/_/g, ' ')}</span>
                                </div>
                            </div>

                            {/* 3. Details & Probability Grid */}
                            <div className="grid md:grid-cols-2 gap-6 mt-8">
                                <Card className="border-none shadow-md bg-white/50 dark:bg-gray-800/40 backdrop-blur-sm">
                                    <CardHeader className="pb-3 px-6 pt-6">
                                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                                            <AlertTriangle className="h-5 w-5 text-orange-500" />
                                            Symptoms
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="px-6 pb-6">
                                        <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                            {result.disease_details?.symptoms || "No specific symptoms recorded for this detection."}
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card className="border-none shadow-md bg-white/50 dark:bg-gray-800/40 backdrop-blur-sm">
                                    <CardHeader className="pb-3 px-6 pt-6">
                                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                                            <CheckCircle className="h-5 w-5 text-green-500" />
                                            Treatment
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="px-6 pb-6">
                                        <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                            {result.disease_details?.treatment || "Maintain general crop health and consult a local agricultural expert."}
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* 4. Probability Analysis */}
                            <Card className="border-none shadow-sm bg-muted/30 dark:bg-gray-900/30">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                                        Probability Analysis
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {Object.entries(result.all_probabilities || {})
                                        .sort(([, a], [, b]) => b - a)
                                        .map(([name, prob]) => (
                                            <div key={name} className="space-y-1.5">
                                                <div className="flex justify-between text-sm font-medium px-1">
                                                    <span>{name.replace(/_/g, ' ')}</span>
                                                    <span className="font-mono">{prob.toFixed(1)}%</span>
                                                </div>
                                                <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <div
                                                        className={cn(
                                                            "h-full rounded-full transition-all duration-1000 ease-out",
                                                            prob > 70 ? "bg-primary" : prob > 30 ? "bg-orange-500" : "bg-gray-400"
                                                        )}
                                                        style={{ width: `${prob}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                </CardContent>
                            </Card>

                            {/* 5. Actions */}
                            <div className="flex flex-wrap justify-center gap-4 pt-6">
                                <Button size="lg" variant="outline" onClick={clearFile} className="px-8 h-12 rounded-full border-dashed">
                                    <Upload className="mr-2 h-4 w-4" /> Analyze Another
                                </Button>
                                <Button size="lg" onClick={() => window.location.href = '/history'} className="px-8 h-12 rounded-full">
                                    <History className="mr-2 h-4 w-4" /> View Full History
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
