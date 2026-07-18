export type DocumentType = 'CC' | 'TI' | 'CE' | 'PAS' | 'RCN';

export interface FamilyMember {
  id: string;
  name: string;
  avatar: string;
  is_confirmed: boolean;
  is_declined: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface TravelerDetails {
  id: string;
  member_id: string;
  document_type: DocumentType | null;
  document_number: string | null;
  birthdate: string | null;
  phone: string | null;
  email: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  dietary_needs: string | null;
  special_requirements: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface FamilyMemberWithDetails extends FamilyMember {
  traveler_details?: TravelerDetails | null;
}

export interface AccommodationVote {
  id: string;
  accommodation_id: string;
  member_id: string;
  created_at: string;
}

export interface Accommodation {
  id: string;
  name: string;
  location: string;
  neighborhood: string;
  description: string;
  price_per_night: number;
  max_guests: number;
  amenities: string[];
  video_url: string | null;
  external_url: string | null;
  notes: string | null;
  added_by_name: string | null;
  created_at: string;
}
