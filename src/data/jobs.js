// Demo / placeholder content dynamically scaled for pagination testing (25 items).
// These are placeholder mock data items - replace with real data when needed.

const baseJobs = [
  {
    id: 'job-001',
    title: 'Haryana Police Constable Recruitment 2026',
    titleHindi: 'हरियाणा पुलिस कांस्टेबल भर्ती 2026',
    department: 'Haryana Police',
    departmentHindi: 'हरियाणा पुलिस',
    publishedDate: '18 August 2026',
    lastDate: '15 September 2026',
    vacancies: 1200,
    description:
      'हरियाणा पुलिस में कांस्टेबल के पदों पर सीधी भर्ती हेतु ऑनलाइन आवेदन आमंत्रित किए जाते हैं।',
    pdf: '/pdfs/jobs/job-001.pdf',
  },
  {
    id: 'job-002',
    title: 'Haryana Staff Selection Commission — Clerk Recruitment',
    titleHindi: 'हरियाणा कर्मचारी चयन आयोग — क्लर्क भर्ती',
    department: 'HSSC',
    departmentHindi: 'हरियाणा कर्मचारी चयन आयोग',
    publishedDate: '10 August 2026',
    lastDate: '05 September 2026',
    vacancies: 450,
    description:
      'विभिन्न सरकारी विभागों में क्लर्क पदों हेतु HSSC द्वारा भर्ती प्रक्रिया आरंभ की गई है।',
    pdf: '/pdfs/jobs/job-002.pdf',
  },
  {
    id: 'job-003',
    title: 'Health Department — Staff Nurse Recruitment',
    titleHindi: 'स्वास्थ्य विभाग — स्टाफ नर्स भर्ती',
    department: 'Health Department',
    departmentHindi: 'स्वास्थ्य विभाग',
    publishedDate: '05 August 2026',
    lastDate: '28 August 2026',
    vacancies: 310,
    description:
      'राज्य के जिला अस्पतालों एवं स्वास्थ्य केंद्रों में स्टाफ नर्स के पदों हेतु भर्ती अधिसूचना।',
    pdf: '/pdfs/jobs/job-003.pdf',
  },
  {
    id: 'job-004',
    title: 'Education Department — TGT Teacher Recruitment',
    titleHindi: 'शिक्षा विभाग — TGT अध्यापक भर्ती',
    department: 'Education Department',
    departmentHindi: 'शिक्षा विभाग',
    publishedDate: '29 July 2026',
    lastDate: '22 August 2026',
    vacancies: 980,
    description:
      'राजकीय विद्यालयों में TGT अध्यापकों के रिक्त पदों को भरने हेतु भर्ती प्रक्रिया शुरू।',
    pdf: '/pdfs/jobs/job-004.pdf',
  },
  {
    id: 'job-005',
    title: 'Forest Department — Forest Guard Recruitment',
    titleHindi: 'वन विभाग — वन रक्षक भर्ती',
    department: 'Forest Department',
    departmentHindi: 'वन विभाग',
    publishedDate: '20 July 2026',
    lastDate: '10 August 2026',
    vacancies: 150,
    description:
      'राज्य के विभिन्न वनों में वन रक्षक पद हेतु सीधी भर्ती की अधिसूचना जारी।',
    pdf: '/pdfs/jobs/job-005.pdf',
  },
  {
    id: 'job-006',
    title: 'Finance Department — Junior Accountant Recruitment',
    titleHindi: 'वित्त विभाग — कनिष्ठ लेखाकार भर्ती',
    department: 'Finance Department',
    departmentHindi: 'वित्त विभाग',
    publishedDate: '12 July 2026',
    lastDate: '02 August 2026',
    vacancies: 220,
    description:
      'राज्य वित्त विभाग के अंतर्गत कनिष्ठ लेखाकार पदों पर भर्ती हेतु ऑनलाइन आवेदन आमंत्रित।',
    pdf: '/pdfs/jobs/job-006.pdf',
  },
];

const jobs = [];
for (let i = 0; i < 25; i++) {
  const base = baseJobs[i % baseJobs.length];
  jobs.push({
    ...base,
    id: `job-gen-${i + 1}`,
    titleHindi: `${base.titleHindi} (क्रम संख्या #${i + 1})`,
    vacancies: base.vacancies + (i * 5),
  });
}

export default jobs;
