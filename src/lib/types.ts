export type Currency = 'EUR' | 'ALL' | 'USD' | 'MKD' | 'RSD' | 'GBP' | 'CHF';

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
  date_of_birth: string | null;
  preferred_language?: 'sq' | 'en' | 'de';
  referral_code?: string | null;
  referred_by?: string | null;
  created_at: string;
  updated_at: string;
}

export type LoyaltyTransactionType =
  | 'booking_earned'
  | 'referral_bonus'
  | 'welcome_bonus'
  | 'redeemed'
  | 'admin_adjustment'
  | 'expired';

export interface LoyaltyTransaction {
  id: string;
  user_id: string;
  points: number;
  type: LoyaltyTransactionType;
  booking_id: string | null;
  description: string | null;
  created_at: string;
}

export interface LoyaltyBalance {
  user_id: string;
  total_points: number;
  total_earned: number;
  total_spent: number;
  earn_count: number;
  last_activity_at: string | null;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referee_id: string;
  status: 'pending' | 'qualified' | 'rewarded' | 'cancelled';
  first_booking_id: string | null;
  reward_points: number;
  rewarded_at: string | null;
  created_at: string;
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

export type FuelPolicy = 'full_to_full' | 'full_to_empty' | 'same_to_same' | 'prepaid';

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
  currency: Currency;
  features: string[];
  images: string[];
  main_image_url: string;
  is_available: boolean;
  is_published: boolean;
  mileage: number;
  status: 'draft' | 'active' | 'inactive' | 'maintenance';
  rating: number;
  total_reviews: number;
  // Industri policies
  included_km_per_day: number; // 0 = unlimited
  extra_km_price: number;
  fuel_policy: FuelPolicy;
  min_driver_age: number;
  min_license_years: number;
  young_driver_fee_per_day: number;
  cross_border_allowed: boolean;
  allowed_countries: string[];
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface InsurancePlan {
  id: string;
  company_id: string | null; // null = platform-wide
  code: string;
  name_sq: string;
  name_en: string;
  name_de: string;
  description_sq: string;
  description_en: string;
  description_de: string;
  tier: 'basic' | 'standard' | 'premium' | 'platinum';
  price_per_day: number;
  currency: Currency;
  deductible_amount: number;
  includes_cdw: boolean;
  includes_theft_protection: boolean;
  includes_third_party: boolean;
  includes_personal_accident: boolean;
  includes_glass_tire: boolean;
  includes_roadside_assistance: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type ExtraCategory = 'comfort' | 'safety' | 'equipment' | 'driver' | 'connectivity' | 'winter' | 'child';

export interface VehicleExtra {
  id: string;
  company_id: string | null;
  code: string;
  name_sq: string;
  name_en: string;
  name_de: string;
  description_sq: string;
  description_en: string;
  description_de: string;
  category: ExtraCategory;
  icon: string;
  price_per_day: number;
  price_per_rental: number;
  currency: Currency;
  max_quantity: number;
  requires_extra_license: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface BookingExtra {
  id: string;
  booking_id: string;
  extra_id: string;
  quantity: number;
  unit_price_per_day: number;
  unit_price_per_rental: number;
  subtotal: number;
  currency: Currency;
  created_at: string;
}

export type LocationType = 'office' | 'airport' | 'train_station' | 'hotel_delivery' | 'port' | 'custom';

export interface PickupLocation {
  id: string;
  company_id: string;
  name: string;
  type: LocationType;
  address: string;
  city_id: string | null;
  country_id: string | null;
  latitude: number | null;
  longitude: number | null;
  pickup_fee: number;
  dropoff_fee: number;
  one_way_fee: number;
  currency: Currency;
  opening_hours: Record<string, { open: string; close: string } | null>;
  phone: string;
  is_24_7: boolean;
  meet_and_greet_available: boolean;
  is_active: boolean;
  sort_order: number;
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
  pickup_location_id: string | null;
  return_location_id: string | null;
  total_days: number;
  price_per_day: number;
  total_price: number;
  deposit_amount: number;
  currency: Currency;
  // Add-ons & sigurim
  insurance_plan_id: string | null;
  insurance_total: number;
  extras_total: number;
  one_way_fee: number;
  tax_total: number;
  discount_total: number;
  discount_code_id: string | null;
  // Mileage
  included_km: number;
  extra_km_price: number;
  // Status
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  payment_method: 'stripe' | 'paypal' | 'bank_transfer' | 'cash';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  notes: string;
  internal_notes: string;
  client_name: string;
  client_phone: string;
  client_email: string;
  // Cash hold (Stripe Authorization)
  cash_hold_payment_intent_id?: string | null;
  cash_hold_amount?: number | null;
  cash_hold_status?: 'authorized' | 'released' | 'captured' | 'expired' | 'failed' | null;
  cash_hold_authorized_at?: string | null;
  cash_hold_resolved_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  booking_id: string;
  vehicle_id: string | null;
  company_id: string;
  client_id: string;
  rating: number;
  cleanliness_rating: number | null;
  value_rating: number | null;
  service_rating: number | null;
  condition_rating: number | null;
  comment: string;
  photos: string[];
  company_reply: string;
  company_reply_at: string | null;
  helpful_count: number;
  is_verified_booking: boolean;
  is_hidden: boolean;
  hidden_reason: string | null;
  created_at: string;
  updated_at: string;
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
  is_escalated: boolean;
  last_message_at: string;
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
  vehicle_id: string | null;
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
  currency: Currency;
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
  image_url_mobile?: string;
  image_position_mobile?: string;
  image_position_desktop?: string;
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

export interface CurrencyRate {
  base_currency: Currency;
  quote_currency: Currency;
  rate: number;
  source: string;
  fetched_at: string;
}

export interface WishlistItem {
  user_id: string;
  vehicle_id: string;
  created_at: string;
}

export interface SavedSearch {
  id: string;
  user_id: string;
  name: string;
  filters: Record<string, unknown>;
  alert_enabled: boolean;
  max_price: number | null;
  currency: Currency;
  last_alerted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DamageReport {
  id: string;
  booking_id: string;
  vehicle_id: string;
  phase: 'pickup' | 'return';
  reported_by: string | null;
  mileage: number | null;
  fuel_level: 'empty' | 'quarter' | 'half' | 'three_quarter' | 'full' | null;
  cleanliness: 'poor' | 'fair' | 'good' | 'excellent' | null;
  exterior_notes: string;
  interior_notes: string;
  photos: string[];
  damage_marks: Array<{ x: number; y: number; severity: string; note?: string }>;
  client_signature: string | null;
  staff_signature: string | null;
  acknowledged_by_client: boolean;
  acknowledged_at: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  user_role: string | null;
  action: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'status_change' | 'approve' | 'reject' | 'suspend' | 'restore' | 'export' | 'import';
  entity_type: string;
  entity_id: string | null;
  changes: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}
