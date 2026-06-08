import type { Metadata } from 'next';
import Link from 'next/link';
import InfoPage from '../../components/InfoPage';

export const metadata: Metadata = { title: 'Politique de confidentialité · Abracadabra' };

export default function PrivacyPage() {
  return (
    <InfoPage
      title="Politique de confidentialité"
      intro="Dernière mise à jour : 8 juin 2026. Cette politique explique quelles données nous collectons et comment nous les utilisons."
    >
      <section>
        <h2>Données collectées</h2>
        <p>
          Nous collectons les informations que vous nous fournissez (nom, email, adresses de
          livraison) ainsi que les données nécessaires au traitement de vos commandes et paiements.
        </p>
      </section>
      <section>
        <h2>Utilisation des données</h2>
        <p>
          Vos données servent à traiter vos commandes, assurer le service client, sécuriser votre
          compte et, avec votre consentement, vous informer de nos offres. Elles ne sont jamais
          vendues à des tiers.
        </p>
      </section>
      <section>
        <h2>Paiements</h2>
        <p>
          Les paiements sont traités par notre prestataire Stripe. Nous ne stockons jamais vos
          données de carte bancaire sur nos serveurs.
        </p>
      </section>
      <section>
        <h2>Vos droits</h2>
        <p>
          Conformément au RGPD, vous disposez d’un droit d’accès, de rectification et de suppression
          de vos données. Pour exercer ces droits, contactez-nous via la page{' '}
          <Link href="/contact">Contact</Link>.
        </p>
      </section>
    </InfoPage>
  );
}
