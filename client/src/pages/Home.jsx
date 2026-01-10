import { Link } from "react-router-dom";
import { ArrowRight, Microscope, Sprout, BarChart3, Leaf } from "lucide-react";
import { Button } from "../components/ui/button";
import { useAuth } from "../context/AuthContext";

export default function Home() {
    const { user } = useAuth();
    return (
        <div className="flex flex-col min-h-screen">
            {/* Hero Section */}
            <section className="relative py-20 lg:py-32 overflow-hidden bg-gradient-to-b from-green-50 to-white dark:from-gray-900 dark:to-gray-950 transition-colors duration-300">
                <div className="container px-4 md:px-6 mx-auto relative z-10">
                    <div className="flex flex-col items-center text-center space-y-8 max-w-3xl mx-auto">
                        <div className="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-3 py-1 text-sm font-medium text-green-800 shadow-sm dark:bg-green-900/30 dark:text-green-300 dark:border-green-800">
                            <span className="flex h-2 w-2 rounded-full bg-green-600 mr-2 animate-pulse"></span>
                            Vyron-Powered Agriculture
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl text-gray-900 dark:text-white leading-tight">
                            Grow Smarter with <span className="text-primary">Intelligent Farming</span>
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-[800px]">
                            Detect crop diseases instantly with AI and get personalized crop recommendations based on your soil conditions.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                            {user ? (
                                <Link to="/dashboard">
                                    <Button size="lg" className="w-full sm:w-auto gap-2 text-lg px-8">
                                        Go to Dashboard <ArrowRight className="h-5 w-5" />
                                    </Button>
                                </Link>
                            ) : (
                                <Link to="/signup">
                                    <Button size="lg" className="w-full sm:w-auto gap-2 text-lg px-8">
                                        Get Started <ArrowRight className="h-5 w-5" />
                                    </Button>
                                </Link>
                            )}
                            <Link to="#features">
                                <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8">
                                    Learn More
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Background Pattern */}
                <div className="absolute inset-0 -z-10 h-full w-full bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-20 bg-white dark:bg-gray-950 transition-colors duration-300">
                <div className="container px-4 md:px-6 mx-auto">
                    <div className="grid gap-8 md:grid-cols-3">
                        {/* Feature 1 */}
                        <div className="flex flex-col items-center text-center p-6 bg-muted/50 dark:bg-gray-800/50 rounded-2xl border dark:border-gray-800 hover:shadow-lg transition-shadow duration-300">
                            <div className="h-14 w-14 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-6 text-blue-600 dark:text-blue-400">
                                <Microscope className="h-7 w-7" />
                            </div>
                            <h3 className="text-xl font-bold mb-3 dark:text-white">Disease Detection</h3>
                            <p className="text-muted-foreground">
                                Upload photos of your crops to instantly identify diseases like Common Rust, Blight, and more with 98% accuracy.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="flex flex-col items-center text-center p-6 bg-muted/50 dark:bg-gray-800/50 rounded-2xl border dark:border-gray-800 hover:shadow-lg transition-shadow duration-300">
                            <div className="h-14 w-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6 text-green-600 dark:text-green-400">
                                <Sprout className="h-7 w-7" />
                            </div>
                            <h3 className="text-xl font-bold mb-3 dark:text-white">Crop Recommendation</h3>
                            <p className="text-muted-foreground">
                                Get data-driven suggestions for the best crops to plant based on your soil's NPK values, pH, and climate.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="flex flex-col items-center text-center p-6 bg-muted/50 dark:bg-gray-800/50 rounded-2xl border dark:border-gray-800 hover:shadow-lg transition-shadow duration-300">
                            <div className="h-14 w-14 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-6 text-purple-600 dark:text-purple-400">
                                <BarChart3 className="h-7 w-7" />
                            </div>
                            <h3 className="text-xl font-bold mb-3 dark:text-white">Smart Dashboard</h3>
                            <p className="text-muted-foreground">
                                Track your analysis history, monitor crop health trends, and manage your farming insights in one place.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Disease Cards Preview */}
            <section className="py-20 bg-muted/30 dark:bg-gray-900 transition-colors duration-300">
                <div className="container px-4 md:px-6 mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold tracking-tight mb-4 dark:text-white">Identify Common Threats</h2>
                        <p className="text-lg text-muted-foreground">Our AI generates instant reports for various crop diseases</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { name: 'Corn Common Rust', img: '/images/diseases/corn_common_rust.png' },
                            { name: 'Potato Early Blight', img: '/images/diseases/potato_early_blight.png' },
                            { name: 'Tomato Leaf Spot', img: '/images/diseases/tomato_leaf_spot.png' },
                            { name: 'Potato Late Blight', img: '/images/diseases/potato_late_blight.png' }
                        ].map((item, i) => (
                            <div key={i} className="group relative overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all">
                                <div className="aspect-square bg-gray-200 dark:bg-gray-700 relative overflow-hidden">
                                    <img
                                        src={item.img}
                                        alt={item.name}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-medium p-4 text-center backdrop-blur-sm">
                                        View Details
                                    </div>
                                </div>
                                <div className="p-4">
                                    <h4 className="font-semibold text-sm dark:text-white">{item.name}</h4>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 bg-white dark:bg-gray-950 border-t dark:border-gray-800 transition-colors duration-300 mt-auto">
                <div className="container px-4 md:px-6 mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-gray-500">© 2026 SmartFarming AI. All rights reserved.</p>
                    <div className="flex gap-6 text-sm text-gray-500">
                        <Link to="#" className="hover:text-primary">Privacy Policy</Link>
                        <Link to="#" className="hover:text-primary">Terms of Service</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
