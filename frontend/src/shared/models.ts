export interface Category {
  id: number;
  name: string;
  event_count?: number;
}
export interface Organisation {
  id: number;
  name: string;
  mission: string;
}
export interface Registration {
  id: number;
  full_name: string;
  email?: string;
  phone?: string;
  registered_at: string;
  tickets: number;
  unit_price: number;
  total_amount: number;
}
export interface Receipt {
  registration: Registration;
  event_name: string;
  message: string;
}
export interface Event {
  id: number;
  organisation_id: number;
  category_id: number;
  name: string;
  image_file: string;
  short_description: string;
  purpose: string;
  description: string;
  event_date: string;
  start_time: string;
  end_time: string;
  venue: string;
  suburb: string;
  city: string;
  ticket_price: number;
  goal_amount: number;
  raised_amount: number;
  ticket_capacity: number;
  latitude: number;
  longitude: number;
  is_suspended: boolean;
  version: number;
  category_name: string;
  organisation_name: string;
  registration_count: number;
  tickets_booked: number;
  available_tickets: number;
  status: string;
  registrations: Registration[];
}
export type EventDraft = Partial<Event> & {
  dateModel?: string;
  startModel?: string;
  endModel?: string;
};
export interface Forecast {
  available: boolean;
  reason?: string;
  description?: string;
  date?: string;
  low?: number;
  high?: number;
  rain_chance?: number | null;
  latitude?: number;
  longitude?: number;
  code?: number;
  source?: string;
  source_url?: string;
  fetched_at?: string;
}
