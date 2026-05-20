import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Building2 } from 'lucide-react';
import HowItWorks from '../components/home/HowItWorks';
import Testimonials from '../components/home/Testimonials';
import PricingSection from '../components/home/PricingSection';
import CompanyCTA from '../components/home/CompanyCTA';
import TrustBanner from '../components/home/TrustBanner';

/**
 * Faqe dedikuar per informacionet rreth platformes:
 *  - Si funksionon RentaKar
 *  - Cmoftit dhe abonimet (per kompani)
 *  - Deshmi te perdoruesve
 *  - CTA per kompani
 *  - Trust banner
 *
 * Vizituesit qe vetem kerkojne nje vetur shkojne direkt te /automjetet,
 * keta lexime me te thelle jane per ata qe duan te dine me shume.
 */
export default function AboutPlatformPage() {
  const { t } = useTranslation();

  return (
    <div>
      <Helmet>
        <title>Për Platformën — RentaKar</title>
        <meta name="description" content="Mëso si funksionon RentaKar — platforma kryesore e qirasë së automjeteve në Kosovë, Shqipëri dhe Maqedoni. Çmime, abonime për kompani, dhe çfarë thonë klientët." />
        <link rel="canonical" href="https://rentcars.life/per-platformen" />
      </Helmet>

      {/* Page header — minimal, klasik */}
      <section className="bg-gray-50 border-b border-gray-200 pt-32 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold text-primary-600 uppercase tracking-wide mb-2">Për platformën</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-dark-950 mb-3">
            Si funksionon RentaKar
          </h1>
          <p className="text-dark-600 max-w-2xl mx-auto">
            Platforma që lidh klientët me kompanitë më të mira të qirasë së automjeteve në Kosovë, Shqipëri dhe Maqedoni.
            Mëso si funksionon, sa kushton dhe çfarë thonë klientët.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
            <Link
              to="/automjetet"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700"
            >
              {t('common.viewAll')}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/regjistrohu?role=company"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-white text-dark-900 text-sm font-semibold border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Building2 className="w-4 h-4" />
              Regjistro kompaninë
            </Link>
          </div>
        </div>
      </section>

      {/* Si funksionon (3-4 hapa) */}
      <HowItWorks />

      {/* Cmoftit dhe abonimet */}
      <PricingSection />

      {/* Deshmi klientesh */}
      <Testimonials />

      {/* CTA per kompani */}
      <CompanyCTA />

      {/* Trust banner */}
      <TrustBanner />
    </div>
  );
}
