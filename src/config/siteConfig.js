// Central place to edit contact details, brand name, and footer info.
// Update this file whenever office/contact information changes —
// nothing else in the codebase needs to change.

export const siteConfig = {
  name: 'Haryana Info Hub',
  nameHindi: 'हरियाणा इन्फो हब',
  companyName: 'Haryana Info Hub Group',
  version: 'v2.1.0',
  tagline: 'हरियाणा सरकार के नियम व निर्देश',
  subTagline: 'सही जानकारी, समय पर आपके लिए',
  description:
    'हरियाणा सरकार से संबंधित महत्वपूर्ण नियम, निर्देश, सरकारी आदेश, नौकरियां, योजनाएं और विभागीय जानकारी एक ही स्थान पर।',

  email: 'contact@haryanainfohub.example.in',
  phone: '+91 00000 00000',
  address: 'सेक्टर 5, पंचकूला, हरियाणा - 134109',

  developedBy: 'GoDude Software Pvt Ltd.',
  developedByUrl: '#',

  facebookUrl: 'https://facebook.com',
  whatsappUrl: 'https://wa.me/910000000000',
  twitterUrl: 'https://x.com',

  officeHours: 'सोमवार – शनिवार | 10:00 AM – 06:00 PM',

  importantLinks: [
    { title: 'हरियाणा सरकार', url: 'https://haryana.gov.in' },
    { title: 'हरियाणा ई-सेवा', url: 'https://saralharyana.gov.in' },
    { title: 'हरियाणा रोजगार पोर्टल', url: 'https://hrex.gov.in' },
    { title: 'सूचना का अधिकार (RTI)', url: 'https://rtiharyana.gov.in' },
    { title: 'नागरिक सेवाएं', url: 'https://haryana.gov.in/services' },
    { title: 'डाउनलोड केंद्र', url: 'https://haryana.gov.in/downloads' },
  ],

  year: new Date().getFullYear(),

  logoPath: '/logo/haryana-info-hub-logo.png',
  bannerImagePath: '/banners/main-banner.png',
};

export default siteConfig;
