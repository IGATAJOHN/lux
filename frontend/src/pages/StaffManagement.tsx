import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { staffApi } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Users,
    Loader2,
    Plus,
    Mail,
    Phone,
    UserCircle,
    Briefcase
} from 'lucide-react';

interface Staff {
    id: number;
    name: string;
    email: string;
    phone?: string;
    role: string;
    department?: string;
    status?: string;
}

const demoStaff: Staff[] = [
    { id: 1, name: 'John Smith', email: 'john.smith@luxestay.com', phone: '+1234567890', role: 'staff', department: 'Housekeeping', status: 'active' },
    { id: 2, name: 'Sarah Johnson', email: 'sarah.j@luxestay.com', phone: '+1234567891', role: 'staff', department: 'Front Desk', status: 'active' },
    { id: 3, name: 'Mike Davis', email: 'mike.d@luxestay.com', phone: '+1234567892', role: 'staff', department: 'Maintenance', status: 'active' },
    { id: 4, name: 'Emma Wilson', email: 'emma.w@luxestay.com', phone: '+1234567893', role: 'staff', department: 'Concierge', status: 'active' },
];

const StaffManagement: React.FC = () => {
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();

    const [staff, setStaff] = useState<Staff[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newStaff, setNewStaff] = useState({
        name: '',
        email: '',
        phone: '',
        department: '',
    });

    useEffect(() => {
        if (!authLoading && (!isAuthenticated || user?.role !== 'admin')) {
            navigate('/login');
            return;
        }

        const fetchStaff = async () => {
            try {
                const response = await staffApi.list();
                setStaff(response.data);
            } catch (error) {
                // Use demo data
                setStaff(demoStaff);
            } finally {
                setIsLoading(false);
            }
        };

        if (isAuthenticated) {
            fetchStaff();
        }
    }, [isAuthenticated, authLoading, navigate, user]);

    const handleAddStaff = async () => {
        if (!newStaff.name || !newStaff.email || !newStaff.department) {
            toast({
                title: 'Missing Information',
                description: 'Please fill in all required fields.',
                variant: 'destructive',
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await staffApi.create({
                name: newStaff.name,
                email: newStaff.email,
                phone: newStaff.phone,
                department: newStaff.department,
            });

            setStaff([...staff, response.data]);

            toast({
                title: 'Staff Added',
                description: 'New staff member has been added successfully.',
            });

            setIsDialogOpen(false);
            setNewStaff({ name: '', email: '', phone: '', department: '' });
        } catch (error) {
            toast({
                title: 'Failed to Add Staff',
                description: 'Unable to add staff member. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (authLoading || isLoading) {
        return (
            <Layout hideFooter>
                <div className="min-h-[80vh] flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </Layout>
        );
    }

    return (
        <Layout hideFooter>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="font-display text-3xl font-bold text-foreground">
                            Staff <span className="gradient-text">Management</span>
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Manage your hotel staff members
                        </p>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="gold">
                                <Plus className="h-4 w-4" />
                                Add Staff
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-card border-border">
                            <DialogHeader>
                                <DialogTitle className="font-display">Add New Staff Member</DialogTitle>
                                <DialogDescription>
                                    Enter the details of the new staff member.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 mt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name *</Label>
                                    <Input
                                        id="name"
                                        placeholder="John Smith"
                                        value={newStaff.name}
                                        onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                                        className="bg-input border-border"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email *</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="john@luxestay.com"
                                        value={newStaff.email}
                                        onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                                        className="bg-input border-border"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        placeholder="+1 (555) 123-4567"
                                        value={newStaff.phone}
                                        onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                                        className="bg-input border-border"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="department">Department *</Label>
                                    <Select
                                        value={newStaff.department}
                                        onValueChange={(value) => setNewStaff({ ...newStaff, department: value })}
                                    >
                                        <SelectTrigger className="bg-input border-border">
                                            <SelectValue placeholder="Select department" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-card border-border">
                                            <SelectItem value="Front Desk">Front Desk</SelectItem>
                                            <SelectItem value="Housekeeping">Housekeeping</SelectItem>
                                            <SelectItem value="Maintenance">Maintenance</SelectItem>
                                            <SelectItem value="Concierge">Concierge</SelectItem>
                                            <SelectItem value="Kitchen">Kitchen</SelectItem>
                                            <SelectItem value="Security">Security</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button
                                    variant="gold"
                                    className="w-full"
                                    onClick={handleAddStaff}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Adding...
                                        </>
                                    ) : (
                                        'Add Staff Member'
                                    )}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                    <div className="stat-card">
                        <div className="flex items-center justify-between mb-4">
                            <Users className="h-6 w-6 text-primary" />
                            <span className="text-xs text-muted-foreground uppercase tracking-wide">Total</span>
                        </div>
                        <div className="text-3xl font-display font-bold text-foreground">
                            {staff.length}
                        </div>
                        <p className="text-sm text-muted-foreground">Staff Members</p>
                    </div>

                    <div className="stat-card">
                        <div className="flex items-center justify-between mb-4">
                            <Briefcase className="h-6 w-6 text-success" />
                            <span className="text-xs text-muted-foreground uppercase tracking-wide">Active</span>
                        </div>
                        <div className="text-3xl font-display font-bold text-success">
                            {staff.filter(s => s.status === 'active').length}
                        </div>
                        <p className="text-sm text-muted-foreground">Active Staff</p>
                    </div>

                    <div className="stat-card">
                        <div className="flex items-center justify-between mb-4">
                            <Briefcase className="h-6 w-6 text-primary" />
                            <span className="text-xs text-muted-foreground uppercase tracking-wide">Departments</span>
                        </div>
                        <div className="text-3xl font-display font-bold text-foreground">
                            {new Set(staff.map(s => s.department)).size}
                        </div>
                        <p className="text-sm text-muted-foreground">Departments</p>
                    </div>
                </div>

                {/* Staff List */}
                <div className="glass-card p-6">
                    <h2 className="font-display text-xl font-semibold text-foreground mb-6">
                        All Staff Members
                    </h2>

                    <div className="grid gap-4">
                        {staff.map((member, index) => (
                            <div
                                key={member.id}
                                className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50 animate-slide-up"
                                style={{ animationDelay: `${index * 0.05}s` }}
                            >
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                    <UserCircle className="h-7 w-7 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <div className="font-medium text-foreground">{member.name}</div>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                        <span className="flex items-center gap-1">
                                            <Mail className="h-3 w-3" />
                                            {member.email}
                                        </span>
                                        {member.phone && (
                                            <span className="flex items-center gap-1">
                                                <Phone className="h-3 w-3" />
                                                {member.phone}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                                        {member.department}
                                    </Badge>
                                    {member.status && (
                                        <Badge
                                            variant="outline"
                                            className={
                                                member.status === 'active'
                                                    ? 'bg-success/20 text-success border-success/30'
                                                    : 'bg-muted text-muted-foreground border-muted'
                                            }
                                        >
                                            {member.status}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default StaffManagement;
