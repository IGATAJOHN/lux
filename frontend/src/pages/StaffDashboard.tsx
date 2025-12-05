import React, { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle, Clock, Bell, User, Briefcase } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ServiceRequest {
    id: number;
    type: string;
    description: string;
    status: string;
    created_at: string;
}

interface Notification {
    id: number;
    message: string;
    is_read: boolean;
    created_at: string;
}

interface StaffDashboardData {
    staff_id: number;
    name: string;
    department: string;
    active_tasks: ServiceRequest[];
    notifications: Notification[];
}

const StaffDashboard: React.FC = () => {
    const { user } = useAuth();
    const [data, setData] = useState<StaffDashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem('token');

    const fetchDashboard = async () => {
        try {
            const response = await fetch('http://localhost:8000/staff/me/dashboard', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const result = await response.json();
                setData(result);
            } else {
                toast.error("Failed to load dashboard data");
            }
        } catch (error) {
            console.error("Dashboard error:", error);
            toast.error("Error connecting to server");
        } finally {
            setLoading(false);
        }
    };

    const markNotificationRead = async (id: number) => {
        try {
            await fetch(`http://localhost:8000/notify/read/${id}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            // Refresh
            fetchDashboard();
        } catch (e) {
            console.error(e);
        }
    };

    const completeTask = async (taskId: number) => {
        // Mock completion logic for now or call backend if endpoint exists
        toast.success("Task marked as completed");
        // In real web app, call PUT /requests/{id}/status
    };

    useEffect(() => {
        if (token) fetchDashboard();
    }, [token]);

    if (loading) return <div className="p-10 text-center text-primary">Loading Staff Dashboard...</div>;
    if (!data) return <div className="p-10 text-center text-red-500">Access Restricted</div>;

    return (
        <Layout>
            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-display font-bold text-foreground">
                            Staff <span className="gradient-text">Dashboard</span>
                        </h1>
                        <p className="text-muted-foreground mt-1 flex items-center gap-2">
                            <User className="h-4 w-4" /> {data.name}
                            <span className="mx-2">•</span>
                            <Briefcase className="h-4 w-4" /> {data.department?.toUpperCase() || 'Staff'}
                        </p>
                    </div>
                    <Button variant="outline" onClick={fetchDashboard}>
                        Refresh Data
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Tasks */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Clock className="h-5 w-5 text-primary" />
                            <h2 className="text-xl font-semibold text-foreground">Assigned Tasks ({data.active_tasks.length})</h2>
                        </div>

                        {data.active_tasks.length === 0 ? (
                            <Card className="glass-card p-6 text-center text-muted-foreground">
                                No active tasks assigned. You are currently free!
                            </Card>
                        ) : (
                            data.active_tasks.map(task => (
                                <Card key={task.id} className="glass-card border-l-4 border-l-primary hover:bg-card/50 transition-colors">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="flex justify-between items-start">
                                            <span className="text-lg font-semibold text-primary capitalize">{task.type.replace('_', ' ')}</span>
                                            <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full uppercase tracking-wider">
                                                {task.status}
                                            </span>
                                        </CardTitle>
                                        <CardDescription className="text-sm">
                                            Created at: {new Date(task.created_at).toLocaleString()}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-foreground mb-4">{task.description}</p>
                                        <Button
                                            variant="gold"
                                            className="w-full sm:w-auto"
                                            onClick={() => completeTask(task.id)}
                                        >
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Mark as Complete
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>

                    {/* Right Column: Notifications */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Bell className="h-5 w-5 text-primary" />
                            <h2 className="text-xl font-semibold text-foreground">Notifications</h2>
                        </div>

                        <div className="space-y-4">
                            {data.notifications.length === 0 ? (
                                <p className="text-muted-foreground text-sm italic">No new notifications.</p>
                            ) : (
                                data.notifications.map(notif => (
                                    <Card key={notif.id} className="bg-card border-border p-4 relative overflow-hidden">
                                        {/* Unread indicator */}
                                        {!notif.is_read && (
                                            <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full m-2"></div>
                                        )}
                                        <p className="text-sm text-foreground mb-2">{notif.message}</p>
                                        <div className="flex justify-between items-center mt-2">
                                            <span className="text-xs text-muted-foreground">{new Date(notif.created_at).toLocaleTimeString()}</span>
                                            {!notif.is_read && (
                                                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => markNotificationRead(notif.id)}>
                                                    Mark Read
                                                </Button>
                                            )}
                                        </div>
                                    </Card>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default StaffDashboard;
