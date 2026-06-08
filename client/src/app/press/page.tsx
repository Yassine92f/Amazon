import type { Metadata } from 'next';
import Link from 'next/link';
import InfoPage from '../../components/InfoPage';

export const metadata: Metadata = { title: 'Presse — Abracadabra' };

export default function PressPage() {
  return (
    <InfoPage
      title="Espace presse"
      intro="Ressources et contacts pour les journalistes et les médias souhaitant parler d’Abracadabra."
    >
      <section>
        <h2>Contact presse</h2>
        <p>
          Pour toute demande d’interview, de visuels ou d’informations, contactez notre équipe via
          la page <Link href="/contact">Contact</Link>. Nous répondons sous 48 heures ouvrées.
        </p>
      </section>
      <section>
        <h2>Kit média</h2>
        <p>
          Logos, chiffres clés et éléments de marque sont disponibles sur demande. Merci de
          respecter notre charte graphique lors de toute publication.
        </p>
      </section>
    </InfoPage>
  );
}
