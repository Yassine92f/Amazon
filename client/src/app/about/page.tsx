import type { Metadata } from 'next';
import Link from 'next/link';
import InfoPage from '../../components/InfoPage';

export const metadata: Metadata = { title: 'À propos — Abracadabra' };

export default function AboutPage() {
  return (
    <InfoPage
      title="À propos d’Abracadabra"
      intro="Abracadabra est une marketplace qui met en relation des millions d’acheteurs avec des vendeurs vérifiés, partout en France."
    >
      <section>
        <h2>Notre mission</h2>
        <p>
          Rendre le commerce en ligne simple, sûr et accessible à tous. Nous sélectionnons des
          vendeurs de confiance et garantissons des transactions sécurisées de bout en bout, du
          panier jusqu’à la livraison.
        </p>
      </section>
      <section>
        <h2>Ce qui nous anime</h2>
        <p>
          La satisfaction client est au cœur de chaque décision : prix justes, descriptions fiables,
          livraison rapide et un service réactif. Chaque produit publié sur la plateforme répond à
          nos exigences de qualité.
        </p>
      </section>
      <section>
        <h2>Vendre sur Abracadabra</h2>
        <p>
          Vous êtes une marque ou un commerçant ? Rejoignez des milliers de vendeurs et développez
          votre activité. Découvrez comment <Link href="/become-seller">devenir vendeur</Link>.
        </p>
      </section>
    </InfoPage>
  );
}
