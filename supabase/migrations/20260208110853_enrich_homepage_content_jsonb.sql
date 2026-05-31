/*
  # Enrich homepage_content JSONB with full section data

  1. Updates
    - `hero` section: Adds background_image, cities for search, trust features
    - `trust_banner` section: Already has stats, no changes needed
    - `categories` section: Adds full category items with images, descriptions, counts
    - `how_it_works` section: Enriches steps with icon keys and colors
    - `testimonials` section: Adds full testimonial items
    - `company_cta` section: Adds benefits, stats, background image, links
    - Adds `footer` section for footer content management
    - Adds `navbar` section for navigation management

  2. New Sections
    - `footer` - Manages footer links, contact info display
    - `navbar` - Manages navigation links

  3. Notes
    - All content stored in JSONB `content` column for flexibility
    - Public components read from this data with fallbacks
*/

UPDATE homepage_content
SET content = jsonb_build_object(
  'badge', 'Platforma lider per qirane automjetesh',
  'search_enabled', true,
  'background_image', 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
  'cities', jsonb_build_array(
    jsonb_build_object('value', 'Prishtine', 'label', 'Prishtine, Kosove'),
    jsonb_build_object('value', 'Tirane', 'label', 'Tirane, Shqiperi'),
    jsonb_build_object('value', 'Shkup', 'label', 'Shkup, Maqedoni'),
    jsonb_build_object('value', 'Prizren', 'label', 'Prizren, Kosove'),
    jsonb_build_object('value', 'Shkoder', 'label', 'Shkoder, Shqiperi'),
    jsonb_build_object('value', 'Durres', 'label', 'Durres, Shqiperi')
  ),
  'features', jsonb_build_array(
    jsonb_build_object('icon', 'check-circle', 'text', 'Anulim falas', 'color', 'green'),
    jsonb_build_object('icon', 'shield', 'text', 'Sigurim i plote', 'color', 'primary'),
    jsonb_build_object('icon', 'clock', 'text', 'Konfirmim i shpejte', 'color', 'accent'),
    jsonb_build_object('icon', 'heart-handshake', 'text', 'Mbeshtetje 24/7', 'color', 'green')
  )
),
image_url = 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop'
WHERE section_key = 'hero';

UPDATE homepage_content
SET content = jsonb_build_object(
  'items', jsonb_build_array(
    jsonb_build_object('id', 'ekonomike', 'label', 'Ekonomike', 'image', 'https://images.pexels.com/photos/1592384/pexels-photo-1592384.jpeg?auto=compress&cs=tinysrgb&w=400&h=260&fit=crop', 'desc', 'Nga 15E/dite', 'count', '120+'),
    jsonb_build_object('id', 'kompakte', 'label', 'Kompakte', 'image', 'https://images.pexels.com/photos/100656/pexels-photo-100656.jpeg?auto=compress&cs=tinysrgb&w=400&h=260&fit=crop', 'desc', 'Nga 25E/dite', 'count', '95+'),
    jsonb_build_object('id', 'sedan', 'label', 'Sedan', 'image', 'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg?auto=compress&cs=tinysrgb&w=400&h=260&fit=crop', 'desc', 'Nga 35E/dite', 'count', '80+'),
    jsonb_build_object('id', 'suv', 'label', 'SUV', 'image', 'https://images.pexels.com/photos/116675/pexels-photo-116675.jpeg?auto=compress&cs=tinysrgb&w=400&h=260&fit=crop', 'desc', 'Nga 45E/dite', 'count', '70+'),
    jsonb_build_object('id', 'luksoz', 'label', 'Luksoze', 'image', 'https://images.pexels.com/photos/120049/pexels-photo-120049.jpeg?auto=compress&cs=tinysrgb&w=400&h=260&fit=crop', 'desc', 'Nga 65E/dite', 'count', '35+'),
    jsonb_build_object('id', 'furgon', 'label', 'Furgon', 'image', 'https://images.pexels.com/photos/2533092/pexels-photo-2533092.jpeg?auto=compress&cs=tinysrgb&w=400&h=260&fit=crop', 'desc', 'Nga 40E/dite', 'count', '25+')
  )
)
WHERE section_key = 'categories';

UPDATE homepage_content
SET content = jsonb_build_object(
  'steps', jsonb_build_array(
    jsonb_build_object('icon', 'search', 'title', 'Kerkoni automjetin', 'desc', 'Zgjidhni vendin, daten dhe tipin e automjetit qe deshironi. Filtrat e avancuara ju ndihmojne te gjeni automjetin perfekt.', 'color', 'primary'),
    jsonb_build_object('icon', 'calendar', 'title', 'Beni rezervimin', 'desc', 'Plotesoni te dhenat tuaja dhe rezervoni ne pak sekonda. Procesi eshte i sigurt dhe i shpejte.', 'color', 'accent'),
    jsonb_build_object('icon', 'shield', 'title', 'Konfirmim i shpejte', 'desc', 'Kompania konfirmon rezervimin tuaj brenda orarit te punes. Do te njoftoheni menjehere.', 'color', 'green'),
    jsonb_build_object('icon', 'car', 'title', 'Merrni automjetin', 'desc', 'Paraqituni ne vendin e caktuar, nenshkruani kontraten dhe nisni udhetimin tuaj.', 'color', 'dark')
  ),
  'button_text', 'Filloni tani',
  'button_link', '/automjetet'
)
WHERE section_key = 'how_it_works';

