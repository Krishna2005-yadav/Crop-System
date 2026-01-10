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
                            image_url: data.image_path
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
                        <div className="grid lg:grid-cols-3 gap-8">
                            {/* Left Column: Main Report (2/3 width) */}
                            <div className="md:col-span-2 space-y-6">
                                {/* Verdict Card */}
                                <Card className="border-none shadow-md overflow-hidden bg-white dark:bg-gray-800">
                                    <div className={cn("h-2 w-full", result.prediction.toLowerCase().includes("healthy") ? "bg-green-500" : "bg-red-500")} />
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    {result.prediction.toLowerCase().includes("healthy") ? (
                                                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-green-100 text-green-700">
                                                            <CheckCircle className="h-4 w-4" /> Healthy
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-red-100 text-red-700">
                                                            <AlertTriangle className="h-4 w-4" /> Disease Detected
                                                        </span>
                                                    )}
                                                    <span className="text-sm text-muted-foreground font-medium px-2 border-l">
                                                        {result.confidence.toFixed(1)}% Confidence
                                                    </span>
                                                </div>
                                                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
                                                    {result.disease_details?.name || result.prediction.replace(/_/g, ' ')}
                                                </h2>
                                                <p className="text-muted-foreground mt-1 text-lg">
                                                    {result.disease_details?.plant || 'Unknown Plant'}
                                                </p>
                                            </div>
                                            {/* Confidence Ring/Indicator (Visual only) */}
                                            <div className="relative h-16 w-16 hidden sm:flex items-center justify-center rounded-full border-4 border-gray-100 dark:border-gray-700">
                                                <span className="text-xs font-bold text-gray-600 dark:text-gray-300">{Math.round(result.confidence)}%</span>
                                                <div
                                                    className={cn("absolute inset-0 rounded-full border-4 border-t-transparent animate-spin-slow", result.prediction.includes("healthy") ? "border-green-500" : "border-red-500")}
                                                    style={{ transform: `rotate(${result.confidence * 3.6}deg)` }}
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Detailed Info Grid */}
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {/* Symptoms */}
                                    <Card className="bg-orange-50/50 dark:bg-orange-950/20 border-orange-100/50 dark:border-orange-900/40 shadow-sm hover:shadow-md transition-shadow">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-base font-semibold text-orange-900 dark:text-orange-200 flex items-center gap-2">
                                                <div className="p-1.5 bg-orange-100 dark:bg-orange-900/50 rounded-md">
                                                    <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                                </div>
                                                Symptoms
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                                {result.disease_details?.symptoms || "No specific symptoms recorded."}
                                            </p>
                                        </CardContent>
                                    </Card>

                                    {/* Treatment */}
                                    <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-100/50 dark:border-blue-900/40 shadow-sm hover:shadow-md transition-shadow">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-base font-semibold text-blue-900 dark:text-blue-200 flex items-center gap-2">
                                                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/50 rounded-md">
                                                    <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                Treatment
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                                {result.disease_details?.treatment || "No specific treatment recorded."}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>

                            {/* Right Column: Key Stats & Actions (1/3 width) */}
                            <div className="space-y-6">
                                {/* Probabilities Card */}
                                <Card className="shadow-sm dark:bg-gray-800 dark:border-gray-700">
                                    <CardHeader className="pb-3 border-b dark:border-gray-700 bg-muted/30 dark:bg-gray-900/30">
                                        <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                            🔍 Analysis Breakdown
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="divide-y max-h-[300px] overflow-y-auto custom-scrollbar">
                                            {Object.entries(result.all_probabilities || {})
                                                .sort(([, a], [, b]) => b - a)
                                                .map(([name, prob]) => (
                                                    <div key={name} className="flex items-center justify-between p-3 hover:bg-muted/50 dark:hover:bg-gray-700/50 transition-colors text-sm border-b dark:border-gray-700 last:border-0">
                                                        <span className={cn("font-medium truncate pr-2", prob > 0 ? "text-gray-900 dark:text-gray-200" : "text-gray-400 dark:text-gray-500")}>
                                                            {name.replace(/_/g, ' ').replace('Corn (maize)', '').replace('Potato', '').trim()}
                                                        </span>
                                                        <span className={cn("font-mono text-xs px-1.5 py-0.5 rounded", prob > 50 ? "bg-primary/10 text-primary font-bold" : "text-gray-400")}>
                                                            {prob.toFixed(1)}%
                                                        </span>
                                                    </div>
                                                ))}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Actions */}
                                <div className="flex flex-col gap-3">
                                    <Button variant="outline" onClick={clearFile} className="w-full h-12 border-dashed hover:border-solid whitespace-nowrap">
                                        <Upload className="mr-2 h-4 w-4" /> Analyze Another
                                    </Button>
                                    <Button variant="secondary" onClick={() => window.location.href = '/history'} className="w-full h-12 whitespace-nowrap">
                                        <History className="mr-2 h-4 w-4" /> View History
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
