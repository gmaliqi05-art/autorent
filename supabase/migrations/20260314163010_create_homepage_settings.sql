/*
  # Create Homepage Settings Table

  ## Purpose
  A comprehensive settings table for managing all homepage content from the Super Admin panel.

  ## New Tables
  - `homepage_settings` - Key-value store for all homepage config:
    - Hero section: image, title, subtitle, badge text, search placeholder
    - Logo: uploaded logo URL, site name
    - Navbar: links visibility, CTA button text/color
    - Trust badges: text for each badge
    - Section visibility: hero, categories, featured, how_it_works, testimonials, company_cta, trust_banner

  ## Security
  - RLS enabled
  - Admin-only write access
  - Public read access (needed for homepage rendering)
*/

CREATE TABLE IF NOT EXISTS homepage_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE homepage_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read homepage settings"
  ON homepage_settings FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Super admins can insert homepage settings"
  ON homepage_settings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can update homepage settings"
  ON homepage_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Seed default values
INSERT INTO homepage_settings (key, value) VALUES
('hero', '{
  "image_url": "https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop",
  "title_line1": "Udhetoni me stil,",
  "title_line2": "rezervoni me lehte.",
  "subtitle": "Qindra automjete premium nga kompanite me te besueshme ne Kosove, Shqiperi dhe Maqedoni te Veriut.",
  "badge_text": "",
  "search_label_city": "Ku deshironi te udhetoni?",
  "search_label_pickup": "Data e marrjes",
  "search_label_return": "Data e kthimit",
  "search_button_text": "Kerko",
  "show_trust_badges": true,
  "trust_badge_1": "Anulim falas",
  "trust_badge_2": "Sigurim i plote",
  "trust_badge_3": "Konfirmim i shpejte",
  "trust_badge_4": "Mbeshtetje 24/7",
  "overlay_opacity": 70
}'),
('logo', '{
  "logo_url": "",
  "site_name": "RentaKar",
  "show_text": true,
  "show_icon": true
}'),
('navbar', '{
  "show_vehicles_link": true,
  "vehicles_link_text": "Automjetet",
  "login_button_text": "Kycu",
  "register_button_text": "Regjistrohu",
  "register_button_color": "primary"
}'),
('sections', '{
  "show_categories": true,
  "show_featured": true,
  "show_how_it_works": true,
  "show_testimonials": true,
  "show_company_cta": true,
  "show_trust_banner": true,
  "categories_title": "Gjeni automjetin qe ju pershtatet",
  "categories_subtitle": "Kategorite",
  "featured_title": "Automjete te rekomanduara",
  "featured_subtitle": "Te zgjedhura"
}')
ON CONFLICT (key) DO NOTHING;
