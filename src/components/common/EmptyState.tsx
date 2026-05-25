import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  /** Ikon ne qender — psh `<Car className="w-8 h-8 text-gray-300" />` */
  icon?: ReactNode;
  /** Titulli — i shkurter, descriptive (psh "Asnje rezervim") */
  title?: string;
  /** Pershkrim shtese */
  description?: string;
  /** Teksti per butonin opsional */
  ctaLabel?: string;
  /** Path-i ku te dergohet butoni (Link react-router) */
  ctaTo?: string;
  /** Ose handler per butonin custom (psh hap modal) */
  ctaOnClick?: () => void;
  /** Variant: 'card' (default) per inside container; 'page' me padding me te madh */
  variant?: 'card' | 'page';
}

/**
 * EmptyState i ripërdorshëm per lista te zbrazeta.
 *
 * Perdorimi:
 *   <EmptyState
 *     icon={<Car className="w-10 h-10 text-gray-300" />}
 *     title="Asnje rezervim"
 *     description="Bookings tuaj do shfaqen ketu."
 *     ctaLabel="Shfleto vetura"
 *     ctaTo="/automjetet"
 *   />
 */
export default function EmptyState({
  icon,
  title,
  description,
  ctaLabel,
  ctaTo,
  ctaOnClick,
  variant = 'card',
}: EmptyStateProps) {
  const paddingClass = variant === 'page' ? 'py-16 px-6' : 'py-10 px-6';
  const showCta = ctaLabel && (ctaTo || ctaOnClick);

  return (
    <div className={`${paddingClass} text-center`}>
      {icon && <div className="mx-auto mb-3 flex justify-center">{icon}</div>}
      {title && <h3 className="text-base font-semibold text-dark-800 mb-1">{title}</h3>}
      {description && <p className="text-sm text-dark-500 mb-4 max-w-xs mx-auto">{description}</p>}
      {showCta && ctaTo && (
        <Link
          to={ctaTo}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition-colors"
        >
          {ctaLabel}
        </Link>
      )}
      {showCta && ctaOnClick && !ctaTo && (
        <button
          type="button"
          onClick={ctaOnClick}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition-colors"
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
