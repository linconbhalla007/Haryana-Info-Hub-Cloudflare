// Demo / placeholder content dynamically scaled for pagination testing (25 items).
// These are placeholder mock data items - replace with real data when needed.

const baseOrders = [
  {
    id: "order-001",
    title: "हरियाणा शिक्षा विभाग द्वारा जारी नया आदेश",
    date: "18 August 2026",
    department: "Education Department",
    departmentHindi: "शिक्षा विभाग",
    description:
      "सरकारी एवं निजी विद्यालयों में नए शैक्षणिक सत्र से  संबंधित दिशा-निर्देशों के क्रियान्वयन हेतु आदेश जारी किया गया है।",
    orderNumber: "HR/EDU/2026/118",
    pdf: "/pdfs/govt-orders/order-001.pdf",
  },
  {
    id: "order-002",
    title: "स्वास्थ्य विभाग द्वारा जिला अस्पतालों हेतु दिशा-निर्देश",
    date: "14 August 2026",
    department: "Health Department",
    departmentHindi: "स्वास्थ्य विभाग",
    description:
      "सभी जिला अस्पतालों में आपातकालीन सेवाओं की उपलब्धता सुनिश्चित करने हेतु मानक संचालन प्रक्रिया (SOP) जारी की गई है।",
    orderNumber: "HR/HLT/2026/094",
    pdf: "/pdfs/govt-order/order-002.pdf",
  },
  {
    id: "order-003",
    title: "राजस्व विभाग: भूमि रिकॉर्ड डिजिटलीकरण आदेश",
    date: "09 August 2026",
    department: "Revenue Department",
    departmentHindi: "राजस्व विभाग",
    description:
      "सभी तहसीलों में भूमि रिकॉर्ड के पूर्ण डिजिटलीकरण की समय-सीमा एवं प्रक्रिया से संबंधित आदेश जारी।",
    orderNumber: "HR/REV/2026/072",
    pdf: "/pdfs/govt-orders/order-003.pdf",
  },
  {
    id: "order-004",
    title: "परिवहन विभाग: नई ई-चालान प्रणाली संबंधी सूचना",
    date: "02 August 2026",
    department: "Transport Department",
    departmentHindi: "परिवहन विभाग",
    description:
      "राज्यभर के सभी RTO कार्यालयों में नई ई-चालान प्रणाली लागू करने से संबंधित आधिकारिक सूचना जारी की गई है।",
    orderNumber: "HR/TRP/2026/061",
    pdf: "/pdfs/govt-orders/order-004.pdf",
  },
  {
    id: "order-005",
    title: "शहरी स्थानीय निकाय: संपत्ति कर छूट योजना आदेश",
    date: "27 July 2026",
    department: "Urban Local Bodies",
    departmentHindi: "शहरी स्थानीय निकाय",
    description:
      "समय पर संपत्ति कर भुगतान करने वाले नागरिकों हेतु विशेष छूट योजना के क्रियान्वयन से संबंधित आदेश।",
    orderNumber: "HR/ULB/2026/055",
    pdf: "/pdfs/govt-orders/order-005.pdf",
  },
  {
    id: "order-006",
    title: "कृषि विभाग: फसल बीमा पंजीकरण अवधि विस्तार",
    date: "20 July 2026",
    department: "Agriculture Department",
    departmentHindi: "कृषि विभाग",
    description:
      "प्रधानमंत्री फसल बीमा योजना के अंतर्गत पंजीकरण की अंतिम तिथि को बढ़ाए जाने संबंधी आदेश जारी किया गया है।",
    orderNumber: "HR/AGR/2026/048",
    pdf: "/pdfs/govt-orders/order-006.pdf",
  },
];

const governmentOrders = [];
for (let i = 0; i < 25; i++) {
  const base = baseOrders[i % baseOrders.length];
  governmentOrders.push({
    ...base,
    id: `order-gen-${i + 1}`,
    orderNumber: `HR/GEN/2026/${100 + i}`,
    title: `${base.title} (क्रम संख्या #${i + 1})`,
  });
}

export default governmentOrders;
