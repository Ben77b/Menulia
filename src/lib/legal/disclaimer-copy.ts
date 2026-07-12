import type { LegalLocale } from "./locale";

export type DisclaimerSection = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export type DisclaimerCopy = {
  metaTitle: string;
  metaDescription: string;
  title: string;
  intro: string;
  sections: DisclaimerSection[];
  contactLabel: string;
};

export const DISCLAIMER_COPY: Record<LegalLocale, DisclaimerCopy> = {
  es: {
    metaTitle: "Aviso de Alérgenos y Responsabilidad",
    metaDescription:
      "Información legal sobre alérgenos, riesgo de contaminación cruzada y limitación de responsabilidad en menús digitales Menulia.",
    title: "Aviso de Alérgenos y Responsabilidad",
    intro:
      "Este aviso aplica a la información sobre alérgenos y seguridad alimentaria mostrada en menús digitales publicados a través de Menulia (menulia.net). Léalo con atención si usted o algún comensal padece alergias o intolerancias alimentarias.",
    sections: [
      {
        title: "Naturaleza de la información",
        paragraphs: [
          "La información sobre alérgenos, ingredientes y características dietéticas de cada plato es introducida y mantenida exclusivamente por el establecimiento de hostelería titular del menú. Menulia actúa únicamente como plataforma técnica de visualización y no elabora, verifica ni certifica de forma independiente dichos datos.",
          "Los iconos, etiquetas y leyendas mostrados en el menú digital tienen carácter informativo y no sustituyen la comunicación directa con el personal del restaurante.",
        ],
      },
      {
        title: "Alérgenos y normativa aplicable",
        paragraphs: [
          "Cuando el establecimiento declara alérgenos, debe hacerlo conforme a la normativa alimentaria aplicable, incluido el Reglamento (UE) 1169/2011 relativo a la información alimentaria facilitada al consumidor y la declaración obligatoria de los 14 alérgenos de declaración obligatoria en la Unión Europea.",
          "La ausencia de un alérgeno indicado en el menú digital no garantiza que el producto esté libre de ese alérgeno ni de trazas del mismo.",
        ],
        bullets: [
          "Cereales con gluten, crustáceos, huevos, pescado, cacahuetes, soja, leche, frutos de cáscara, apio, mostaza, sésamo, dióxido de azufre y sulfitos, altramuces y moluscos.",
        ],
      },
      {
        title: "Riesgo de contaminación cruzada",
        paragraphs: [
          "Los establecimientos que operan cocinas compartidas, freidoras, planchas, utensilios o zonas de preparación comunes pueden existir riesgo de contaminación cruzada entre alimentos, incluso cuando un plato no incluye formalmente un alérgeno en su receta declarada.",
          "Menulia no dispone de información en tiempo real sobre procesos de cocina, cambios de proveedor, lotes de producción ni protocolos de higiene del establecimiento. Por ello, no puede garantizar la ausencia de trazas de alérgenos.",
        ],
      },
      {
        title: "Responsabilidad del establecimiento",
        paragraphs: [
          "El titular del restaurante o negocio de hostelería asume la responsabilidad exclusiva de la exactitud, actualización y legalidad de toda la información publicada en su menú digital, incluidos precios, descripciones, imágenes y datos de alérgenos.",
          "El personal del establecimiento debe estar preparado para atender consultas sobre alérgenos, ingredientes ocultos, adaptaciones o restricciones dietéticas antes de confirmar un pedido o servir un plato.",
        ],
      },
      {
        title: "Limitación de responsabilidad de Menulia",
        paragraphs: [
          "En la máxima medida permitida por la ley aplicable, Menulia no será responsable de reacciones alérgicas, intoxicaciones, lesiones, pérdidas económicas ni de cualquier daño derivado de información incorrecta, incompleta o desactualizada facilitada por el establecimiento o de decisiones tomadas por el consumidor basándose únicamente en el menú digital.",
          "Si existe cualquier duda sobre alérgenos, intolerancias o seguridad alimentaria, consulte siempre con el personal del establecimiento antes de consumir.",
        ],
      },
      {
        title: "Contacto",
        paragraphs: [
          "Para consultas sobre este aviso o sobre el funcionamiento de la plataforma, escríbanos a soporte@menulia.net. Las cuestiones relacionadas con alérgenos de un plato concreto deben dirigirse directamente al establecimiento donde se sirve la comida.",
        ],
      },
    ],
    contactLabel: "soporte@menulia.net",
  },
  en: {
    metaTitle: "Allergen & Liability Disclaimer",
    metaDescription:
      "Legal information about allergens, cross-contamination risk, and liability limitations on Menulia digital menus.",
    title: "Allergen & Liability Disclaimer",
    intro:
      "This notice applies to allergen and food-safety information displayed on digital menus published through Menulia (menulia.net). Please read it carefully if you or any guest has food allergies or intolerances.",
    sections: [
      {
        title: "Nature of the information",
        paragraphs: [
          "Allergen, ingredient, and dietary information for each dish is entered and maintained exclusively by the hospitality business that owns the menu. Menulia acts solely as a technical display platform and does not independently prepare, verify, or certify that data.",
          "Icons, labels, and legends shown on the digital menu are informational only and do not replace direct communication with restaurant staff.",
        ],
      },
      {
        title: "Allergens and applicable regulations",
        paragraphs: [
          "When a business declares allergens, it must do so in accordance with applicable food law, including EU Regulation 1169/2011 on food information for consumers and mandatory declaration of the 14 major allergens in the European Union.",
          "The absence of a listed allergen on the digital menu does not guarantee that the product is free from that allergen or from traces of it.",
        ],
        bullets: [
          "Cereals containing gluten, crustaceans, eggs, fish, peanuts, soybeans, milk, nuts, celery, mustard, sesame, sulphur dioxide and sulphites, lupin, and molluscs.",
        ],
      },
      {
        title: "Cross-contamination risk",
        paragraphs: [
          "Businesses operating shared kitchens, fryers, griddles, utensils, or prep areas may face cross-contamination between foods, even when a dish does not formally include an allergen in its declared recipe.",
          "Menulia does not have real-time information about kitchen processes, supplier changes, production batches, or hygiene protocols at the establishment. Therefore, it cannot guarantee the absence of allergen traces.",
        ],
      },
      {
        title: "Establishment responsibility",
        paragraphs: [
          "The restaurant or hospitality operator bears exclusive responsibility for the accuracy, timeliness, and legality of all information published on its digital menu, including prices, descriptions, images, and allergen data.",
          "Establishment staff must be prepared to answer questions about allergens, hidden ingredients, adaptations, or dietary restrictions before confirming an order or serving a dish.",
        ],
      },
      {
        title: "Limitation of Menulia liability",
        paragraphs: [
          "To the fullest extent permitted by applicable law, Menulia shall not be liable for allergic reactions, food poisoning, injury, financial loss, or any damage arising from incorrect, incomplete, or outdated information provided by the establishment, or from consumer decisions based solely on the digital menu.",
          "If there is any doubt about allergens, intolerances, or food safety, always consult establishment staff before consuming.",
        ],
      },
      {
        title: "Contact",
        paragraphs: [
          "For questions about this notice or platform operation, email soporte@menulia.net. Questions about allergens in a specific dish must be directed to the establishment where the food is served.",
        ],
      },
    ],
    contactLabel: "soporte@menulia.net",
  },
};
