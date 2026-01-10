import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
    User,
    Lock,
    Moon,
    Sun,
    Trash2,
    Camera,
    Loader2,
    CheckCircle,
    AlertCircle,
    ShieldAlert
} from "lucide-react";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function Settings() {
    const {
        user,
        theme,
        toggleTheme,
        updateProfile,
        uploadProfilePicture,
        changePassword,
        deleteAccount,
        logout
    } = useAuth();

    // Profile State
    const [username, setUsername] = useState(user?.username || "");
    const [profilePic, setProfilePic] = useState(user?.profile_picture || "");
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileMsg, setProfileMsg] = useState({ type: "", text: "" });

    // Password State
    const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
    const [passLoading, setPassLoading] = useState(false);
    const [passMsg, setPassMsg] = useState({ type: "", text: "" });

    // Account State
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setProfileLoading(true);
        setProfileMsg({ type: "", text: "" });
        try {
            await updateProfile({ username, profile_picture: profilePic });
            setProfileMsg({ type: "success", text: "Profile updated successfully!" });
        } catch (err) {
            setProfileMsg({ type: "error", text: err.message });
        } finally {
            setProfileLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) {
            setPassMsg({ type: "error", text: "New passwords do not match" });
            return;
        }
        setPassLoading(true);
        setPassMsg({ type: "", text: "" });
        try {
            await changePassword({
                current_password: passwords.current,
                new_password: passwords.new
            });
            setPassMsg({ type: "success", text: "Password changed successfully!" });
            setPasswords({ current: "", new: "", confirm: "" });
        } catch (err) {
            setPassMsg({ type: "error", text: err.message });
        } finally {
            setPassLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        setDeleteLoading(true);
        try {
            await deleteAccount();
            window.location.href = "/";
        } catch (err) {
            alert(err.message);
            setDeleteLoading(false);
        }
    };

    return (
        <div className="container mx-auto py-10 px-4 max-w-4xl">
            <header className="mb-10">
                <h1 className="text-4xl font-extrabold tracking-tight mb-2">Settings</h1>
                <p className="text-muted-foreground text-lg">Manage your account preferences and security settings.</p>
            </header>

            <div className="grid gap-8">
                {/* Profile Section */}
                <Card className="border-none shadow-sm dark:bg-gray-800/50">
                    <CardHeader className="flex flex-row items-center gap-4">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <User className="h-6 w-6" />
                        </div>
                        <div>
                            <CardTitle>Profile Information</CardTitle>
                            <CardDescription>Update your public profile details.</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleUpdateProfile} className="space-y-6">
                            <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                                <div className="relative group">
                                    <div className="h-24 w-24 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden border-4 border-white dark:border-gray-800 shadow-md">
                                        {profilePic ? (
                                            <img src={profilePic} alt="Avatar" className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center text-gray-400">
                                                <User className="h-12 w-12" />
                                            </div>
                                        )}
                                    </div>
                                    <label className="absolute bottom-0 right-0 p-1.5 bg-primary text-white rounded-full cursor-pointer shadow-lg hover:scale-110 transition-transform">
                                        <Camera className="h-4 w-4" />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={async (e) => {
                                                const file = e.target.files[0];
                                                if (!file) return;

                                                setProfileLoading(true);
                                                setProfileMsg({ type: "", text: "" });
                                                try {
                                                    const res = await uploadProfilePicture(file);
                                                    setProfilePic(res.profile_picture);
                                                    setProfileMsg({ type: "success", text: "Profile picture updated!" });
                                                } catch (err) {
                                                    setProfileMsg({ type: "error", text: err.message });
                                                } finally {
                                                    setProfileLoading(false);
                                                }
                                            }}
                                        />
                                    </label>
                                </div>
                                <div className="flex-1 space-y-4 w-full">
                                    <div className="space-y-2">
                                        <div className="space-y-1">
                                            <h3 className="font-semibold text-lg">{user?.username}</h3>
                                            <p className="text-sm text-muted-foreground">{user?.email}</p>
                                        </div>
                                        <label className="text-sm font-medium">Username</label>
                                        <Input
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="dark:bg-gray-900/50"
                                        />
                                    </div>
                                </div>
                                {/* Removed Manual URL Input to avoid confusion */}
                            </div>

                            <AnimatePresence>
                                {profileMsg.text && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={cn(
                                            "flex items-center gap-2 text-sm p-3 rounded-md",
                                            profileMsg.type === "success" ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400" : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                                        )}
                                    >
                                        {profileMsg.type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                                        {profileMsg.text}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <Button disabled={profileLoading} type="submit" className="md:w-32">
                                {profileLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Password Section */}
                <Card className="border-none shadow-sm dark:bg-gray-800/50">
                    <CardHeader className="flex flex-row items-center gap-4">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
                            <Lock className="h-6 w-6" />
                        </div>
                        <div>
                            <CardTitle>Security</CardTitle>
                            <CardDescription>Change your password to keep your account secure.</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Current Password</label>
                                <Input
                                    type="password"
                                    value={passwords.current}
                                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                                    className="dark:bg-gray-900/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">New Password</label>
                                <Input
                                    type="password"
                                    value={passwords.new}
                                    onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                                    className="dark:bg-gray-900/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Confirm New Password</label>
                                <Input
                                    type="password"
                                    value={passwords.confirm}
                                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                    className="dark:bg-gray-900/50"
                                />
                            </div>

                            <AnimatePresence>
                                {passMsg.text && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={cn(
                                            "flex items-center gap-2 text-sm p-3 rounded-md",
                                            passMsg.type === "success" ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400" : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                                        )}
                                    >
                                        {passMsg.type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                                        {passMsg.text}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <Button disabled={passLoading} type="submit" className="md:w-40">
                                {passLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Password"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Preferences Section */}
                <Card className="border-none shadow-sm dark:bg-gray-800/50">
                    <CardHeader className="flex flex-row items-center gap-4">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                            {theme === 'dark' ? <Moon className="h-6 w-6" /> : <Sun className="h-6 w-6" />}
                        </div>
                        <div>
                            <CardTitle>Preferences</CardTitle>
                            <CardDescription>Customize your application experience.</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/40 rounded-xl border border-gray-100 dark:border-gray-800">
                            <div className="space-y-0.5">
                                <p className="font-semibold">Dark Mode</p>
                                <p className="text-sm text-muted-foreground">Switch between light and dark themes.</p>
                            </div>
                            <button
                                onClick={toggleTheme}
                                className={cn(
                                    "relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none",
                                    theme === 'dark' ? "bg-primary" : "bg-gray-300"
                                )}
                            >
                                <span className={cn(
                                    "inline-block h-5 w-5 transform rounded-full bg-white transition-transform",
                                    theme === 'dark' ? "translate-x-6" : "translate-x-1"
                                )} />
                            </button>
                        </div>
                    </CardContent>
                </Card>

                {/* Account Danger Zone */}
                <Card className="border-none shadow-sm bg-red-50/30 dark:bg-red-950/10 border-red-100 dark:border-red-900/30">
                    <CardHeader className="flex flex-row items-center gap-4">
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400">
                            <ShieldAlert className="h-6 w-6" />
                        </div>
                        <div>
                            <CardTitle className="text-red-800 dark:text-red-400">Danger Zone</CardTitle>
                            <CardDescription className="text-red-700/60 dark:text-red-400/60">Manage high-impact account actions.</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border border-red-200 dark:border-red-900/50 rounded-xl bg-white dark:bg-gray-800/80 shadow-sm">
                            <div className="space-y-1">
                                <p className="font-bold text-red-800 dark:text-red-400">Delete Account</p>
                                <p className="text-sm text-red-700/70 dark:text-red-400/60">Permanently remove your account and all data. This cannot be undone.</p>
                            </div>
                            <Button
                                variant="destructive"
                                onClick={() => setShowDeleteConfirm(true)}
                                className="md:w-32"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 text-center"
                        >
                            <div className="h-16 w-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <ShieldAlert className="h-8 w-8" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Are you absolutely sure?</h2>
                            <p className="text-muted-foreground mb-8">
                                This will permanently delete your profile, history, and all agricultural data. This action is **irreversible**.
                            </p>
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setShowDeleteConfirm(false)}
                                    disabled={deleteLoading}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="destructive"
                                    className="flex-1"
                                    onClick={handleDeleteAccount}
                                    disabled={deleteLoading}
                                >
                                    {deleteLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Yes, Delete Everything"}
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div >
    );
}
