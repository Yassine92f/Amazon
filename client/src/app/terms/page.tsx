import type { Metadata } from 'next';
import Link from 'next/link';
import InfoPage from '../../components/InfoPage';

export const metadata: Metadata = { title: 'Conditions d’utilisation · Abracadabra' };

export default function TermsPage() {
  return (
    <InfoPage
      title="Conditions d’utilisation"
      intro="Dernière mise à jour : 8 juin 2026. En utilisant Abracadabra, vous acceptez les conditions ci-dessous."
    >
      <section>
        <h2>Utilisation de la plateforme</h2>
        <p>
          Abracadabra est une marketplace mettant en relation acheteurs et vendeurs. Vous vous
          engagez à utiliser le service de manière licite et à fournir des informations exactes lors
          de la création de votre compte.
        </p>
      </section>
      <section>
        <h2>Commandes et paiements</h2>
        <p>
          Toute commande validée vaut engagement d’achat. Les prix sont affichés en euros, taxes
          comprises. Le paiement est sécurisé et confirmé avant l’expédition.
        </p>
      </section>
      <section>
        <h2>Conditions vendeur</h2>
        <p>
          Les vendeurs sont responsables de l’exactitude de leurs annonces, du respect des délais
          d’expédition et de la conformité des produits. Une commission s’applique sur chaque vente
          (voir <Link href="/become-seller">Devenir vendeur</Link>).
        </p>
      </section>
      <section>
        <h2>Retours et remboursements</h2>
        <p>
          Vous disposez d’un droit de rétractation de 14 jours sur la plupart des produits. Les
          remboursements sont effectués via le moyen de paiement initial.
        </p>
      </section>
    </InfoPage>
  );
}
