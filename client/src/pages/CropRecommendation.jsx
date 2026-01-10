import { useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Sprout, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "../lib/utils";

export default function CropRecommendation() {
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm();

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
        <div className="container mx-auto py-8 px-4 max-w-4xl">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold tracking-tight mb-2">Crop Recommendation</h1>
                <p className="text-muted-foreground">Enter soil and climate details to find the most suitable crop.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Soil & Env Data</CardTitle>
                        <CardDescription>All fields are required for accurate prediction.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Nitrogen (N)</label>
                                    <Input
                                        type="number"
                                        placeholder="e.g. 90"
                                        {...register("nitrogen", { required: "Required", min: 0, max: 300 })}
                                        className={errors.nitrogen ? "border-destructive" : ""}
                                    />
                                    {errors.nitrogen && <p className="text-xs text-destructive">Invalid N value</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Phosphorus (P)</label>
                                    <Input
                                        type="number"
                                        placeholder="e.g. 42"
                                        {...register("phosphorus", { required: "Required", min: 0, max: 150 })}
                                        className={errors.phosphorus ? "border-destructive" : ""}
                                    />
                                    {errors.phosphorus && <p className="text-xs text-destructive">Invalid P value</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Potassium (K)</label>
                                    <Input
                                        type="number"
                                        placeholder="e.g. 43"
                                        {...register("potassium", { required: "Required", min: 0, max: 300 })}
                                        className={errors.potassium ? "border-destructive" : ""}
                                    />
                                    {errors.potassium && <p className="text-xs text-destructive">Invalid K value</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Temperature (°C)</label>
                                    <Input
                                        type="number"
                                        placeholder="e.g. 20.8"
                                        step="0.1"
                                        {...register("temperature", { required: "Required", min: -10, max: 60 })}
                                        className={errors.temperature ? "border-destructive" : ""}
                                    />
                                    {errors.temperature && <p className="text-xs text-destructive">Invalid Temp</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">pH Level</label>
                                    <Input
                                        type="number"
                                        placeholder="e.g. 6.5"
                                        step="0.1"
                                        {...register("ph", { required: "Required", min: 0, max: 14 })}
                                        className={errors.ph ? "border-destructive" : ""}
                                    />
                                    {errors.ph && <p className="text-xs text-destructive">Invalid pH</p>}
                                </div>
                            </div>

                            {error && (
                                <div className="text-sm text-destructive flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4" /> {error}
                                </div>
                            )}

                            <Button type="submit" className="w-full" size="lg" disabled={loading}>
                                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Calculating...</> : "Get Recommendation"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <div className="md:col-span-1">
                    <Card className={cn("h-full transition-all duration-500", result ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/30" : "bg-muted/50 border-dashed")}>
                        <CardContent className="h-full flex flex-col items-center justify-center text-center p-6">
                            {result ? (
                                <div className="space-y-4 animate-in fade-in zoom-in duration-500">
                                    <div className="h-24 w-24 bg-white rounded-full flex items-center justify-center shadow-lg mx-auto text-green-600 border-4 border-green-100">
                                        <Sprout className="h-12 w-12" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold uppercase tracking-wider text-green-800 mb-1">Recommended Crop</h3>
                                        <p className="text-4xl font-extrabold text-green-700">{result}</p>
                                    </div>
                                    <p className="text-sm text-green-800/80">
                                        Based on your soil parameters, <strong>{result}</strong> is the optimal crop for cultivation.
                                    </p>
                                </div>
                            ) : (
                                <div className="text-muted-foreground opacity-50 space-y-2">
                                    <Sprout className="h-16 w-16 mx-auto" />
                                    <p>Enter parameters to see result</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
