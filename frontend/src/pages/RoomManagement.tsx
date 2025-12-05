import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { roomApi } from '@/services/api';
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
    Bed,
    Loader2,
    Plus,
    Edit,
    DollarSign,
    Home
} from 'lucide-react';

interface Room {
    id: number;
    room_number: string;
    room_type: string;
    status: string;
    price_per_night: number;
    description?: string;
    amenities?: string[];
    image_url?: string;
}



const RoomManagement: React.FC = () => {
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();

    const [rooms, setRooms] = useState<Room[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
    const [newRoom, setNewRoom] = useState({
        room_number: '',
        room_type: 'double',
        price_per_night: '',
        description: '',
        status: 'available',
        image_url: '',
    });

    useEffect(() => {
        if (!authLoading && (!isAuthenticated || user?.role !== 'admin')) {
            navigate('/login');
            return;
        }

        const fetchRooms = async () => {
            try {
                const response = await roomApi.list();
                setRooms(response.data);
            } catch (error) {
                console.error('Failed to fetch rooms:', error);
                setRooms([]);
            } finally {
                setIsLoading(false);
            }
        };

        if (isAuthenticated) {
            fetchRooms();
        }
    }, [isAuthenticated, authLoading, navigate, user]);

    const handleAddRoom = async () => {
        if (!newRoom.room_number || !newRoom.price_per_night) {
            toast({
                title: 'Missing Information',
                description: 'Please fill in all required fields.',
                variant: 'destructive',
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await roomApi.create({
                room_number: newRoom.room_number,
                room_type: newRoom.room_type,
                price_per_night: parseFloat(newRoom.price_per_night),
                status: newRoom.status,
                image_url: newRoom.image_url,
            });

            setRooms([...rooms, response.data]);
            toast({
                title: 'Room Added',
                description: 'New room has been added successfully.',
            });

            setIsAddDialogOpen(false);
            setNewRoom({ room_number: '', room_type: 'double', price_per_night: '', description: '', status: 'available', image_url: '' });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to add room. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditRoom = (room: Room) => {
        setSelectedRoom(room);
        setIsEditDialogOpen(true);
    };

    const handleUpdateRoom = async () => {
        if (!selectedRoom) return;

        setIsSubmitting(true);
        try {
            // Try to update all fields if the API supports it
            try {
                await roomApi.update(selectedRoom.id, {
                    room_number: selectedRoom.room_number,
                    room_type: selectedRoom.room_type,
                    price_per_night: selectedRoom.price_per_night,
                    status: selectedRoom.status,
                    image_url: selectedRoom.image_url,
                    description: selectedRoom.description
                });
            } catch (e) {
                // Fallback to just status if full update fails (for backward compatibility)
                await roomApi.updateStatus(selectedRoom.id, selectedRoom.status);
            }

            setRooms(rooms.map(r => r.id === selectedRoom.id ? selectedRoom : r));
            toast({
                title: 'Room Updated',
                description: 'Room details have been updated successfully.',
            });

            setIsEditDialogOpen(false);
            setSelectedRoom(null);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to update room. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const configs: Record<string, string> = {
            available: 'bg-success/20 text-success border-success/30',
            occupied: 'bg-destructive/20 text-destructive border-destructive/30',
            cleaning: 'bg-primary/20 text-primary border-primary/30',
            maintenance: 'bg-muted text-muted-foreground border-muted',
        };
        return configs[status] || configs.available;
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
                            Room <span className="gradient-text">Management</span>
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Add, edit, and manage hotel rooms
                        </p>
                    </div>

                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="gold">
                                <Plus className="h-4 w-4" />
                                Add Room
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-card border-border max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="font-display">Add New Room</DialogTitle>
                                <DialogDescription>
                                    Enter the details of the new room.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 mt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="room_number">Room Number *</Label>
                                    <Input
                                        id="room_number"
                                        placeholder="101"
                                        value={newRoom.room_number}
                                        onChange={(e) => setNewRoom({ ...newRoom, room_number: e.target.value })}
                                        className="bg-input border-border"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="room_type">Room Type *</Label>
                                    <Select
                                        value={newRoom.room_type}
                                        onValueChange={(value) => setNewRoom({ ...newRoom, room_type: value })}
                                    >
                                        <SelectTrigger className="bg-input border-border">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-card border-border">
                                            <SelectItem value="single">Single Room</SelectItem>
                                            <SelectItem value="double">Double Room</SelectItem>
                                            <SelectItem value="suite">Suite</SelectItem>
                                            <SelectItem value="deluxe">Deluxe Room</SelectItem>
                                            <SelectItem value="presidential">Presidential Suite</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="price">Price per Night (₦) *</Label>
                                    <Input
                                        id="price"
                                        type="number"
                                        placeholder="150"
                                        value={newRoom.price_per_night}
                                        onChange={(e) => setNewRoom({ ...newRoom, price_per_night: e.target.value })}
                                        className="bg-input border-border"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        placeholder="Room description..."
                                        value={newRoom.description}
                                        onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                                        className="bg-input border-border min-h-[80px]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="image">Room Image</Label>
                                    <Input
                                        id="image"
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onloadend = () => {
                                                    setNewRoom({ ...newRoom, image_url: reader.result as string });
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                        className="bg-input border-border cursor-pointer"
                                    />
                                    {newRoom.image_url && (
                                        <div className="mt-2 relative">
                                            <img
                                                src={newRoom.image_url}
                                                alt="Room preview"
                                                className="w-full h-40 object-cover rounded-lg border border-border"
                                            />
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="sm"
                                                className="absolute top-2 right-2"
                                                onClick={() => setNewRoom({ ...newRoom, image_url: '' })}
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                        Upload an image of the room (JPG, PNG, WebP)
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="status">Initial Status *</Label>
                                    <Select
                                        value={newRoom.status}
                                        onValueChange={(value) => setNewRoom({ ...newRoom, status: value })}
                                    >
                                        <SelectTrigger className="bg-input border-border">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-card border-border">
                                            <SelectItem value="available">Available</SelectItem>
                                            <SelectItem value="occupied">Occupied</SelectItem>
                                            <SelectItem value="cleaning">Cleaning</SelectItem>
                                            <SelectItem value="maintenance">Maintenance</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button
                                    variant="gold"
                                    className="w-full"
                                    onClick={handleAddRoom}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Adding...
                                        </>
                                    ) : (
                                        'Add Room'
                                    )}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-8">
                    <div className="stat-card">
                        <div className="flex items-center justify-between mb-4">
                            <Home className="h-6 w-6 text-primary" />
                            <span className="text-xs text-muted-foreground uppercase tracking-wide">Total</span>
                        </div>
                        <div className="text-3xl font-display font-bold text-foreground">
                            {rooms.length}
                        </div>
                        <p className="text-sm text-muted-foreground">Total Rooms</p>
                    </div>

                    <div className="stat-card">
                        <div className="flex items-center justify-between mb-4">
                            <Bed className="h-6 w-6 text-success" />
                            <span className="text-xs text-muted-foreground uppercase tracking-wide">Available</span>
                        </div>
                        <div className="text-3xl font-display font-bold text-success">
                            {rooms.filter(r => r.status === 'available').length}
                        </div>
                        <p className="text-sm text-muted-foreground">Available</p>
                    </div>

                    <div className="stat-card">
                        <div className="flex items-center justify-between mb-4">
                            <Bed className="h-6 w-6 text-destructive" />
                            <span className="text-xs text-muted-foreground uppercase tracking-wide">Occupied</span>
                        </div>
                        <div className="text-3xl font-display font-bold text-destructive">
                            {rooms.filter(r => r.status === 'occupied').length}
                        </div>
                        <p className="text-sm text-muted-foreground">Occupied</p>
                    </div>

                    <div className="stat-card">
                        <div className="flex items-center justify-between mb-4">
                            <DollarSign className="h-6 w-6 text-primary" />
                            <span className="text-xs text-muted-foreground uppercase tracking-wide">Average</span>
                        </div>
                        <div className="text-3xl font-display font-bold text-foreground">
                            ₦{Math.round(rooms.reduce((sum, r) => sum + r.price_per_night, 0) / rooms.length || 0)}
                        </div>
                        <p className="text-sm text-muted-foreground">Avg Price/Night</p>
                    </div>
                </div>

                {/* Rooms Grid */}
                <div className="glass-card p-6">
                    <h2 className="font-display text-xl font-semibold text-foreground mb-6">
                        All Rooms
                    </h2>

                    <div className="grid gap-4">
                        {rooms.map((room, index) => (
                            <div
                                key={room.id}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-secondary/50 animate-slide-up"
                                style={{ animationDelay: `${index * 0.05}s` }}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <Bed className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-foreground">
                                            Room #{room.room_number || 'N/A'}
                                        </div>
                                        <div className="text-sm text-muted-foreground capitalize">
                                            {room.room_type || 'N/A'} - ₦{room.price_per_night || 0}/night
                                        </div>
                                        {room.description && (
                                            <div className="text-xs text-muted-foreground mt-1">
                                                {room.description}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Badge variant="outline" className={getStatusBadge(room.status || 'available')}>
                                        {room.status || 'available'}
                                    </Badge>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEditRoom(room)}
                                    >
                                        <Edit className="h-4 w-4" />
                                        Edit
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Edit Room Dialog */}
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent className="bg-card border-border max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="font-display">Edit Room</DialogTitle>
                            <DialogDescription>
                                Update room information and status.
                            </DialogDescription>
                        </DialogHeader>
                        {selectedRoom && (
                            <div className="space-y-4 mt-4">
                                <div className="space-y-2">
                                    <Label>Room Number</Label>
                                    <Input
                                        value={selectedRoom.room_number}
                                        onChange={(e) => setSelectedRoom({ ...selectedRoom, room_number: e.target.value })}
                                        className="bg-input border-border"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Room Type</Label>
                                    <Select
                                        value={selectedRoom.room_type}
                                        onValueChange={(value) => setSelectedRoom({ ...selectedRoom, room_type: value })}
                                    >
                                        <SelectTrigger className="bg-input border-border">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-card border-border">
                                            <SelectItem value="single">Single Room</SelectItem>
                                            <SelectItem value="double">Double Room</SelectItem>
                                            <SelectItem value="suite">Suite</SelectItem>
                                            <SelectItem value="deluxe">Deluxe Room</SelectItem>
                                            <SelectItem value="presidential">Presidential Suite</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Price per Night (₦)</Label>
                                    <Input
                                        type="number"
                                        value={selectedRoom.price_per_night}
                                        onChange={(e) => setSelectedRoom({ ...selectedRoom, price_per_night: parseFloat(e.target.value) })}
                                        className="bg-input border-border"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-image">Room Image</Label>
                                    <Input
                                        id="edit-image"
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onloadend = () => {
                                                    setSelectedRoom({ ...selectedRoom, image_url: reader.result as string });
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                        className="bg-input border-border cursor-pointer"
                                    />
                                    {selectedRoom.image_url && (
                                        <div className="mt-2 relative">
                                            <img
                                                src={selectedRoom.image_url}
                                                alt="Room preview"
                                                className="w-full h-40 object-cover rounded-lg border border-border"
                                            />
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="sm"
                                                className="absolute top-2 right-2"
                                                onClick={() => setSelectedRoom({ ...selectedRoom, image_url: '' })}
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                        Upload a new image to replace the current one
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    <Select
                                        value={selectedRoom.status}
                                        onValueChange={(value) => setSelectedRoom({ ...selectedRoom, status: value })}
                                    >
                                        <SelectTrigger className="bg-input border-border">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-card border-border">
                                            <SelectItem value="available">Available</SelectItem>
                                            <SelectItem value="occupied">Occupied</SelectItem>
                                            <SelectItem value="cleaning">Cleaning</SelectItem>
                                            <SelectItem value="maintenance">Maintenance</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button
                                    variant="gold"
                                    className="w-full"
                                    onClick={handleUpdateRoom}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Updating...
                                        </>
                                    ) : (
                                        'Update Room'
                                    )}
                                </Button>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </Layout>
    );
};

export default RoomManagement;
