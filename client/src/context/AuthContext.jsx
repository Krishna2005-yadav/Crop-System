import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

    const checkAuth = async () => {
        try {
            const { data } = await axios.get("/api/auth/me");
            if (data.authenticated) {
                setUser(data.user);
            } else {
                setUser(null);
            }
        } catch (error) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    // Theme Logic
    useEffect(() => {
        if (theme === "dark") {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
        localStorage.setItem("theme", theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme((prev) => (prev === "light" ? "dark" : "light"));
    };

    const login = async (email, password) => {
        const { data } = await axios.post("/api/auth/login", { email, password });
        if (data.success) {
            setUser(data.user);
            return data;
        }
        throw new Error(data.error || "Login failed");
    };

    const signup = async (username, email, password) => {
        const { data } = await axios.post("/api/auth/signup", { username, email, password });
        if (data.success) {
            return data;
        }
        throw new Error(data.error || "Signup failed");
    };

    const logout = async () => {
        await axios.post("/api/auth/logout");
        setUser(null);
    };

    const updateProfile = async (profileData) => {
        const { data } = await axios.put("/api/auth/profile", profileData);
        if (data.success) {
            // Update local user state
            setUser(prev => prev ? { ...prev, ...profileData } : null);
            return data;
        }
        throw new Error(data.error || "Profile update failed");
    };

    const uploadProfilePicture = async (file) => {
        const formData = new FormData();
        formData.append('profile_picture', file);

        const { data } = await axios.post("/api/auth/update-profile-picture", formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        if (data.success) {
            // Update local user state with new picture
            setUser(prev => prev ? { ...prev, profile_picture: data.profile_picture } : null);
            return data;
        }
        throw new Error(data.error || "Image upload failed");
    };

    const changePassword = async (passwordData) => {
        const { data } = await axios.put("/api/auth/password", passwordData);
        if (data.success) {
            return data;
        }
        throw new Error(data.error || "Password change failed");
    };

    const deleteAccount = async () => {
        const { data } = await axios.delete("/api/auth/account");
        if (data.success) {
            setUser(null);
            return data;
        }
        throw new Error(data.error || "Account deletion failed");
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            theme,
            login,
            signup,
            logout,
            checkAuth,
            toggleTheme,
            updateProfile,
            uploadProfilePicture,
            changePassword,
            deleteAccount
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
