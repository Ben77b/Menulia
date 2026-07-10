import { LegalDocumentLayout, LegalSection } from "@/components/marketing/legal-document-layout";
import { marketingPageMetadata } from "@/lib/marketing/seo";

export const metadata = marketingPageMetadata({
  title: "Aviso Legal",
  description:
    "Información legal sobre Menulia, plataforma de infraestructura en la nube para la gestión de menús digitales en hostelería.",
  path: "/legal",
});

const LAST_UPDATED = "July 10, 2026";

export default function LegalNoticePage() {
  return (
    <LegalDocumentLayout title="Aviso Legal" lastUpdated={LAST_UPDATED}>
      <p className="text-[15px] leading-7 text-slate-600">
        El presente Aviso Legal regula el acceso y uso del sitio web y la plataforma operada bajo
        la marca <strong className="font-semibold text-slate-800">Menulia</strong> (menulia.net).
        Menulia es una herramienta de infraestructura de software en la nube destinada a la
        gestión digital de menús y operaciones de hostelería.
      </p>

      <LegalSection number={1} title="Titular del servicio">
        <p>
          Denominación comercial: <strong className="font-semibold text-slate-800">Menulia</strong>
        </p>
        <p>
          Canal oficial de contacto operativo:{" "}
          <a href="mailto:soporte@menulia.net" className="air-link">
            soporte@menulia.net
          </a>
        </p>
        <p>
          Menulia actúa como proveedor tecnológico de software como servicio (SaaS). No presta
          servicios de restauración ni intermedia en la relación comercial entre el establecimiento
          y sus clientes finales.
        </p>
      </LegalSection>

      <LegalSection number={2} title="Objeto y ámbito">
        <p>
          Menulia pone a disposición de restaurantes y negocios de hostelería una plataforma para
          crear, gestionar y publicar menús digitales, incluyendo contenido, diseño, traducciones y
          herramientas de visualización para clientes.
        </p>
        <p>
          El uso de la plataforma implica la aceptación de este Aviso Legal, así como de la
          Política de Privacidad y los Términos del Servicio publicados en menulia.net.
        </p>
      </LegalSection>

      <LegalSection number={3} title="Responsabilidad del usuario">
        <p>
          Cada titular de cuenta es responsable de la veracidad, legalidad y actualización de la
          información publicada en su menú digital, incluidos precios, descripciones, alérgenos y
          cualquier dato mostrado al público.
        </p>
        <p>
          Menulia no verifica de forma independiente el contenido introducido por los
          establecimientos y actúa exclusivamente como plataforma técnica de visualización.
        </p>
      </LegalSection>

      <LegalSection number={4} title="Propiedad intelectual">
        <p>
          El software, la marca Menulia, el diseño de la plataforma y los elementos propios del
          servicio son titularidad de Menulia o de sus licenciantes. Los contenidos cargados por
          cada establecimiento permanecen bajo responsabilidad y titularidad del usuario que los
          publica.
        </p>
      </LegalSection>

      <LegalSection number={5} title="Contacto">
        <p>
          Para consultas legales, operativas o de soporte relacionadas con el servicio, escríbanos
          a{" "}
          <a href="mailto:soporte@menulia.net" className="air-link">
            soporte@menulia.net
          </a>
          .
        </p>
      </LegalSection>
    </LegalDocumentLayout>
  );
}
