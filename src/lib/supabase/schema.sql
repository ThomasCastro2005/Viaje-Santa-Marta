-- ============================================================
-- Viaje Santa Marta 2025 — Schema de Supabase
-- Ejecuta este SQL en el SQL Editor de tu proyecto Supabase
-- ============================================================

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ──────────────────────────────────────────
-- Tabla: miembros de la familia
-- ──────────────────────────────────────────
CREATE TABLE family_members (
  id            UUID    DEFAULT uuid_generate_v4() PRIMARY KEY,
  name          TEXT    NOT NULL,
  avatar        TEXT    NOT NULL DEFAULT '👤',
  is_confirmed  BOOLEAN DEFAULT FALSE,
  order_index   INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────
-- Tabla: datos de viajero (para tiquetes)
-- ──────────────────────────────────────────
CREATE TABLE traveler_details (
  id                      UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  member_id               UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  document_type           TEXT CHECK (document_type IN ('CC', 'TI', 'CE', 'PAS', 'RCN')),
  document_number         TEXT,
  birthdate               DATE,
  phone                   TEXT,
  email                   TEXT,
  emergency_contact_name  TEXT,
  emergency_contact_phone TEXT,
  dietary_needs           TEXT,
  special_requirements    TEXT,
  completed               BOOLEAN DEFAULT FALSE,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(member_id)
);

-- ──────────────────────────────────────────
-- Triggers: actualizar updated_at automático
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trg_family_members_updated_at
  BEFORE UPDATE ON family_members
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER trg_traveler_details_updated_at
  BEFORE UPDATE ON traveler_details
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ──────────────────────────────────────────
-- Row Level Security — permitir todo (app familiar sin auth)
-- ──────────────────────────────────────────
ALTER TABLE family_members    ENABLE ROW LEVEL SECURITY;
ALTER TABLE traveler_details  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "acceso_publico_family_members_select"
  ON family_members FOR SELECT USING (true);
CREATE POLICY "acceso_publico_family_members_insert"
  ON family_members FOR INSERT WITH CHECK (true);
CREATE POLICY "acceso_publico_family_members_update"
  ON family_members FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "acceso_publico_family_members_delete"
  ON family_members FOR DELETE USING (true);

CREATE POLICY "acceso_publico_traveler_details_select"
  ON traveler_details FOR SELECT USING (true);
CREATE POLICY "acceso_publico_traveler_details_insert"
  ON traveler_details FOR INSERT WITH CHECK (true);
CREATE POLICY "acceso_publico_traveler_details_update"
  ON traveler_details FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "acceso_publico_traveler_details_delete"
  ON traveler_details FOR DELETE USING (true);

-- ──────────────────────────────────────────
-- ──────────────────────────────────────────
-- Tabla: votos de alojamiento
-- ──────────────────────────────────────────
CREATE TABLE accommodation_votes (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  accommodation_id TEXT    NOT NULL,
  member_id        UUID    REFERENCES family_members(id) ON DELETE CASCADE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(member_id)
);

ALTER TABLE accommodation_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acceso_publico_votes_select" ON accommodation_votes FOR SELECT USING (true);
CREATE POLICY "acceso_publico_votes_insert" ON accommodation_votes FOR INSERT WITH CHECK (true);
CREATE POLICY "acceso_publico_votes_update" ON accommodation_votes FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "acceso_publico_votes_delete" ON accommodation_votes FOR DELETE USING (true);

-- ──────────────────────────────────────────
-- Tabla: alojamientos (dinámicos, editables)
-- ──────────────────────────────────────────
CREATE TABLE accommodations (
  id               UUID    DEFAULT uuid_generate_v4() PRIMARY KEY,
  name             TEXT    NOT NULL,
  location         TEXT    DEFAULT '',
  neighborhood     TEXT    DEFAULT '',
  description      TEXT    DEFAULT '',
  price_per_night  INTEGER NOT NULL,
  max_guests       INTEGER DEFAULT 10,
  amenities        TEXT[]  DEFAULT '{}',
  video_url        TEXT,
  external_url     TEXT,
  notes            TEXT,
  added_by_name    TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE accommodations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acceso_publico_accommodations_select" ON accommodations FOR SELECT USING (true);
CREATE POLICY "acceso_publico_accommodations_insert" ON accommodations FOR INSERT WITH CHECK (true);
CREATE POLICY "acceso_publico_accommodations_update" ON accommodations FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "acceso_publico_accommodations_delete" ON accommodations FOR DELETE USING (true);

-- También agregar campo is_declined a family_members (si no existe)
ALTER TABLE family_members ADD COLUMN IF NOT EXISTS is_declined BOOLEAN DEFAULT FALSE;

-- Alojamiento real: Palanoa Apartamento 702
INSERT INTO accommodations (name, location, neighborhood, description, price_per_night, max_guests, amenities, video_url, notes) VALUES
(
  'Palanoa · Apartamento 702',
  'Sector Rodadero, Santa Marta',
  'El Rodadero',
  'Remodelado y con vista al mar, este apartamento frente a la playa ofrece una grandiosa experiencia desde el balcón. 4 alcobas con aire acondicionado, 3 baños, WiFi y salida directa a la playa.',
  800000,
  14,
  ARRAY['4 Alcobas', 'A/C', '3 Baños', 'WiFi', 'Balcón', 'Vista al mar', 'Salida a la playa'],
  '/assets/palanoa.mp4',
  'Precios por noche (todo el grupo): T. Baja $800.000 · T. Media $960.000 · T. Alta $1.400.000 · T. Super Alta $1.790.000. Valores adicionales: Manilla de registro $6.000 p/p · Cuota de limpieza $90.000. Check-in 3:00 PM · Check-out 12:00 M.'
);

-- Miembros de la familia (actualiza según sea necesario)
-- ──────────────────────────────────────────
INSERT INTO family_members (name, avatar, is_confirmed, order_index) VALUES
  ('Julian Suarez',        '👨', false,  0),
  ('Daniela Ladino',       '👩', false,  1),
  ('Isa',                  '👧', false,  2),
  ('Abuelito Alberto',     '👴', false,  3),
  ('Abuelita Maria',       '👵', false,  4),
  ('LuzDary',              '👩', false,  5),
  ('Oscar Castro',         '👨', false,  6),
  ('Laura Castro',         '👩', false,  7),
  ('Steven Aponte',        '👨', false,  8),
  ('Thomas Castro',        '👦', false,  9),
  ('Valentina Buenhombre', '👩', false, 10),
  ('Andrea Fonseca',       '👩', false, 11),
  ('Sara Suarez',          '👧', false, 12),
  ('Kiara',                '👧', false, 13),
  ('Edwin Sanchez',        '👨', false, 14),
  ('Ivan Suarez',          '👨', false, 15),
  ('Vannesa',              '👩', false, 16),
  ('AnaLu',                '👩', false, 17),
  ('Luis Alberto',         '👨', false, 18),
  ('Claudia Castro',       '👩', false, 19),
  ('Juan Martin',          '👦', false, 20);
