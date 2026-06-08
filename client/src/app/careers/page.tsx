import type { Metadata } from 'next';
import Link from 'next/link';
import InfoPage from '../../components/InfoPage';

export const metadata: Metadata = { title: 'Carrières — Abracadabra' };

export default function CareersPage() {
  return (
    <InfoPage
      title="Carrières"
      intro="Construisez l’avenir du e-commerce avec nous. Nous recrutons des talents curieux, rigoureux et orientés client."
    >
      <section>
        <h2>Pourquoi nous rejoindre</h2>
        <p>
          Une équipe à taille humaine, des projets à fort impact et une culture qui valorise
          l’autonomie et l’apprentissage continu. Télétravail flexible et matériel au choix.
        </p>
      </section>
      <section>
        <h2>Postes ouverts</h2>
        <p>
          Nous n’avons pas d’offre en ligne pour le moment, mais les candidatures spontanées sont
          les bienvenues. Écrivez-nous via la page <Link href="/contact">Contact</Link> en précisant
          le poste qui vous intéresse.
        </p>
      </section>
    </InfoPage>
  );
}
