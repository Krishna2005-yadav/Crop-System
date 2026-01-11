import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Menu, X, Leaf, User, LogOut, Settings as SettingsIcon, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { cn } from "../lib/utils";

export default function Navbar() {
    const { user, logout, theme, toggleTheme } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);

    // DEBUG: Check user object
    console.log("Current User in Navbar:", user);


    const handleLogout = async () => {
        await logout();
        navigate("/", { replace: true });
    };

    const navLinks = [
        { name: "Home", path: "/" },
        ...(user
            ? [
                { name: "Dashboard", path: "/dashboard" },
                { name: "Disease Detection", path: "/detect-disease" },
                { name: "Crop Recommendation", path: "/recommend-crop" },
                { name: "Fertilizer", path: "/fertilizer" },
                { name: "Agri Map", path: "/agri-map" },
                { name: "Farm Planner", path: "/farm-planner" },
                { name: "History", path: "/history" },
                ...(user.is_admin ? [{ name: "Admin", path: "/admin" }] : []),
            ]
            : []),
    ];

    return (
        <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b dark:border-gray-800 sticky top-0 z-50 transition-colors duration-300">
            <div className="max-w-[1400px] mx-auto px-4">
                <div className="flex justify-between h-14">
                    {/* Left side: Logo and nav links together */}
                    <div className="flex items-center gap-1">
                        <Link to="/" className="flex-shrink-0 flex items-center gap-1.5 mr-4">
                            <Leaf className="h-6 w-6 text-primary" />
                            <span className="font-bold text-base tracking-tight text-primary dark:text-green-400 hidden sm:inline">SmartFarming</span>
                        </Link>
                        <div className="hidden md:flex items-center">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    to={link.path}
                                    className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-green-400 px-2 lg:px-3 py-1.5 rounded-md text-xs lg:text-sm font-medium transition-colors whitespace-nowrap"
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                    <div className="hidden md:flex items-center space-x-4">
                        {user ? (
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={toggleTheme}
                                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
                                    title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
                                >
                                    {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                                </button>
                                <Link
                                    to="/settings"
                                    className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary transition-colors"
                                >
                                    <div className="h-8 w-8 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center overflow-hidden border dark:border-gray-700">
                                        {user.profile_picture ? (
                                            <img src={user.profile_picture} alt={user.username} className="h-8 w-8 rounded-full object-cover" />
                                        ) : (
                                            <User className="h-4 w-4 text-primary" />
                                        )}
                                    </div>
                                    <span className="hidden lg:block">{user.username}</span>
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="text-gray-500 dark:text-gray-400 hover:text-destructive p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                    title="Logout"
                                >
                                    <LogOut className="h-5 w-5" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={toggleTheme}
                                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors mr-2"
                                >
                                    {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                                </button>
                                <Link to="/login" className="text-gray-500 dark:text-gray-400 hover:text-primary font-medium">
                                    Login
                                </Link>
                                <Link
                                    to="/signup"
                                    className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-sm hover:shadow-md"
                                >
                                    Sign Up
                                </Link>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center md:hidden">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
                        >
                            {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            <div className={cn("md:hidden", isOpen ? "block" : "hidden")}>
                <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-b">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            to={link.path}
                            className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-green-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                            onClick={() => setIsOpen(false)}
                        >
                            {link.name}
                        </Link>
                    ))}
                    {!user && (
                        <div className="mt-4 space-y-2 border-t pt-4">
                            <Link
                                to="/login"
                                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50"
                                onClick={() => setIsOpen(false)}
                            >
                                Login
                            </Link>
                            <Link
                                to="/signup"
                                className="block px-3 py-2 rounded-md text-base font-medium text-primary hover:bg-primary/5"
                                onClick={() => setIsOpen(false)}
                            >
                                Sign Up
                            </Link>
                        </div>
                    )}
                    {user && (
                        <div className="mt-4 border-t dark:border-gray-800 pt-4">
                            <Link
                                to="/settings"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center px-3 mb-3 "
                            >
                                <div className="flex-shrink-0">
                                    {user.profile_picture ? (
                                        <img src={user.profile_picture} alt={user.username} className="h-10 w-10 rounded-full object-cover" />
                                    ) : (
                                        <div className="h-10 w-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                                            <User className="h-6 w-6 text-primary" />
                                        </div>
                                    )}
                                </div>
                                <div className="ml-3">
                                    <div className="text-base font-medium leading-none text-gray-800 dark:text-gray-100">{user.username}</div>
                                    <div className="text-sm font-medium leading-none text-gray-500 dark:text-gray-400 mt-1">{user.email}</div>
                                </div>
                                <SettingsIcon className="h-5 w-5 ml-auto text-gray-400" />
                            </Link>
                            <div className="flex items-center justify-between px-3 py-2 text-gray-700 dark:text-gray-300">
                                <span className="text-sm font-medium">Dark Mode</span>
                                <button
                                    onClick={toggleTheme}
                                    className="p-2 rounded-full bg-gray-100 dark:bg-gray-800"
                                >
                                    {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                                </button>
                            </div>
                            <button
                                onClick={() => { handleLogout(); }}
                                className="w-full text-left block px-3 py-2 mt-2 rounded-md text-base font-medium text-destructive hover:bg-destructive/5"
                            >
                                <LogOut className="h-5 w-5 inline mr-2" />
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
