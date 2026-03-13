export interface ServiceItem {
  id: string;
  name: string;
  category: 'wash' | 'dry_clean' | 'iron' | 'specialty';
  price: number;
  unit: string;
  available: boolean;
  turnaround?: string;
}

export interface Laundry {
  id: string;
  name: string;
  image: string;
  rating: number;
  reviews: number;
  deliveryTime: string;
  distance: number; // in km, numeric for sorting
  distanceLabel: string;
  status: 'active' | 'inactive';
  isAvailable: boolean;
  featured?: boolean;
  discount?: string;
  address: string;
  services: ServiceItem[];
}

export const laundries: Laundry[] = [
  {
    id: '1',
    name: 'Smart Clean Laundry',
    image: 'https://images.unsplash.com/photo-1695679958326-918405eacb70?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYXVuZHJ5JTIwc2VydmljZSUyMHNob3B8ZW58MXx8fHwxNzcyOTM3MDk5fDA&ixlib=rb-4.1.0&q=80&w=1080',
    rating: 4.8,
    reviews: 250,
    deliveryTime: '2 hours',
    distance: 0.8,
    distanceLabel: '0.8 km',
    status: 'active',
    isAvailable: true,
    featured: true,
    discount: '20% OFF',
    address: '14 Tahrir Square, Cairo',
    services: [
      { id: 'wash-kg',    name: 'Wash & Fold',        category: 'wash',      price: 15,  unit: 'per kg',   available: true,  turnaround: '2 hrs' },
      { id: 'wash-dry',   name: 'Wash & Dry',         category: 'wash',      price: 18,  unit: 'per kg',   available: true,  turnaround: '3 hrs' },
      { id: 'iron-shirt', name: 'Iron – Shirt',       category: 'iron',      price: 10,  unit: 'per item', available: true,  turnaround: '1 hr'  },
      { id: 'iron-suit',  name: 'Iron – Suit',        category: 'iron',      price: 22,  unit: 'per item', available: true,  turnaround: '2 hrs' },
      { id: 'dry-shirt',  name: 'Dry Clean – Shirt',  category: 'dry_clean', price: 35,  unit: 'per item', available: true,  turnaround: '24 hrs'},
      { id: 'dry-dress',  name: 'Dry Clean – Dress',  category: 'dry_clean', price: 55,  unit: 'per item', available: true,  turnaround: '24 hrs'},
      { id: 'sp-blanket', name: 'Blanket / Duvet',    category: 'specialty', price: 80,  unit: 'per item', available: true,  turnaround: '48 hrs'},
    ],
  },
  {
    id: '2',
    name: 'Comfort Laundry',
    image: 'https://images.unsplash.com/photo-1761079976271-3a78f547ca67?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3YXNoaW5nJTIwbWFjaGluZSUyMG1vZGVybnxlbnwxfHx8fDE3NzI4NzE2MTJ8MA&ixlib=rb-4.1.0&q=80&w=1080',
    rating: 4.6,
    reviews: 180,
    deliveryTime: '3 hours',
    distance: 1.2,
    distanceLabel: '1.2 km',
    status: 'active',
    isAvailable: true,
    address: '7 El-Nasr Road, New Cairo',
    services: [
      { id: 'wash-kg',    name: 'Wash & Fold',        category: 'wash',      price: 12,  unit: 'per kg',   available: true,  turnaround: '3 hrs' },
      { id: 'iron-shirt', name: 'Iron – Shirt',       category: 'iron',      price: 8,   unit: 'per item', available: true,  turnaround: '1 hr'  },
      { id: 'iron-trouser', name: 'Iron – Trousers',  category: 'iron',      price: 10,  unit: 'per item', available: true,  turnaround: '1 hr'  },
      { id: 'dry-shirt',  name: 'Dry Clean – Shirt',  category: 'dry_clean', price: 30,  unit: 'per item', available: true,  turnaround: '24 hrs'},
      { id: 'sp-blanket', name: 'Blanket / Duvet',    category: 'specialty', price: 70,  unit: 'per item', available: false, turnaround: '48 hrs'},
    ],
  },
  {
    id: '3',
    name: 'Express Clean',
    image: 'https://images.unsplash.com/photo-1764120656278-994739787d38?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjbGVhbiUyMGZvbGRlZCUyMGNsb3RoZXN8ZW58MXx8fHwxNzcyOTM3MTAwfDA&ixlib=rb-4.1.0&q=80&w=1080',
    rating: 4.9,
    reviews: 320,
    deliveryTime: '1.5 hours',
    distance: 0.5,
    distanceLabel: '0.5 km',
    status: 'active',
    isAvailable: true,
    featured: true,
    discount: '15% OFF',
    address: '3 Al-Haram Street, Giza',
    services: [
      { id: 'wash-kg',    name: 'Wash & Fold',        category: 'wash',      price: 18,  unit: 'per kg',   available: true,  turnaround: '1.5 hrs'},
      { id: 'wash-dry',   name: 'Wash & Dry',         category: 'wash',      price: 22,  unit: 'per kg',   available: true,  turnaround: '2 hrs' },
      { id: 'iron-shirt', name: 'Iron – Shirt',       category: 'iron',      price: 12,  unit: 'per item', available: true,  turnaround: '45 min'},
      { id: 'iron-suit',  name: 'Iron – Suit',        category: 'iron',      price: 25,  unit: 'per item', available: true,  turnaround: '1.5 hrs'},
      { id: 'dry-shirt',  name: 'Dry Clean – Shirt',  category: 'dry_clean', price: 40,  unit: 'per item', available: true,  turnaround: '24 hrs'},
      { id: 'dry-coat',   name: 'Dry Clean – Coat',   category: 'dry_clean', price: 75,  unit: 'per item', available: true,  turnaround: '36 hrs'},
      { id: 'sp-blanket', name: 'Blanket / Duvet',    category: 'specialty', price: 90,  unit: 'per item', available: true,  turnaround: '48 hrs'},
      { id: 'sp-curtain', name: 'Curtains',           category: 'specialty', price: 120, unit: 'per set',  available: true,  turnaround: '72 hrs'},
    ],
  },
  {
    id: '4',
    name: 'Elegance Laundry',
    image: 'https://images.unsplash.com/photo-1758720793993-0d191e578741?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkcnklMjBjbGVhbmluZyUyMHNlcnZpY2V8ZW58MXx8fHwxNzcyODg5NTUwfDA&ixlib=rb-4.1.0&q=80&w=1080',
    rating: 4.7,
    reviews: 200,
    deliveryTime: '2.5 hours',
    distance: 1.5,
    distanceLabel: '1.5 km',
    status: 'active',
    isAvailable: false,
    address: '22 Corniche El-Nil, Maadi',
    services: [
      { id: 'wash-kg',    name: 'Wash & Fold',        category: 'wash',      price: 14,  unit: 'per kg',   available: true,  turnaround: '2.5 hrs'},
      { id: 'iron-shirt', name: 'Iron – Shirt',       category: 'iron',      price: 9,   unit: 'per item', available: true,  turnaround: '1 hr'  },
      { id: 'dry-dress',  name: 'Dry Clean – Dress',  category: 'dry_clean', price: 50,  unit: 'per item', available: true,  turnaround: '24 hrs'},
    ],
  },
  {
    id: '5',
    name: 'Fresh & Clean',
    image: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    rating: 4.3,
    reviews: 95,
    deliveryTime: '4 hours',
    distance: 2.1,
    distanceLabel: '2.1 km',
    status: 'inactive',
    isAvailable: false,
    address: '9 Mohamed Farid St, Downtown',
    services: [],
  },
];

export const categoryLabels: Record<string, string> = {
  wash: 'Wash & Fold',
  iron: 'Ironing',
  dry_clean: 'Dry Cleaning',
  specialty: 'Specialty Items',
};

export const categoryOrder = ['wash', 'iron', 'dry_clean', 'specialty'];