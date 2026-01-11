import { useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { FlaskConical, AlertCircle, Loader2, Info, CheckCircle2 } from "lucide-react";
import { cn } from "../lib/utils";

const CROPS = [
    "Rice", "Maize", "Chickpea", "Kidneybeans", "Pigeonpeas", "Mothbeans",
    "Mungbean", "Blackgram", "Lentil", "Pomegranate", "Banana", "Mango",
    "Grapes", "Watermelon", "Muskmelon", "Apple", "Orange", "Papaya",
    "Coconut", "Cotton", "Jute", "Coffee"
];

export default function FertilizerCalculator() {
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm();

    const onSubmit = async (data) => {
        setLoading(true);
        setError("");
        setResult(null);
        try {
            const response = await axios.post("/api/fertilizer/recommend", {
                crop: data.crop,
                nitrogen: Number(data.nitrogen),
                phosphorus: Number(data.phosphorus),
                potassium: Number(data.potassium)
            });

            if (response.data.success) {
                setResult(response.data);
            } else {
                setError("Could not generate a recommendation.");
            }
        } catch (err) {
            setError(err.response?.data?.error || err.message || "Calculation failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto py-8 px-4 max-w-5xl">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold tracking-tight mb-2">Fertilizer Calculator</h1>
                <p className="text-muted-foreground">Calculate exact nutrient requirements (Urea, DAP, MOP) for your crop.</p>
            </div>

            <div className="grid md:grid-cols-5 gap-8">
                <Card className="md:col-span-2 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-xl">Soil Nutrients</CardTitle>
                        <CardDescription>Enter your latest soil test results (N-P-K in kg/ha or mg/kg).</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Select Target Crop</label>
                                    <select
                                        {...register("crop", { required: "Required" })}
                                        className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                                    >
                                        <option value="">-- Choose Crop --</option>
                                        {CROPS.map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                    {errors.crop && <p className="text-xs text-destructive">Please select a crop</p>}
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Nitrogen (N)</label>
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                placeholder="e.g. 90"
                                                {...register("nitrogen", { required: "Required", min: 0 })}
                                                className={cn("pr-8", errors.nitrogen ? "border-destructive" : "")}
                                            />
                                            <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">kg</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Phosphorus (P)</label>
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                placeholder="e.g. 42"
                                                {...register("phosphorus", { required: "Required", min: 0 })}
                                                className={cn("pr-8", errors.phosphorus ? "border-destructive" : "")}
                                            />
                                            <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">kg</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Potassium (K)</label>
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                placeholder="e.g. 43"
                                                {...register("potassium", { required: "Required", min: 0 })}
                                                className={cn("pr-8", errors.potassium ? "border-destructive" : "")}
                                            />
                                            <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">kg</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4" /> {error}
                                </div>
                            )}

                            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" size="lg" disabled={loading}>
                                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Calculating...</> : "Calculate Requirements"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <div className="md:col-span-3">
                    <Card className={cn("h-full border-2 transition-all duration-500", result ? "bg-white dark:bg-gray-800/50 border-green-500/30" : "bg-muted/30 border-dashed border-muted")}>
                        <CardContent className="h-full p-6">
                            {!result ? (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-20">
                                    <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center text-muted-foreground">
                                        <FlaskConical className="h-10 w-10" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-medium">Ready to Calculate</h3>
                                        <p className="text-sm text-muted-foreground max-w-[200px]">Fill in the soil data to see your fertilizer plan.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                    <div className="flex items-center justify-between border-b pb-6">
                                        <div>
                                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 mb-2 inline-block">Analysis Complete</span>
                                            <h2 className="text-2xl font-bold">Fertilizer Plan for {result.crop}</h2>
                                        </div>
                                        <div className="h-14 w-14 bg-green-100 dark:bg-green-900/20 text-green-600 rounded-xl flex items-center justify-center">
                                            <FlaskConical className="h-7 w-7" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        {['N', 'P', 'K'].map((nut) => (
                                            <div key={nut} className="bg-muted/50 p-4 rounded-xl text-center">
                                                <p className="text-xs font-bold text-muted-foreground mb-1">{nut === 'N' ? 'Nitrogen' : nut === 'P' ? 'Phosphorus' : 'Potassium'}</p>
                                                <div className="flex items-baseline justify-center gap-1">
                                                    <span className="text-xl font-bold">{result.current[nut]}</span>
                                                    <span className="text-[10px] text-muted-foreground">vs {result.ideal[nut]}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-sm font-semibold text-green-700 dark:text-green-400">
                                            <Info className="h-4 w-4" />
                                            Application Recommended (per acre)
                                        </div>

                                        <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-xl p-5">
                                            {result.recommendation.includes("Apply") ? (
                                                <ul className="space-y-4">
                                                    {result.recommendation.split('. ').filter(s => s.trim()).map((step, idx) => (
                                                        <li key={idx} className="flex gap-3 text-green-800 dark:text-green-200 leading-relaxed">
                                                            <div className="h-6 w-6 rounded-full bg-green-200 dark:bg-green-800 flex-shrink-0 flex items-center justify-center text-xs font-bold text-green-700 dark:text-green-300">
                                                                {idx + 1}
                                                            </div>
                                                            {step.trim()}.
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="flex items-center gap-3 text-green-800 dark:text-green-200 font-medium leading-relaxed">
                                                    <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
                                                    {result.recommendation}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-dashed">
                                        <p className="text-[10px] text-muted-foreground leading-relaxed italic text-center">
                                            Note: Fertilizer recommendations are based on standard nutrient absorption rates. Local soil testing and agricultural expert consultation is advised for commercial farming.
                                        </p>
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
