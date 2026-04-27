export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: 'client' | 'company_admin' | 'super_admin';
  avatar_url: string;
  country_id: string | null;
  city_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Country {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  created_at: string;
}

export interface City {
  id: string;
  name: string;
  country_id: string;
  is_active: boolean;
  created_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  max_vehicles: number;
  max_bookings_monthly: number;
  features: string[];
  is_active: boolean;
  sort_order: number;
  yearly_discount_percent: number;
  is_popular: boolean;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string;
  logo_url: string;
  cover_image_url: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  country: string;
  country_id: string | null;
  city_id: string | null;
  license_number: string;
  working_hours: Record<string, { open: string; close: string } | null>;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  rating: number;
  total_reviews: number;
  latitude: number | null;
  longitude: number | null;
  subscription_plan_id: string | null;
  subscription_status: string;
  subscription_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  company_id: string;
  brand: string;
  model: string;
  year: number;
  category: string;
  transmission: string;
  fuel_type: string;
  seats: number;
  doors: number;
  color: string;
  plate_number: string;
  price_per_day: number;
  price_per_km: number;
  deposit_amount: number;
  features: string[];
  images: string[];
  main_image_url: string;
  is_available: boolean;
  is_published: boolean;
  mileage: number;
  status: 'draft' | 'active' | 'inactive' | 'maintenance';
  rating: number;
  total_reviews: number;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  vehicle_id: string;
  company_id: string;
  client_id: string;
  pickup_date: string;
  return_date: string;
  pickup_location: string;
  return_location: string;
  total_days: number;
  price_per_day: number;
  total_price: number;
  deposit_amount: number;
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  payment_method: 'stripe' | 'paypal' | 'bank_transfer' | 'cash';
  payment_status: 'pending' | 'paid' | 'failed';
  notes: string;
  client_name: string;
  client_phone: string;
  client_email: string;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  booking_id: string;
  company_id: string;
  client_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface ChatResponse {
  id: string;
  category: string;
  keywords: string[];
  question: string;
  answer: string;
  language: string;
  priority: number;
  is_active: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface HomepageContent {
  id: string;
  section_key: string;
  title: string;
  subtitle: string;
  content: Record<string, unknown>;
  image_url: string;
  is_active: boolean;
  sort_order: number;
  updated_at: string;
  updated_by: string | null;
}

export interface PlatformAd {
  id: string;
  title: string;
  description: string;
  image_url: string;
  link_url: string;
  position: string;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  click_count: number;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface ChatConversation {
  id: string;
  visitor_id: string;
  user_id: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_type: 'visitor' | 'bot' | 'admin';
  message: string;
  matched_response_id: string | null;
  created_at: string;
}

export interface PlatformSetting {
  id: string;
  key: string;
  value: Record<string, unknown>;
  updated_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  booking_id: string;
  company_id: string;
  client_id: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  company_name: string;
  company_email: string;
  company_phone: string;
  vehicle_name: string;
  pickup_date: string;
  return_date: string;
  total_days: number;
  price_per_day: number;
  subtotal: number;
  deposit_amount: number;
  total_price: number;
  payment_method: string;
  payment_status: string;
  status: 'draft' | 'issued' | 'paid' | 'cancelled';
  issued_at: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface HomepageSetting {
  id: string;
  key: string;
  value: Record<string, unknown>;
  updated_at: string;
  updated_by: string | null;
}

export interface HeroSettings {
  image_url: string;
  title_line1: string;
  title_line2: string;
  subtitle: string;
  badge_text: string;
  search_label_city: string;
  search_label_pickup: string;
  search_label_return: string;
  search_button_text: string;
  show_trust_badges: boolean;
  trust_badge_1: string;
  trust_badge_2: string;
  trust_badge_3: string;
  trust_badge_4: string;
  overlay_opacity: number;
}

export interface LogoSettings {
  logo_url: string;
  site_name: string;
  show_text: boolean;
  show_icon: boolean;
}

export interface NavbarSettings {
  show_vehicles_link: boolean;
  vehicles_link_text: string;
  login_button_text: string;
  register_button_text: string;
  register_button_color: string;
}

export interface SectionsSettings {
  show_categories: boolean;
  show_featured: boolean;
  show_how_it_works: boolean;
  show_testimonials: boolean;
  show_company_cta: boolean;
  show_trust_banner: boolean;
  categories_title: string;
  categories_subtitle: string;
  featured_title: string;
  featured_subtitle: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  reference_id: string | null;
  reference_type: string | null;
  is_read: boolean;
  created_at: string;
}
