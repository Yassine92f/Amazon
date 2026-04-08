/**
 * Lightweight, framework-free internationalization for the client.
 *
 * The app currently ships a single locale (French). All user-facing copy lives
 * here so the UI never mixes languages and so strings are reused, not retyped.
 * Access strings through the exported `t` object (e.g. `t.home.heroTitle`).
 * Strings that need runtime values are exposed as small formatter functions.
 *
 * When a second locale is needed, turn `t` into a record keyed by locale and
 * resolve it from a context/provider — every call site already reads from `t`.
 */

const LOCALE = 'fr-FR';
const CURRENCY = 'EUR';

/* ── Format helpers ──────────────────────────────────────────────── */

const priceFormatter = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: CURRENCY,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat(LOCALE);

/** Formats a numeric amount as a localized price (e.g. `279,00 €`). */
export function formatPrice(value: number): string {
  return priceFormatter.format(value);
}

/** Formats an integer with locale grouping (e.g. `4 828`). */
export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

/** Formats an ISO date as `month year` (e.g. `mai 2026`). */
export function formatMonthYear(iso: string): string {
  return new Date(iso).toLocaleDateString(LOCALE, { month: 'long', year: 'numeric' });
}

/** Formats an ISO date as `day month year` (e.g. `28 mai 2026`). */
export function formatLongDate(iso: string): string {
  return new Date(iso).toLocaleDateString(LOCALE, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/* ── Translation dictionary ──────────────────────────────────────── */

export const t = {
  common: {
    loading: 'Chargement…',
    backHome: "Retour à l'accueil",
    viewAll: 'Tout voir',
    soon: 'Bientôt',
    currency: '€ EUR',
    language: '🇫🇷 Français',
  },

  header: {
    announcement: "SOLDES DE PRINTEMPS — jusqu'à -50 % sur plus de 10 000 articles",
    announcementCta: "J'en profite",
    searchPlaceholder: 'Rechercher des produits, des marques et plus…',
    search: 'Rechercher',
    login: 'Connexion',
    register: "S'inscrire",
    wishlist: 'Favoris',
    admin: 'Administration',
    myProfile: 'Mon profil',
    sellerHub: 'Espace vendeur',
    becomeSeller: 'Devenir vendeur',
    logout: 'Se déconnecter',
  },

  // Static category pills in the top navigation.
  categories: {
    deals: 'Promos',
    electronics: 'Électronique',
    fashion: 'Mode',
    homeGarden: 'Maison & Jardin',
    sports: 'Sport',
    books: 'Livres',
    grocery: 'Épicerie',
    beauty: 'Beauté',
    gaming: 'Gaming',
    pets: 'Animaux',
  },

  mobileTab: {
    home: 'Accueil',
    browse: 'Parcourir',
    deals: 'Promos',
    wishlist: 'Favoris',
    profile: 'Profil',
  },

  home: {
    heroEyebrow: '✨ Collection Printemps 2026',
    heroTitle: 'Trouvez tout ce que vous aimez',
    heroSubtitle:
      'Des millions de produits proposés par des vendeurs de confiance. Livraison offerte dès 29 €.',
    heroShopSale: 'Profiter des soldes',
    heroNewArrivals: 'Nouveautés',
    sideNewInTech: 'Nouveau high-tech',
    sideTrending: 'Tendance',
    sideFrom: (price: string) => `À partir de ${price}`,
    flashDeals: '⚡ Ventes flash',
    endsIn: 'Se termine dans',
    shopByCategory: 'Acheter par catégorie',
    browseAll: 'Tout parcourir',
    trendingNow: '🔥 Tendances du moment',
    newArrivals: '✨ Nouveautés',
    emptyProducts: 'Aucun produit à afficher pour le moment.',
    emptyCategories: 'Aucune catégorie pour le moment.',
    promoTitle: 'Téléchargez notre application — 10 € offerts sur votre première commande !',
    promoSubtitle: 'Utilisez le code HELLO10 au paiement. Réservé aux nouveaux clients.',
    promoCta: "Obtenir l'application",
    trust: {
      shippingTitle: 'Livraison offerte',
      shippingDesc: 'Dès 29 € d’achat',
      paymentTitle: 'Paiement sécurisé',
      paymentDesc: 'Chiffrement SSL 256 bits',
      returnsTitle: 'Retours faciles',
      returnsDesc: 'Retour sous 30 jours',
      supportTitle: 'Support 24/7',
      supportDesc: 'Chat, e-mail & téléphone',
    },
  },

  footer: {
    tagline:
      'Votre marketplace de confiance pour des millions de produits vendus par des vendeurs vérifiés.',
    shop: 'Boutique',
    allProducts: 'Tous les produits',
    sellers: 'Vendeurs',
    company: 'Entreprise',
    legal: 'Mentions légales',
    becomeSeller: 'Devenir vendeur',
    sellerHub: 'Espace vendeur',
    about: 'À propos',
    careers: 'Carrières',
    press: 'Presse',
    privacy: 'Politique de confidentialité',
    terms: "Conditions d'utilisation",
    rights: '© 2026 Abracadabra — Tous droits réservés.',
  },

  catalog: {
    breadcrumbHome: 'Accueil',
    allProducts: 'Tous les produits',
    searchResults: 'Résultats de recherche',
    productCount: (n: number) => `${formatNumber(n)} produit${n > 1 ? 's' : ''}`,
    sortPrefix: 'Trier',
    sort: {
      relevance: 'Pertinence',
      price: 'Prix',
      rating: 'Note des clients',
      totalSold: 'Meilleures ventes',
      createdAt: 'Nouveautés',
    },
    activeFilters: 'Filtres actifs :',
    clearAll: 'Tout effacer',
    inStock: 'En stock',
    ratingAndUp: (stars: number) => `${stars}★ et plus`,
    loadError: 'Impossible de charger les produits',
    emptyTitle: 'Aucun produit trouvé',
    emptyDesc: 'Essayez d’ajuster vos filtres ou de parcourir une autre catégorie.',
    categoryNotFound: 'Catégorie introuvable',
    categoryNotFoundDesc: "Cette catégorie n'existe pas ou est inactive.",
    category: 'Catégorie',
  },

  filters: {
    title: 'Filtres',
    reset: 'Réinitialiser',
    category: 'Catégorie',
    price: 'Prix',
    min: 'Min',
    max: 'Max',
    brand: 'Marque',
    customerRating: 'Note des clients',
    andUp: 'et plus',
    availability: 'Disponibilité',
    inStockOnly: 'En stock uniquement',
  },

  product: {
    breadcrumbHome: 'Accueil',
    notFound: 'Produit introuvable',
    inStock: 'En stock',
    readyToShip: '— prêt à expédier',
    outOfStock: 'En rupture de stock',
    save: (amount: string) => `Économisez ${amount}`,
    variant: 'Variante',
    outShort: '— épuisé',
    addToCart: 'Ajouter au panier',
    cartComingSoon: 'Le panier arrive dans la prochaine version (feature/cart-orders).',
    soldBy: 'Vendu par',
    visitShop: 'Voir la boutique →',
    description: 'Description',
    customerReviews: 'Avis clients',
  },

  card: {
    outOfStock: 'Épuisé',
  },

  reviews: {
    loading: 'Chargement des avis…',
    empty: 'Aucun avis pour le moment — soyez le premier à partager votre expérience.',
    outOf5: 'sur 5',
    sellerResponse: 'Réponse du vendeur',
  },

  shop: {
    breadcrumbHome: 'Accueil',
    breadcrumbShops: 'Boutiques',
    notFound: 'Boutique introuvable',
    verified: 'Vérifié',
    memberSince: (date: string) => `Membre depuis ${date}`,
    statSales: 'Ventes',
    statRating: 'Note',
    statProducts: 'Produits',
    statReviews: 'Avis',
    about: 'À propos de la boutique',
    products: 'Produits',
    loadingProducts: 'Chargement des produits…',
    noProducts: "Cette boutique n'a pas encore publié de produits.",
  },

  becomeSeller: {
    eyebrow: 'Espace vendeur',
    title: 'Ouvrez votre boutique',
    subtitle:
      'Devenez vendeur sur Abracadabra et mettez vos produits en ligne en quelques minutes.',
    registerError: 'Échec de la création de la boutique',
    shopName: 'Nom de la boutique',
    shopNamePlaceholder: 'AudioVault Premium',
    description: 'Description',
    optional: '(facultatif)',
    descriptionPlaceholder:
      'Présentez votre boutique : ce que vous vendez, vos engagements de livraison…',
    creating: 'Création de la boutique…',
    create: 'Créer la boutique',
    termsPrefix: 'En créant une boutique, vous acceptez les ',
    terms: 'conditions vendeur',
    successTitle: 'Boutique créée',
    successDesc:
      'Votre compte est désormais vendeur. Reconnectez-vous pour que votre jeton reflète le nouveau rôle.',
    successCta: 'Se déconnecter et se reconnecter',
  },

  seller: {
    hub: 'Espace vendeur',
    backToMarketplace: '← Retour à la marketplace',
    dashboard: 'Tableau de bord',
    products: 'Produits',
    orders: 'Commandes',
    reviews: 'Avis',
    settings: 'Paramètres',
    footerHub: '© 2026 Abracadabra — Espace vendeur',
    policies: 'Conditions vendeur',
    fees: 'Commissions',
    support: 'Support',
  },
} as const;

export type Translations = typeof t;
