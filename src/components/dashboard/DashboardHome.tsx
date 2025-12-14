import { Card, CardContent } from "@/components/ui/card";
import { Package, AlertTriangle, TrendingUp, Plus, Database, Percent, MessageSquare, Mail, Settings, Bell, FileSpreadsheet } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

interface DashboardStats {
    totalProducts: number;
    lowStock: number;
    outOfStock: number;
    todaySales: number;
    pendingRequests: number;
    unreadMessages: number;
}

interface DashboardHomeProps {
    onNavigate: (section: string) => void;
    stats: DashboardStats;
}

export const DashboardHome = ({ onNavigate, stats }: DashboardHomeProps) => {
    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Dashboard Overview</h1>
                <p className="text-muted-foreground">
                    Welcome back! Here's what's happening with your pharmacy today.
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                    title="Total Products"
                    value={stats.totalProducts}
                    icon={<Package className="w-8 h-8" />}
                    color="blue"
                    onClick={() => onNavigate('manage-products')}
                />

                <StatsCard
                    title="Low Stock Items"
                    value={stats.lowStock}
                    icon={<AlertTriangle className="w-8 h-8" />}
                    color="yellow"
                    alert={stats.lowStock > 0}
                    onClick={() => onNavigate('manage-products')}
                />

                <StatsCard
                    title="Out of Stock"
                    value={stats.outOfStock}
                    icon={<AlertTriangle className="w-8 h-8" />}
                    color="red"
                    alert={stats.outOfStock > 0}
                    onClick={() => onNavigate('manage-products')}
                />

                <StatsCard
                    title="Pending Requests"
                    value={stats.pendingRequests}
                    icon={<MessageSquare className="w-8 h-8" />}
                    color="purple"
                    alert={stats.pendingRequests > 0}
                    onClick={() => onNavigate('requests')}
                />
            </div>

            {/* Primary Actions - LARGE */}
            <div>
                <h2 className="text-xl font-semibold mb-4">Primary Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Card
                            className="h-56 cursor-pointer bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-2 border-blue-500/20 hover:border-blue-500/40 transition-all shadow-lg hover:shadow-xl"
                            onClick={() => onNavigate('manage-products')}
                        >
                            <CardContent className="flex flex-col items-center justify-center h-full p-8">
                                <div className="p-4 rounded-full bg-blue-500/10 mb-4">
                                    <Package className="w-16 h-16 text-blue-600" />
                                </div>
                                <h3 className="text-2xl font-bold mb-2">Inventory Management</h3>
                                <p className="text-muted-foreground text-center">
                                    Manage products, stock levels, and categories
                                </p>
                                {stats.lowStock > 0 && (
                                    <Badge variant="destructive" className="mt-4">
                                        {stats.lowStock} items need attention
                                    </Badge>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Card
                            className="h-56 cursor-pointer bg-gradient-to-br from-green-500/10 to-green-500/5 border-2 border-green-500/20 hover:border-green-500/40 transition-all shadow-lg hover:shadow-xl"
                            onClick={() => onNavigate('sales-reporting')}
                        >
                            <CardContent className="flex flex-col items-center justify-center h-full p-8">
                                <div className="p-4 rounded-full bg-green-500/10 mb-4">
                                    <TrendingUp className="w-16 h-16 text-green-600" />
                                </div>
                                <h3 className="text-2xl font-bold mb-2">Sales Reporting</h3>
                                <p className="text-muted-foreground text-center">
                                    View sales analytics, reports, and trends
                                </p>
                                <p className="text-green-600 font-semibold mt-4 text-lg">
                                    Today: ₹{stats.todaySales.toLocaleString()}
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </div>

            {/* Secondary Actions - Smaller */}
            <div>
                <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <ActionCard
                        icon={<Plus className="w-6 h-6" />}
                        label="Add Product"
                        onClick={() => onNavigate('add-product')}
                        color="blue"
                    />
                    <ActionCard
                        icon={<Database className="w-6 h-6" />}
                        label="Categories"
                        onClick={() => onNavigate('categories')}
                        color="purple"
                    />
                    <ActionCard
                        icon={<Percent className="w-6 h-6" />}
                        label="Offers"
                        onClick={() => onNavigate('offers')}
                        color="orange"
                    />
                    <ActionCard
                        icon={<MessageSquare className="w-6 h-6" />}
                        label="Requests"
                        onClick={() => onNavigate('requests')}
                        color="cyan"
                        badge={stats.pendingRequests}
                    />
                    <ActionCard
                        icon={<Mail className="w-6 h-6" />}
                        label="Messages"
                        onClick={() => onNavigate('contact-messages')}
                        color="teal"
                        badge={stats.unreadMessages}
                    />
                    <ActionCard
                        icon={<Percent className="w-6 h-6" />}
                        label="Discount"
                        onClick={() => onNavigate('discount')}
                        color="pink"
                    />
                    <ActionCard
                        icon={<Bell className="w-6 h-6" />}
                        label="Announcements"
                        onClick={() => onNavigate('announcements')}
                        color="indigo"
                    />
                    <ActionCard
                        icon={<Settings className="w-6 h-6" />}
                        label="Settings"
                        onClick={() => onNavigate('feature-flags')}
                        color="gray"
                    />
                </div>
            </div>
        </div>
    );
};

interface StatsCardProps {
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
    alert?: boolean;
    onClick?: () => void;
}

const StatsCard = ({ title, value, icon, color, alert, onClick }: StatsCardProps) => {
    const colorClasses = {
        blue: 'text-blue-600 bg-blue-500/10',
        yellow: 'text-yellow-600 bg-yellow-500/10',
        red: 'text-red-600 bg-red-500/10',
        green: 'text-green-600 bg-green-500/10',
        purple: 'text-purple-600 bg-purple-500/10',
    };

    return (
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Card
                className={`cursor-pointer hover:shadow-md transition-all ${alert ? 'border-2 border-yellow-500/50 animate-pulse' : ''}`}
                onClick={onClick}
            >
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">{title}</p>
                            <h3 className="text-3xl font-bold">{value}</h3>
                        </div>
                        <div className={colorClasses[color as keyof typeof colorClasses]}>
                            {icon}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

interface ActionCardProps {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    color: string;
    badge?: number;
}

const ActionCard = ({ icon, label, onClick, color, badge }: ActionCardProps) => {
    const colorClasses = {
        blue: 'text-blue-600',
        purple: 'text-purple-600',
        orange: 'text-orange-600',
        cyan: 'text-cyan-600',
        teal: 'text-teal-600',
        pink: 'text-pink-600',
        indigo: 'text-indigo-600',
        gray: 'text-gray-600',
    };

    return (
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Card className="cursor-pointer hover:shadow-md transition-all relative" onClick={onClick}>
                <CardContent className="flex flex-col items-center justify-center p-6">
                    <div className={colorClasses[color as keyof typeof colorClasses]}>
                        {icon}
                    </div>
                    <p className="text-sm font-medium text-center mt-2">{label}</p>
                    {badge !== undefined && badge > 0 && (
                        <Badge variant="destructive" className="absolute -top-2 -right-2">
                            {badge}
                        </Badge>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
};
