import type { Metadata } from 'next';
import Link from 'next/link';
import InfoPage from '../../components/InfoPage';

export const metadata: Metadata = { title: 'Contact & support — Abracadabra' };

export default function ContactPage() {
  return (
    <InfoPage
      title="Contact & support"
      intro="Une question sur une commande, un produit ou votre compte ? Nous sommes là pour vous aider."
    >
      <section>
        <h2>Service client</h2>
        <p>
          Email : <a href="mailto:support@abracadabra.example">support@abracadabra.example</a>
          <br />
          Du lundi au vendredi, de 9h à 18h. Réponse sous 24 heures ouvrées.
        </p>
      </section>
      <section>
        <h2>Suivi de commande</h2>
        <p>
          Retrouvez l’état de vos commandes à tout moment depuis votre espace{' '}
          <Link href="/orders">Mes commandes</Link>.
        </p>
      </section>
      <section>
        <h2>Vendeurs</h2>
        <p>
          Vous vendez sur Abracadabra ? Gérez vos produits et commandes depuis votre{' '}
          <Link href="/seller">espace vendeur</Link>.
        </p>
      </section>
    </InfoPage>
  );
}
