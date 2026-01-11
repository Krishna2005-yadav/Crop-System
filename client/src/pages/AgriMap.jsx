import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Globe, ArrowRight, Zap, Droplets, Leaf, Cpu, Satellite } from "lucide-react";
import { cn } from "../lib/utils";

const INNOVATIONS = [
    {
        id: "israel",
        country: "Israel",
        technique: "Precision Drip Irrigation",
        coords: { x: "65.5%", y: "42%" },
        icon: <Droplets className="h-5 w-5" />,
        description: "Israel leads the world in desert agriculture. Their 'Netafim' system delivers water and nutrients directly to the root zone, saving up to 90% water compared to flood irrigation.",
        keyFacts: ["90% Water Efficiency", "Higher Yields", "Soil Health Preservation"],
        color: "bg-blue-500"
    },
    {
        id: "netherlands",
        country: "Netherlands",
        technique: "Autonomous Smart Greenhouses",
        coords: { x: "51.5%", y: "28%" },
        icon: <Cpu className="h-5 w-5" />,
        description: "The Netherlands is the world's 2nd largest food exporter. They use climate-controlled greenhouses with AI to manage light, CO2, and temperature, achieving 15x higher yields than open fields.",
        keyFacts: ["15x Yield Increase", "Zero Pesticides", "Circular Water Usage"],
        color: "bg-orange-500"
    },
    {
        id: "japan",
        country: "Japan",
        technique: "Robotic Vertical Farming",
        coords: { x: "83%", y: "37%" },
        icon: <Zap className="h-5 w-5" />,
        description: "With limited space, Japan pioneered indoor vertical farms like 'Spread'. Robots handle everything from seeding to harvest in a sterile environment, producing clean lettuce 365 days a year.",
        keyFacts: ["Space Optimized", "Year-round Harvest", "Automated Labor"],
        color: "bg-red-500"
    },
    {
        id: "india",
        country: "India",
        technique: "Regenerative Multi-Cropping",
        coords: { x: "71%", y: "50%" },
        icon: <Leaf className="h-5 w-5" />,
        description: "Ancient Indian wisdom meets modern science. Farmers are returning to natural farming (ZBNF), using inter-cropping and natural fertilizers to restore soil carbon while maintaining profits.",
        keyFacts: ["Low Input Cost", "Soil Carbon Capture", "Biodiversity Focus"],
        color: "bg-green-500"
    },
    {
        id: "usa",
        country: "USA",
        technique: "Satellite-Guided Precision Ag",
        coords: { x: "25%", y: "35%" },
        icon: <Satellite className="h-5 w-5" />,
        description: "American 'Mega-farms' use GPS-guided tractors and satellite imagery to apply the exact amount of seed and fertilizer needed for every square foot of land, minimizing waste.",
        keyFacts: ["Precision GPS", "Reduced Chemical Runoff", "Massive Scale Efficiency"],
        color: "bg-indigo-500"
    }
];

