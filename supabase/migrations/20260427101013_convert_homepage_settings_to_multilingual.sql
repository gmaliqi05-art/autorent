/*
  # Convert homepage_settings hero/navbar/sections to multilingual JSONB

  1. Changes
    - Updates the existing JSONB `value` for keys 'hero', 'navbar', 'sections' so that text fields
      are stored as { sq, en, de } objects instead of plain Albanian strings.
    - Frontend (`useHomepageSettings`/`pickLocalized`) reads the matching language and falls back
      to English then Albanian; if absent, it falls back to i18n translation keys.
    - This eliminates the bug where switching language did not affect Hero/Navbar text.

  2. Affected fields
    - hero: title_line1, title_line2, subtitle, search_label_city, search_label_pickup,
            search_label_return, search_button_text, trust_badge_1..4
    - navbar: vehicles_link_text, login_button_text, register_button_text
    - sections: categories_title, categories_subtitle, featured_title, featured_subtitle

  3. Security
    - No DDL changes; only data updates inside existing JSONB column.
*/

UPDATE homepage_settings
SET value = value
  || jsonb_build_object(
    'title_line1', jsonb_build_object(
      'sq', 'Udhetoni me stil,',
      'en', 'Travel in style,',
      'de', 'Stilvoll reisen,'
    ),
    'title_line2', jsonb_build_object(
      'sq', 'rezervoni me lehte.',
      'en', 'book with ease.',
      'de', 'einfach buchen.'
    ),
    'subtitle', jsonb_build_object(
      'sq', 'Qindra automjete premium nga kompanite me te besueshme ne Kosove, Shqiperi dhe Maqedoni te Veriut.',
      'en', 'Hundreds of premium vehicles from trusted companies across Kosovo, Albania and North Macedonia.',
      'de', 'Hunderte Premium-Fahrzeuge von vertrauenswürdigen Anbietern im Kosovo, in Albanien und Nordmazedonien.'
    ),
    'search_label_city', jsonb_build_object(
      'sq', 'Ku deshironi te udhetoni?',
      'en', 'Where would you like to travel?',
      'de', 'Wohin möchten Sie reisen?'
    ),
    'search_label_pickup', jsonb_build_object(
      'sq', 'Data e marrjes',
      'en', 'Pick-up date',
      'de', 'Abholdatum'
    ),
    'search_label_return', jsonb_build_object(
      'sq', 'Data e kthimit',
      'en', 'Return date',
      'de', 'Rückgabedatum'
    ),
    'search_button_text', jsonb_build_object(
      'sq', 'Kerko',
      'en', 'Search',
      'de', 'Suchen'
    ),
    'trust_badge_1', jsonb_build_object(
      'sq', 'Anulim falas',
      'en', 'Free cancellation',
      'de', 'Kostenlose Stornierung'
    ),
    'trust_badge_2', jsonb_build_object(
      'sq', 'Sigurim i plote',
      'en', 'Full insurance',
      'de', 'Vollkaskoversicherung'
    ),
    'trust_badge_3', jsonb_build_object(
      'sq', 'Konfirmim i shpejte',
      'en', 'Fast confirmation',
      'de', 'Schnelle Bestätigung'
    ),
    'trust_badge_4', jsonb_build_object(
      'sq', 'Mbeshtetje 24/7',
      'en', '24/7 support',
      'de', '24/7 Support'
    )
  )
WHERE key = 'hero';

UPDATE homepage_settings
SET value = value
  || jsonb_build_object(
    'vehicles_link_text', jsonb_build_object(
      'sq', 'Automjetet',
      'en', 'Vehicles',
      'de', 'Fahrzeuge'
    ),
    'login_button_text', jsonb_build_object(
      'sq', 'Kycu',
      'en', 'Sign in',
      'de', 'Anmelden'
    ),
    'register_button_text', jsonb_build_object(
      'sq', 'Regjistrohu',
      'en', 'Sign up',
      'de', 'Registrieren'
    )
  )
WHERE key = 'navbar';

UPDATE homepage_settings
SET value = value
  || jsonb_build_object(
    'categories_title', jsonb_build_object(
      'sq', 'Zgjidhni kategorine qe ju pershtatet',
      'en', 'Choose the category that suits you',
      'de', 'Wählen Sie die Kategorie, die zu Ihnen passt'
    ),
    'categories_subtitle', jsonb_build_object(
      'sq', 'Kategorite',
      'en', 'Categories',
      'de', 'Kategorien'
    ),
    'featured_title', jsonb_build_object(
      'sq', 'Automjete te rekomanduara',
      'en', 'Recommended vehicles',
      'de', 'Empfohlene Fahrzeuge'
    ),
    'featured_subtitle', jsonb_build_object(
      'sq', 'Te zgjedhura',
      'en', 'Featured',
      'de', 'Empfohlen'
    )
  )
WHERE key = 'sections';
