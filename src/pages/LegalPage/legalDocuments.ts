import { EXTERNAL_LINKS } from '../../config/links';
import type { MessageKey } from '../../i18n';

export interface LegalLink {
  labelKey: MessageKey;
  href: string;
}

export interface LegalSection {
  id: string;
  titleKey: MessageKey;
  paragraphKeys: readonly MessageKey[];
  links?: readonly LegalLink[];
  isNumbered: boolean;
  isContact?: boolean;
}

export interface LegalDocument {
  titleKey: MessageKey;
  sections: readonly LegalSection[];
}

export const TERMS_DOCUMENT: LegalDocument = {
  titleKey: 'terms.title',
  sections: [
    { id: 'about', titleKey: 'terms.intro.title', paragraphKeys: ['terms.intro.text1', 'terms.intro.text2'], isNumbered: false },
    { id: 'use-of-the-app', titleKey: 'terms.use.title', paragraphKeys: ['terms.use.text'], isNumbered: true },
    {
      id: 'content',
      titleKey: 'terms.content.title',
      paragraphKeys: ['terms.content.text1', 'terms.content.text2'],
      isNumbered: true,
    },
    {
      id: 'tiktok',
      titleKey: 'terms.tiktok.title',
      paragraphKeys: ['terms.tiktok.text'],
      links: [
        { labelKey: 'terms.tiktok.termsLink', href: EXTERNAL_LINKS.tiktokTerms },
        { labelKey: 'terms.tiktok.guidelinesLink', href: EXTERNAL_LINKS.tiktokCommunityGuidelines },
      ],
      isNumbered: true,
    },
    { id: 'liability', titleKey: 'terms.liability.title', paragraphKeys: ['terms.liability.text'], isNumbered: true },
    { id: 'changes', titleKey: 'terms.changes.title', paragraphKeys: ['terms.changes.text'], isNumbered: true },
    { id: 'contact', titleKey: 'terms.contact.title', paragraphKeys: [], isNumbered: true, isContact: true },
  ],
};

export const PRIVACY_DOCUMENT: LegalDocument = {
  titleKey: 'privacy.title',
  sections: [
    { id: 'who-uses-the-app', titleKey: 'privacy.users.title', paragraphKeys: ['privacy.users.text'], isNumbered: true },
    { id: 'data-we-access', titleKey: 'privacy.access.title', paragraphKeys: ['privacy.access.text'], isNumbered: true },
    { id: 'storage', titleKey: 'privacy.storage.title', paragraphKeys: ['privacy.storage.text'], isNumbered: true },
    { id: 'sharing', titleKey: 'privacy.sharing.title', paragraphKeys: ['privacy.sharing.text'], isNumbered: true },
    {
      id: 'retention-and-deletion',
      titleKey: 'privacy.retention.title',
      paragraphKeys: ['privacy.retention.text'],
      isNumbered: true,
    },
    {
      id: 'website',
      titleKey: 'privacy.website.title',
      paragraphKeys: ['privacy.website.text1', 'privacy.website.text2'],
      isNumbered: true,
    },
    { id: 'contact', titleKey: 'privacy.contact.title', paragraphKeys: [], isNumbered: true, isContact: true },
  ],
};
