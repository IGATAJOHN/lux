// API Response Types
export interface User {
    id: number;
    email: string;
    name: string;
    phone?: string;
    role: 'guest' | 'admin' | 'staff';
    unique_id?: string;
}

export interface Booking {
    id: number;
    user_id: number;
    check_in_date: string;
    check_out_date: string;
    room_type: string;
    room_id?: number;
    status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
    preferences?: string;
    fraud_score?: number;
    created_at?: string;
}

export interface Room {
    id: number;
    room_number: string;
    room_type: string;
    status: 'available' | 'occupied' | 'cleaning' | 'maintenance';
    price_per_night: number;
    description?: string;
    amenities?: string[];
}

export interface ServiceRequest {
    id: number;
    user_id: number;
    request_type: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    assigned_staff_id?: number;
    created_at?: string;
    updated_at?: string;
}

export interface DashboardData {
    booking_status: string;
    current_room: string;
    active_requests: number;
    recommendations: string[];
}

export interface AdminDashboardData {
    active_guests: number;
    open_requests: number;
    fraud_alerts: number;
    total_bookings?: number;
    occupancy_rate?: number;
}

export interface LoginResponse {
    access_token: string;
    token_type: string;
}

export interface ApiError {
    detail: string;
}
