import { LegalDocumentLayout, LegalSection } from "@/components/marketing/legal-document-layout";
import { marketingPageMetadata } from "@/lib/marketing/seo";

export const metadata = marketingPageMetadata({
  title: "Términos del Servicio",
  description:
    "Condiciones de uso de Menulia, plataforma técnica de visualización de menús digitales para hostelería.",
  path: "/terms",
});

const LAST_UPDATED = "July 10, 2026";

export default function TermsOfServicePage() {
  return (
    <LegalDocumentLayout title="Términos del Servicio" lastUpdated={LAST_UPDATED}>
      <p className="text-[15px] leading-7 text-slate-600">
        Estos Términos del Servicio regulan el acceso y uso de Menulia (menulia.net). Al crear una
        cuenta o utilizar la plataforma, usted acepta quedar vinculado por estos Términos. Si no
        está de acuerdo, no utilice el servicio.
      </p>

      <LegalSection number={1} title="Naturaleza del servicio">
        <p>
          Menulia proporciona servicios técnicos de visualización y gestión de menús digitales en
          la nube para establecimientos de hostelería. El servicio se ofrece &ldquo;tal cual&rdquo;
          y &ldquo;según disponibilidad&rdquo;, sin garantías implícitas de idoneidad para un
          propósito particular.
        </p>
        <p>
          Menulia no es un restaurante, operador de alimentación ni asesor legal o sanitario. La
          plataforma facilita la publicación de contenido introducido por el titular de cada cuenta.
        </p>
      </LegalSection>

      <LegalSection number={2} title="Responsabilidad exclusiva del establecimiento">
        <p>
          El titular de la cuenta del restaurante asume el{" "}
          <strong className="font-semibold text-slate-800">
            100% de la responsabilidad exclusiva
          </strong>{" "}
          sobre la exactitud, legalidad y actualización de toda la información publicada en su menú
          digital, incluyendo de forma enunciativa pero no limitativa:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Nombres, descripciones e imágenes de los productos.</li>
          <li>Precios, impuestos aplicables y disponibilidad de los platos.</li>
          <li>
            La declaración legal de los{" "}
            <strong className="font-semibold text-slate-800">
              14 alérgenos obligatorios de la Unión Europea
            </strong>{" "}
            conforme a la normativa aplicable, incluido el Reglamento (UE) 1169/2011.
          </li>
        </ul>
        <p>
          Menulia no verifica de forma independiente el contenido del menú ni asume responsabilidad
          por errores, omisiones o incumplimientos normativos derivados de la información
          introducida por el establecimiento.
        </p>
      </LegalSection>

      <LegalSection number={3} title="Cuenta y uso aceptable">
        <p>
          Usted es responsable de mantener la confidencialidad de sus credenciales y de toda
          actividad realizada bajo su cuenta. Debe proporcionar información veraz y actualizada, y
          abstenerse de publicar contenido ilícito, engañoso, infractor de derechos de terceros o
          que pueda causar daño a los consumidores.
        </p>
      </LegalSection>

      <LegalSection number={4} title="Limitación de responsabilidad">
        <p>
          En la máxima medida permitida por la ley aplicable, Menulia no será responsable de daños
          indirectos, incidentales, especiales, consecuenciales o punitivos, ni de pérdidas de
          beneficios, ingresos, datos o reputación derivadas del uso del servicio.
        </p>
        <p>
          La responsabilidad total de Menulia por cualquier reclamación relacionada con el servicio
          se limitará al importe abonado por el usuario en los doce meses anteriores a la
          reclamación, o a 100 euros, lo que sea mayor, salvo que la ley imperativa disponga lo
          contrario.
        </p>
      </LegalSection>

      <LegalSection number={5} title="Suspensión y terminación">
        <p>
          Podemos suspender o cancelar el acceso al servicio si se incumplen estos Términos, si
          existe riesgo para la seguridad de la plataforma o si la prestación del servicio deja de
          ser viable por motivos legales u operativos. El usuario puede cancelar su cuenta en
          cualquier momento contactando con soporte.
        </p>
      </LegalSection>

      <LegalSection number={6} title="Contacto">
        <p>
          Para consultas sobre estos Términos, escríbanos a{" "}
          <a href="mailto:soporte@menulia.net" className="air-link">
            soporte@menulia.net
          </a>
          .
        </p>
      </LegalSection>
    </LegalDocumentLayout>
  );
}
