import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { roomApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  Bed,
  Users,
  Wifi,
  Coffee,
  Bath,
  Sparkles,
  ChevronRight,
  Loader2
} from 'lucide-react';

interface Room {
  id: number;
  room_number: string;
  room_type: string;
  status: string;
  price_per_night: number;
  image_url?: string;
}

const roomImages: Record<string, string> = {
  single: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80',
  double: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80',
  suite: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80',
  deluxe: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&q=80',
  presidential: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80',
};

const roomAmenities: Record<string, string[]> = {
  single: ['Free WiFi', 'Coffee Maker', 'Work Desk'],
  double: ['Free WiFi', 'Coffee Maker', 'Mini Bar', 'City View'],
  suite: ['Free WiFi', 'Coffee Maker', 'Mini Bar', 'Ocean View', 'Living Room'],
  deluxe: ['Free WiFi', 'Espresso Machine', 'Mini Bar', 'Panoramic View', 'Jacuzzi'],
  presidential: ['Free WiFi', 'Full Kitchen', 'Butler Service', 'Private Pool', 'Helipad Access'],
};



const Rooms: React.FC = () => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
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

    fetchRooms();
  }, []);

  const filteredRooms = filter === 'all'
    ? rooms
    : rooms.filter(room => room.room_type === filter);

  const roomTypes = ['all', ...new Set(rooms.map(r => r.room_type).filter(Boolean))];

  const formatRoomType = (type: string) => {
    if (!type) return 'All';
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Our <span className="gradient-text">Rooms & Suites</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover your perfect sanctuary. Each room is designed with meticulous attention
            to detail for an unforgettable experience.
          </p>
        </div>
      </section>

      {/* Filter Section */}
      <section className="py-8 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-3 justify-center">
            {roomTypes.map((type) => (
              <Button
                key={type}
                variant={filter === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(type)}
              >
                {formatRoomType(type)}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Rooms Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredRooms.map((room, index) => (
                <div
                  key={room.id}
                  className="glass-card-hover overflow-hidden group animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Image */}
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={room.image_url || roomImages[room.room_type] || roomImages.single}
                      alt={`${room.room_type} room`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                    <Badge
                      className={`absolute top-4 right-4 ${room.status === 'available'
                        ? 'bg-success/20 text-success border-success/30'
                        : 'bg-destructive/20 text-destructive border-destructive/30'
                        }`}
                      variant="outline"
                    >
                      {room.status}
                    </Badge>
                    <div className="absolute bottom-4 left-4">
                      <div className="text-2xl font-display font-bold text-foreground">
                        ₦{room.price_per_night}
                        <span className="text-sm font-sans font-normal text-muted-foreground">/night</span>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-display text-xl font-semibold text-foreground">
                        {formatRoomType(room.room_type)} Room
                      </h3>
                      <span className="text-sm text-muted-foreground">#{room.room_number}</span>
                    </div>

                    {/* Amenities */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {(roomAmenities[room.room_type] || roomAmenities.single).slice(0, 3).map((amenity, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>

                    {/* Action */}
                    {user?.role !== 'admin' && (
                      room.status === 'available' ? (
                        <Button
                          variant="gold"
                          className="w-full"
                          asChild
                        >
                          <Link to={`/booking?room=${room.id}&type=${room.room_type}`}>
                            Book Now
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      ) : (
                        <Button
                          variant="gold"
                          className="w-full"
                          disabled
                        >
                          Not Available
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold text-foreground mb-4">
              Every Room Includes
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Wifi, label: 'High-Speed WiFi' },
              { icon: Coffee, label: 'Premium Coffee' },
              { icon: Bath, label: 'Luxury Bathroom' },
              { icon: Sparkles, label: '24/7 Service' },
            ].map((feature, index) => (
              <div key={index} className="text-center">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <feature.icon className="h-7 w-7 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">{feature.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Rooms;