UPDATE homepage_content
SET content = jsonb_build_object(
  'items', jsonb_build_array(
    jsonb_build_object('name', 'Arta Morina', 'city', 'Prishtine', 'role', 'Udhetare e shpeshte', 'rating', 5, 'text', 'Sherbim te jashtezakonshem! Automjeti ishte i ri, i paster dhe procesi i rezervimit ishte shume i lehte. E rekomandoj per te gjithe.'),
    jsonb_build_object('name', 'Besnik Krasniqi', 'city', 'Tirane', 'role', 'Biznesmen', 'rating', 5, 'text', 'Cmimet me te mira qe kam gjetur ne rajon. Kompania ishte profesionale dhe automjeti ishte ekzaktesisht si ne foto. Do ta perdor perseri.'),
    jsonb_build_object('name', 'Drita Hoxha', 'city', 'Shkup', 'role', 'Turiste', 'rating', 5, 'text', 'Rezervova online nga shtepija dhe mora automjetin per vetem 10 minuta. Eksperience shkelqyese nga fillimi deri ne fund.')
  )
)
WHERE section_key = 'testimonials';

UPDATE homepage_content
SET content = jsonb_build_object(
  'benefits', jsonb_build_array(
    jsonb_build_object('text', 'Arrini mijera kliente te rinj'),
    jsonb_build_object('text', 'Menaxhoni floten dixhitalisht'),
    jsonb_build_object('text', 'Mbeshtetje teknike 24/7')
  ),
  'stats', jsonb_build_array(
    jsonb_build_object('value', '98%', 'label', 'Kenaqesi e klienteve'),
    jsonb_build_object('value', '3x', 'label', 'Rritje e rezervimeve'),
    jsonb_build_object('value', '24h', 'label', 'Konfirmim i shpejte'),
    jsonb_build_object('value', '0E', 'label', 'Komisione fillestare')
  ),
  'background_image', 'https://images.pexels.com/photos/3184306/pexels-photo-3184306.jpeg?auto=compress&cs=tinysrgb&w=1200&h=600&fit=crop',
  'register_link', '/regjistrohu?role=company',
  'plans_link', '/cmimet',
  'register_text', 'Regjistro kompanine',
  'plans_text', 'Shiko planet'
),
image_url = 'https://images.pexels.com/photos/3184306/pexels-photo-3184306.jpeg?auto=compress&cs=tinysrgb&w=1200&h=600&fit=crop'
WHERE section_key = 'company_cta';

INSERT INTO homepage_content (section_key, title, subtitle, content, is_active, sort_order)
VALUES (
  'footer',
  'Footer',
  'Informacione te fundjavese',
  jsonb_build_object(
    'links', jsonb_build_array(
      jsonb_build_object('label', 'Automjetet', 'url', '/automjetet'),
      jsonb_build_object('label', 'Cmimet', 'url', '/cmimet'),
      jsonb_build_object('label', 'Regjistro kompanine', 'url', '/regjistrohu?role=company')
    ),
    'help_links', jsonb_build_array(
      jsonb_build_object('label', 'Pyetjet e shpeshta', 'url', ''),
      jsonb_build_object('label', 'Kushtet e perdorimit', 'url', '/kushtet-perdorimit'),
      jsonb_build_object('label', 'Politika e privatesise', 'url', '/politika-privatesise')
    ),
    'copyright_text', 'Booking Shpk. Te gjitha te drejtat e rezervuara.',
    'created_by_text', 'MarGrup',
    'created_by_location', 'Gjermani'
  ),
  true,
  8
)
ON CONFLICT (section_key) DO UPDATE SET
  content = EXCLUDED.content,
  updated_at = now();

INSERT INTO homepage_content (section_key, title, subtitle, content, is_active, sort_order)
VALUES (
  'navbar',
  'Navbar',
  'Navigimi kryesor',
  jsonb_build_object(
    'site_name', 'RentaKar',
    'nav_links', jsonb_build_array(
      jsonb_build_object('label', 'Automjetet', 'url', '/automjetet')
    ),
    'login_text', 'Kycu',
    'register_text', 'Regjistrohu'
  ),
  true,
  0
)
ON CONFLICT (section_key) DO UPDATE SET
  content = EXCLUDED.content,
  updated_at = now();

;
