import { LegalDocumentLayout, LegalSection } from "@/components/marketing/legal-document-layout";
import { marketingPageMetadata } from "@/lib/marketing/seo";

export const metadata = marketingPageMetadata({
  title: "Política de Privacidad",
  description:
    "Cómo Menulia recopila, protege y trata los datos de cuentas y menús digitales conforme al RGPD.",
  path: "/privacy",
});

const LAST_UPDATED = "July 10, 2026";

export default function PrivacyPolicyPage() {
  return (
    <LegalDocumentLayout title="Política de Privacidad" lastUpdated={LAST_UPDATED}>
      <p className="text-[15px] leading-7 text-slate-600">
        Menulia (menulia.net) es una plataforma de software en la nube para la gestión y
        visualización de menús digitales en el sector de la hostelería. Esta Política de Privacidad
        explica qué datos tratamos, con qué finalidad y qué derechos le asisten conforme al
        Reglamento General de Protección de Datos (RGPD).
      </p>

      <LegalSection number={1} title="Responsable del tratamiento">
        <p>
          Responsable: <strong className="font-semibold text-slate-800">Menulia</strong>
        </p>
        <p>
          Contacto de privacidad:{" "}
          <a href="mailto:soporte@menulia.net" className="air-link">
            soporte@menulia.net
          </a>
        </p>
        <p>
          Menulia trata los datos personales estrictamente para mantener cuentas de usuario,
          permitir la gestión de restaurantes y mostrar menús digitales a los clientes finales de
          cada establecimiento.
        </p>
      </LegalSection>

      <LegalSection number={2} title="Datos que tratamos">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="font-semibold text-slate-800">Datos de cuenta</strong> — dirección
            de correo electrónico, nombre de usuario y credenciales de acceso gestionadas a través
            de nuestro proveedor de autenticación.
          </li>
          <li>
            <strong className="font-semibold text-slate-800">Datos de restaurante y menú</strong> —
            nombres comerciales, branding, categorías, platos, precios, imágenes, alérgenos,
            horarios y datos de contacto configurados en el panel de control.
          </li>
          <li>
            <strong className="font-semibold text-slate-800">Datos técnicos</strong> — registros
            básicos de uso, tipo de dispositivo y navegador necesarios para garantizar la seguridad
            y el correcto funcionamiento del servicio.
          </li>
        </ul>
      </LegalSection>

      <LegalSection number={3} title="Finalidad y base legal">
        <p>
          Tratamos los datos para prestar el servicio contratado, autenticar usuarios, almacenar
          contenido de menús, publicar la carta digital y mantener la seguridad de la plataforma.
          La base legal principal es la ejecución del contrato de servicios y, cuando proceda, el
          interés legítimo en proteger la infraestructura y mejorar la fiabilidad del producto.
        </p>
      </LegalSection>

      <LegalSection number={4} title="Alojamiento y seguridad">
        <p>
          Todos los datos de usuario se alojan de forma segura en servidores en la nube ubicados
          dentro de la Unión Europea (UE), bajo marcos estrictos de cumplimiento del RGPD y medidas
          técnicas y organizativas adecuadas.
        </p>
        <p>
          Aplicamos cifrado en tránsito, controles de acceso restringidos y prácticas de
          autenticación conforme a estándares del sector para proteger la confidencialidad e
          integridad de la información.
        </p>
      </LegalSection>

      <LegalSection number={5} title="Encargados y terceros">
        <p>
          Utilizamos proveedores de confianza para operar la plataforma, incluidos servicios de
          autenticación, base de datos, almacenamiento de archivos y, cuando corresponda, analítica
          o traducción. Estos proveedores tratan los datos únicamente siguiendo nuestras
          instrucciones y con las garantías contractuales exigidas por el RGPD.
        </p>
      </LegalSection>

      <LegalSection number={6} title="Sus derechos">
        <p>
          Puede solicitar acceso, rectificación, supresión, limitación, portabilidad u oposición al
          tratamiento de sus datos personales, así como presentar una reclamación ante la
          autoridad de control competente.
        </p>
        <p>
          Para ejercer sus derechos, contacte con{" "}
          <a href="mailto:soporte@menulia.net" className="air-link">
            soporte@menulia.net
          </a>
          .
        </p>
      </LegalSection>
    </LegalDocumentLayout>
  );
}
