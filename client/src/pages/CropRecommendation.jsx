import { useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Sprout, AlertCircle, Loader2, Info, Droplets, Thermometer, FlaskConical } from "lucide-react";
import { cn } from "../lib/utils";

const SOIL_PRESETS = [
    { name: "Alluvial Soil", n: 90, p: 42, k: 43, ph: 6.5, desc: "Common in Indo-Gangetic plains. Rich in Potash." },
    { name: "Black Soil", n: 60, p: 55, k: 50, ph: 7.2, desc: "Best for Cotton. High water retention." },
    { name: "Red/Laterite", n: 40, p: 30, k: 35, ph: 5.8, desc: "Found in Southern India. Good for pulses." },
    { name: "Sandy Soil", n: 20, p: 15, k: 25, ph: 6.0, desc: "Dry areas. Good for Watermelon/Cactus." },
];

export default function CropRecommendation() {
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [activePreset, setActivePreset] = useState(null);

    const { register, handleSubmit, setValue, formState: { errors }, watch } = useForm();

    // Watch values to show visual indicators
    const watchedN = watch("nitrogen");
    const watchedP = watch("phosphorus");
    const watchedK = watch("potassium");

    const getLevel = (val, type) => {
        const num = Number(val);
        if (!val) return null;
        if (type === 'N') {
            if (num < 40) return { label: "Low", color: "text-red-500 bg-red-50" };
            if (num < 100) return { label: "Medium", color: "text-orange-500 bg-orange-50" };
            return { label: "High", color: "text-green-500 bg-green-50" };
        }
        if (type === 'P' || type === 'K') {
            if (num < 30) return { label: "Low", color: "text-red-500 bg-red-50" };
            if (num < 60) return { label: "Medium", color: "text-orange-500 bg-orange-50" };
            return { label: "High", color: "text-green-500 bg-green-50" };
        }
        return null;
    };

    const applyPreset = (preset) => {
        setValue("nitrogen", preset.n);
        setValue("phosphorus", preset.p);
        setValue("potassium", preset.k);
        setValue("ph", preset.ph);
        setActivePreset(preset.name);
    };

    const onSubmit = async (data) => {
        setLoading(true);
        setError("");
        setResult(null);
        try {
            const response = await axios.post("/api/recommendation", {
                nitrogen: Number(data.nitrogen),
                phosphorus: Number(data.phosphorus),
                potassium: Number(data.potassium),
                temperature: Number(data.temperature),
                ph: Number(data.ph)
            });

            if (response.data.recommended) {
                setResult(response.data.recommended);
            } else {
                setError("Could not generate a recommendation.");
            }
        } catch (err) {
            setError(err.response?.data?.error || err.message || "Recommendation failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto py-8 px-4 max-w-6xl">
            <div className="mb-10 text-center">
                <h1 className="text-4xl font-extrabold tracking-tight mb-3 text-green-900 dark:text-green-400">Crop Advisor</h1>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                    Smart recommendations based on your soil health and environment.
                </p>
            </div>

            <div className="grid lg:grid-cols-12 gap-8">
                {/* Main Form Section */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Presets / Quick Fill */}
                    <Card className="border shadow-sm">
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2 text-green-700 font-semibold">
                                <FlaskConical className="h-5 w-5" />
                                <span>Don't have a soil report?</span>
                            </div>
                            <CardDescription>Select your common soil type to auto-fill average values.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {SOIL_PRESETS.map((p) => (
                                    <button
                                        key={p.name}
                                        type="button"
                                        onClick={() => applyPreset(p)}
                                        className={cn(
                                            "flex flex-col items-center p-3 rounded-xl border-2 transition-all text-xs font-medium space-y-1",
                                            activePreset === p.name
                                                ? "border-green-500 bg-green-50 text-green-700 shadow-sm"
                                                : "border-transparent bg-muted/30 hover:bg-muted/50 text-muted-foreground"
                                        )}
                                    >
                                        <span className="text-sm font-bold uppercase tracking-tight">{p.name.split(' ')[0]}</span>
                                        <span className="opacity-70 text-[10px]">Auto-fill</span>
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-md border-0 bg-white dark:bg-gray-800">
                        <CardHeader className="border-b mb-6 bg-muted/10">
                            <CardTitle>Detailed Parameters</CardTitle>
                            <CardDescription>Adjust the values for a more precise recommendation.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                    {/* N Input */}
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-end">
                                            <label className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Nitrogen (N)</label>
                                            {getLevel(watchedN, 'N') && (
                                                <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase", getLevel(watchedN, 'N').color)}>
                                                    {getLevel(watchedN, 'N').label}
                                                </span>
                                            )}
                                        </div>
                                        <div className="relative group">
                                            <Input
                                                type="number"
                                                placeholder="0-200"
                                                {...register("nitrogen", { required: "Required", min: 0, max: 300 })}
                                                className={cn("h-12 text-lg font-semibold transition-all focus:ring-green-500/20", errors.nitrogen ? "border-destructive bg-destructive/5" : "bg-muted/20 border-transparent")}
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground/50">kg/ha</span>
                                        </div>
                                    </div>

                                    {/* P Input */}
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-end">
                                            <label className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Phosphorus (P)</label>
                                            {getLevel(watchedP, 'P') && (
                                                <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase", getLevel(watchedP, 'P').color)}>
                                                    {getLevel(watchedP, 'P').label}
                                                </span>
                                            )}
                                        </div>
                                        <div className="relative group">
                                            <Input
                                                type="number"
                                                placeholder="0-150"
                                                {...register("phosphorus", { required: "Required", min: 0, max: 150 })}
                                                className={cn("h-12 text-lg font-semibold transition-all focus:ring-green-500/20", errors.phosphorus ? "border-destructive bg-destructive/5" : "bg-muted/20 border-transparent")}
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground/50">kg/ha</span>
                                        </div>
                                    </div>

                                    {/* K Input */}
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-end">
                                            <label className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Potassium (K)</label>
                                            {getLevel(watchedK, 'K') && (
                                                <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase", getLevel(watchedK, 'K').color)}>
                                                    {getLevel(watchedK, 'K').label}
                                                </span>
                                            )}
                                        </div>
                                        <div className="relative group">
                                            <Input
                                                type="number"
                                                placeholder="0-200"
                                                {...register("potassium", { required: "Required", min: 0, max: 300 })}
                                                className={cn("h-12 text-lg font-semibold transition-all focus:ring-green-500/20", errors.potassium ? "border-destructive bg-destructive/5" : "bg-muted/20 border-transparent")}
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground/50">kg/ha</span>
                                        </div>
                                    </div>

                                    {/* Env Inputs */}
                                    <div className="space-y-3">
                                        <label className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Temp (°C)</label>
                                        <div className="relative group">
                                            <Thermometer className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                type="number"
                                                placeholder="25.5"
                                                step="0.1"
                                                {...register("temperature", { required: "Required", min: -10, max: 60 })}
                                                className={cn("h-12 pl-10 text-lg font-semibold transition-all focus:ring-green-500/20", errors.temperature ? "border-destructive bg-destructive/5" : "bg-muted/20 border-transparent")}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Rainfall (mm)</label>
                                        <div className="relative group">
                                            <Droplets className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                type="number"
                                                placeholder="200"
                                                {...register("humidity", { required: "Required" })} // Reusing humidity field for rainfall/moisture as per model inputs usually
                                                defaultValue={200}
                                                className="h-12 pl-10 text-lg font-semibold bg-muted/20 border-transparent"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-sm font-bold uppercase tracking-wide text-muted-foreground">pH Level</label>
                                        <Input
                                            type="number"
                                            placeholder="6.5"
                                            step="0.1"
                                            {...register("ph", { required: "Required", min: 0, max: 14 })}
                                            className={cn("h-12 text-lg font-semibold transition-all focus:ring-green-500/20", errors.ph ? "border-destructive bg-destructive/5" : "bg-muted/20 border-transparent")}
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="bg-destructive/10 text-destructive text-sm p-4 rounded-xl flex items-center gap-2">
                                        <AlertCircle className="h-5 w-5" /> {error}
                                    </div>
                                )}

                                <Button type="submit" className="w-full h-14 text-lg font-bold shadow-lg shadow-green-500/20" size="lg" disabled={loading}>
                                    {loading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Analyzing Soil...</> : "Generate Recommendation"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Info & Result Side Section */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Guidance Card */}
                    <Card className="bg-green-700 text-white border-0 overflow-hidden shadow-xl">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Info className="h-32 w-32 -mr-16 -mt-16" />
                        </div>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Info className="h-5 w-5" />
                                <span>Farmer's Guide</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-green-50/90 text-sm">
                            <p>
                                <strong>N-P-K</strong> are the primary macronutrients for plants.
                            </p>
                            <ul className="space-y-2 list-disc pl-4 opacity-80">
                                <li><strong>N (Nitrogen):</strong> For leafy growth and green color.</li>
                                <li><strong>P (Phosphorus):</strong> For strong roots and flowers.</li>
                                <li><strong>K (Potassium):</strong> For overall plant health and disease resistance.</li>
                            </ul>
                            <div className="pt-2 border-t border-white/20">
                                <p className="font-semibold text-white">How to get exact data?</p>
                                <p className="text-xs">Take a soil sample to your nearest government <strong>Soil Testing Lab</strong> or use a <strong>Soil Health Card</strong>.</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Result Display */}
                    <Card className={cn("min-h-[300px] transition-all duration-700 shadow-lg border-2",
                        result ? "border-green-500 bg-white dark:bg-gray-800" : "bg-muted/50 border-dashed border-muted-foreground/30")}>
                        <CardContent className="h-full flex flex-col items-center justify-center text-center p-8">
                            {result ? (
                                <div className="space-y-6 animate-in fade-in zoom-in slide-in-from-top-4 duration-700">
                                    <div className="h-32 w-32 bg-green-50 dark:bg-green-900/20 rounded-2xl flex items-center justify-center shadow-inner mx-auto text-green-600 border border-green-100 dark:border-green-800">
                                        <Sprout className="h-16 w-16 animate-bounce" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-sm font-bold uppercase tracking-widest text-green-700 dark:text-green-500">Best Match Found</h3>
                                        <p className="text-5xl font-black text-green-900 dark:text-white drop-shadow-sm italic">{result}</p>
                                    </div>
                                    <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-xl text-sm font-medium text-green-800 dark:text-green-200 leading-relaxed border border-green-100 dark:border-green-900">
                                        Your soil and weather conditions are nearly perfect for growing <strong>{result}</strong>.
                                    </div>
                                    <Button variant="outline" className="w-full text-green-700 border-green-200" onClick={() => setResult(null)}>
                                        Check Another Area
                                    </Button>
                                </div>
                            ) : (
                                <div className="text-muted-foreground space-y-4 py-10">
                                    <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mx-auto opacity-40">
                                        <FlaskConical className="h-10 w-10" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-lg opacity-60">Analysis Pending</p>
                                        <p className="text-xs opacity-50 px-6">Provide soil details to see the ideal crop for your land.</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
