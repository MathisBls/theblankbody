import type { ComponentType } from 'react';
import { Link } from 'wouter';
import { EXTERNAL_LINKS, MEDIA_PATHS } from '../../config/links';
import { ROUTES } from '../../config/routes';
import { translate, type MessageKey } from '../../i18n';
import './Footer.css';

const LOGO_SIZE_PX = 256;
const CURRENT_YEAR = new Date().getFullYear();
const COPYRIGHT_LABEL = translate('footer.copyright', { year: CURRENT_YEAR });

function YoutubeIcon() {
  return (
    <svg className="site-footer__social-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="1.5" y="4.5" width="21" height="15" rx="4.5" className="site-footer__icon-fill" />
      <path d="M10 8.75v6.5L15.5 12z" className="site-footer__icon-mark" />
    </svg>
  );
}

function TiktokIcon() {
  return (
    <svg className="site-footer__social-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        className="site-footer__icon-fill"
        d="M14.5 2h3.2c.3 2.3 1.8 3.9 4.1 4.2v3.3c-1.5 0-2.9-.4-4.1-1.2v6.6a6.4 6.4 0 1 1-6.4-6.4c.3 0 .6 0 .9.1v3.4a3.1 3.1 0 1 0 2.3 3z"
      />
    </svg>
  );
}

interface SocialLink {
  href: string;
  labelKey: MessageKey;
  Icon: ComponentType;
}

const SOCIAL_LINKS: readonly SocialLink[] = [
  { href: EXTERNAL_LINKS.youtube, labelKey: 'footer.youtube', Icon: YoutubeIcon },
  { href: EXTERNAL_LINKS.tiktok, labelKey: 'footer.tiktok', Icon: TiktokIcon },
];

const LEGAL_LINKS = [
  { href: ROUTES.terms, label: translate('footer.terms') },
  { href: ROUTES.privacy, label: translate('footer.privacy') },
];

const SOCIAL_LINK_VIEW_MODELS = SOCIAL_LINKS.map((link) => ({ ...link, label: translate(link.labelKey) }));

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <div className="site-footer__top">
          <div className="site-footer__brand">
            <img
              className="site-footer__logo"
              src={MEDIA_PATHS.logo}
              alt={translate('common.logoAlt')}
              width={LOGO_SIZE_PX}
              height={LOGO_SIZE_PX}
              loading="lazy"
              decoding="async"
            />
            <div>
              <p className="site-footer__brand-name">{translate('meta.brand')}</p>
              <p className="site-footer__tagline">{translate('footer.tagline')}</p>
            </div>
          </div>

          <nav aria-label={translate('footer.socialLabel')}>
            <ul className="site-footer__socials">
              {SOCIAL_LINK_VIEW_MODELS.map(({ href, label, Icon }) => (
                <li key={href}>
                  <a className="site-footer__social-link" href={href} target="_blank" rel="noopener noreferrer">
                    <Icon />
                    {label}
                    <span className="visually-hidden"> {translate('common.opensInNewTab')}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="site-footer__bottom">
          <p className="site-footer__disclaimer">{translate('footer.disclaimer')}</p>
          <nav className="site-footer__legal" aria-label={translate('footer.legalLabel')}>
            {LEGAL_LINKS.map((link) => (
              <Link key={link.href} className="site-footer__legal-link" href={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>
          <p className="site-footer__copyright">{COPYRIGHT_LABEL}</p>
        </div>
      </div>
    </footer>
  );
}
