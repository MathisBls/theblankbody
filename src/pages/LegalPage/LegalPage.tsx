import { useEffect } from 'react';
import { Link } from 'wouter';
import { ChevronIcon } from '../../components/ChevronIcon/ChevronIcon';
import { EXTERNAL_LINKS, SECTION_IDS } from '../../config/links';
import { ROUTES } from '../../config/routes';
import { translate } from '../../i18n';
import type { LegalDocument } from './legalDocuments';
import './LegalPage.css';

const TITLE_ID = 'legal-title';
const CONTACT_HREF = `mailto:${EXTERNAL_LINKS.contactEmail}`;

export interface LegalPageProps {
  document: LegalDocument;
}

function buildLegalViewModel(legalDocument: LegalDocument) {
  let sectionNumber = 0;
  const title = translate(legalDocument.titleKey);
  return {
    title,
    pageTitle: translate('legal.pageTitle', { title }),
    lastUpdated: translate('legal.lastUpdated', { date: translate('legal.updatedOn') }),
    backHomeLabel: translate('legal.backHome'),
    newTabHint: translate('common.opensInNewTab'),
    contactLead: translate('legal.contactLead'),
    sections: legalDocument.sections.map((section) => {
      if (section.isNumbered) sectionNumber += 1;
      return {
        id: section.id,
        headingId: `legal-${section.id}`,
        number: section.isNumbered ? String(sectionNumber) : null,
        title: translate(section.titleKey),
        paragraphs: section.paragraphKeys.map((key) => ({ key, text: translate(key) })),
        links: (section.links ?? []).map((link) => ({ href: link.href, label: translate(link.labelKey) })),
        isContact: section.isContact === true,
      };
    }),
  };
}

export function LegalPage({ document: legalDocument }: LegalPageProps) {
  const viewModel = buildLegalViewModel(legalDocument);
  const { pageTitle } = viewModel;

  useEffect(() => {
    const previousTitle = document.title;
    document.title = pageTitle;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    return () => {
      document.title = previousTitle;
    };
  }, [pageTitle]);

  return (
    <main id={SECTION_IDS.mainContent} className="legal-page" aria-labelledby={TITLE_ID}>
      <div className="container legal-page__inner">
        <Link className="legal-page__back" href={ROUTES.home}>
          <ChevronIcon isPointingLeft /> {viewModel.backHomeLabel}
        </Link>

        <header className="legal-page__header">
          <h1 id={TITLE_ID} className="legal-page__title">
            {viewModel.title}
          </h1>
          <p className="legal-page__updated">{viewModel.lastUpdated}</p>
        </header>

        <div className="legal-page__sections">
          {viewModel.sections.map((section) => (
            <section key={section.id} id={section.id} className="legal-section" aria-labelledby={section.headingId}>
              <h2 id={section.headingId} className="legal-section__title">
                {section.number && <span className="legal-section__number">{section.number}</span>}
                {section.title}
              </h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph.key} className="legal-section__text">
                  {paragraph.text}
                </p>
              ))}
              {section.links.length > 0 && (
                <ul className="legal-section__links">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <a href={link.href} target="_blank" rel="noopener noreferrer">
                        {link.label}
                        <span className="visually-hidden"> {viewModel.newTabHint}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
              {section.isContact && (
                <p className="legal-section__text">
                  {viewModel.contactLead}{' '}
                  <a className="legal-section__email" href={CONTACT_HREF}>
                    {EXTERNAL_LINKS.contactEmail}
                  </a>
                </p>
              )}
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