export default function AgriMap() {
    const [selected, setSelected] = useState(INNOVATIONS[0]);

    return (
        <div className="container mx-auto py-8 px-4 max-w-7xl">
            <div className="mb-10 text-center space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold uppercase tracking-widest">
                    <Globe className="h-3 w-3" />
                    Global Discovery
                </div>
                <h1 className="text-4xl font-black tracking-tight text-gray-900 dark:text-white">Agri-Innovation Explorer</h1>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                    Travel around the world to discover how different nations use technology to feed the planet.
                </p>
            </div>

            <div className="grid lg:grid-cols-12 gap-10 items-start">
                {/* Interactive Map Section */}
                <div className="lg:col-span-8 relative">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl border shadow-2xl p-4 overflow-hidden group">
                        {/* World Map SVG Placeholder Background */}
                        <div className="relative aspect-[2/1] bg-slate-100 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 overflow-hidden">
                            {/* Simplistic World Outline - In a real app, use a proper TopoJSON map */}
                            <img
                                src="https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg"
                                alt="World Map"
                                className="absolute inset-0 w-full h-full object-contain opacity-20 dark:opacity-10 pointer-events-none grayscale"
                            />

                            {/* Hotspots */}
                            {INNOVATIONS.map((point) => (
                                <button
                                    key={point.id}
                                    onClick={() => setSelected(point)}
                                    className={cn(
                                        "absolute w-6 h-6 -ml-3 -mt-3 rounded-full border-2 border-white dark:border-gray-900 transition-all duration-300 z-10",
                                        selected.id === point.id ? "scale-125 shadow-[0_0_20px_rgba(34,197,94,0.5)] z-20" : "scale-75 opacity-70 hover:opacity-100 hover:scale-100"
                                    )}
                                    style={{ left: point.coords.x, top: point.coords.y }}
                                >
                                    <span className={cn("absolute inset-0 rounded-full animate-ping opacity-20", point.color)}></span>
                                    <span className={cn("absolute inset-0 rounded-full shadow-inner", point.color)}></span>
                                </button>
                            ))}
                        </div>

                        {/* Map Labels */}
                        <div className="absolute top-8 left-8 p-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur rounded-xl border text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">
                            Interactive Hotspots Enabled
                        </div>
                    </div>

                    {/* Country Navigation Pills */}
                    <div className="flex flex-wrap gap-2 mt-6 justify-center">
                        {INNOVATIONS.map((point) => (
                            <button
                                key={point.id}
                                onClick={() => setSelected(point)}
                                className={cn(
                                    "px-4 py-2 rounded-full text-xs font-bold transition-all border",
                                    selected.id === point.id
                                        ? "bg-green-600 text-white border-green-600 shadow-lg shadow-green-500/20"
                                        : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-green-400"
                                )}
                            >
                                {point.country}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Detail Panel */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="border-0 shadow-2xl bg-white dark:bg-gray-800 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className={cn("h-2 w-full", selected.color)}></div>
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className={cn("p-2 rounded-lg text-white shadow-lg", selected.color)}>
                                    {selected.icon}
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{selected.country}</p>
                                    <CardTitle className="text-xl font-bold">{selected.technique}</CardTitle>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                {selected.description}
                            </p>

                            <div className="space-y-3">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Innovation Impact</h4>
                                <div className="grid gap-2">
                                    {selected.keyFacts.map((fact, idx) => (
                                        <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700/50">
                                            <div className={cn("h-1.5 w-1.5 rounded-full", selected.color)}></div>
                                            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{fact}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Button className="w-full h-12 rounded-xl bg-gray-900 hover:bg-black dark:bg-green-600 dark:hover:bg-green-700 text-white font-bold group">
                                Deep Dive Into Tech
                                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Fun Fact / Recommendation Tip */}
                    <div className="p-6 rounded-3xl bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 text-center">
                        <p className="text-xs font-bold text-green-800 dark:text-green-400 opacity-60 mb-1 italic">Agri-Tip</p>
                        <p className="text-sm font-medium text-green-900 dark:text-green-200">
                            "Innovation is the bridge between scarcity and abundance."
                        </p>
                    </div>
                </div>
            </div>

            {/* Global Stats Section */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20">
                {[
                    { label: "Tech Hotspots", val: "50+", color: "text-blue-600" },
                    { label: "Water Saved/Year", val: "40B Liters", color: "text-green-600" },
                    { label: "Global AI Adoption", val: "68%", color: "text-purple-600" },
                    { label: "Future Potential", val: "Unlimited", color: "text-orange-600" },
                ].map((stat, i) => (
                    <div key={i} className="p-6 rounded-3xl bg-white dark:bg-gray-800 border text-center space-y-1">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{stat.label}</p>
                        <p className={cn("text-2xl font-black", stat.color)}>{stat.val}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
