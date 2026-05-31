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
    language: 'Français',
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
    shops: 'Boutiques',
    allCategories: 'Tout parcourir',
  },

  // Category labels for the top navigation (slugs mirror the seeded catalog).
  categories: {
    electronics: 'Électronique',
    phones: 'Smartphones',
    audio: 'Audio',
    computers: 'Informatique',
    fashion: 'Mode',
    wearables: 'Objets connectés',
    home: 'Maison & Cuisine',
    sports: 'Sport',
    books: 'Livres',
    beauty: 'Beauté',
    gaming: 'Gaming',
    toys: 'Jouets',
  },

  mobileTab: {
    home: 'Accueil',
    browse: 'Parcourir',
    deals: 'Promos',
    wishlist: 'Favoris',
    profile: 'Profil',
  },

  home: {
    heroEyebrow: 'Collection Printemps 2026',
    heroTitle: 'Trouvez tout ce que vous aimez',
    heroSubtitle:
      'Des millions de produits proposés par des vendeurs de confiance. Livraison offerte dès 29 €.',
    heroShopSale: 'Profiter des soldes',
    heroNewArrivals: 'Nouveautés',
    sideNewInTech: 'Nouveau high-tech',
    sideTrending: 'Tendance',
    sideFrom: (price: string) => `À partir de ${price}`,
    flashDeals: 'Ventes flash',
    endsIn: 'Se termine dans',
    shopByCategory: 'Acheter par catégorie',
    browseAll: 'Tout parcourir',
    trendingNow: 'Tendances du moment',
    newArrivals: 'Nouveautés',
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
    allShops: 'Toutes les boutiques',
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
    readyToShip: 'Prêt à expédier',
    outOfStock: 'En rupture de stock',
    lowStock: (n: number) => `Plus que ${n} en stock — commandez vite`,
    save: (amount: string) => `Économisez ${amount}`,
    variant: 'Variante',
    outShort: '— épuisé',
    quantity: 'Quantité',
    addToCart: 'Ajouter au panier',
    cartComingSoon: 'Le panier arrive dans la prochaine version (feature/cart-orders).',
    soldBy: 'Vendu par',
    visitShop: 'Voir la boutique',
    description: 'Description',
    specs: 'Caractéristiques',
    specBrand: 'Marque',
    specCategory: 'Catégorie',
    specSku: 'Référence',
    specAvailability: 'Disponibilité',
    specSold: 'Déjà vendus',
    unitsSold: (n: string) => `${n} vendus`,
    relatedTitle: 'Vous aimerez aussi',
    customerReviews: 'Avis clients',
    // Localized labels for variant attribute keys (fallback: capitalized key).
    attr: {
      color: 'Couleur',
      storage: 'Stockage',
      capacity: 'Capacité',
      size: 'Taille',
      band: 'Bracelet',
      region: 'Région',
      material: 'Matière',
      style: 'Style',
    } as Record<string, string>,
    trust: {
      shippingTitle: 'Livraison offerte',
      shippingDesc: 'Dès 29 € d’achat',
      returnsTitle: 'Retours faciles',
      returnsDesc: 'Sous 30 jours',
      secureTitle: 'Paiement sécurisé',
      secureDesc: 'SSL 256 bits',
    },
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
    sortPrefix: 'Trier',
    sort: {
      relevance: 'Pertinence',
      totalSold: 'Meilleures ventes',
      price: 'Prix croissant',
      rating: 'Mieux notés',
      createdAt: 'Nouveautés',
    },
    share: 'Partager',
    linkCopied: 'Lien copié',
    allProducts: (n: string) => `Tous les produits (${n})`,
  },

  // Public shops directory (`/sellers`).
  shops: {
    breadcrumbHome: 'Accueil',
    title: 'Toutes les boutiques',
    subtitle: 'Découvrez les vendeurs vérifiés de la marketplace Abracadabra.',
    searchPlaceholder: 'Rechercher une boutique…',
    verifiedOnly: 'Boutiques vérifiées',
    count: (n: number) => `${formatNumber(n)} boutique${n > 1 ? 's' : ''}`,
    productsLabel: (n: string) => `${n} produits`,
    salesLabel: (n: string) => `${n} ventes`,
    visit: 'Voir la boutique',
    loadError: 'Impossible de charger les boutiques',
    emptyTitle: 'Aucune boutique trouvée',
    emptyDesc: 'Essayez de modifier votre recherche.',
  },

  // Reusable enum → French label maps (shared across admin and seller areas).
  roles: {
    admin: 'Admin',
    seller: 'Vendeur',
    user: 'Client',
  } as Record<string, string>,

  userStatus: {
    active: 'Actif',
    suspended: 'Suspendu',
    pending: 'En attente',
  } as Record<string, string>,

  admin: {
    panel: 'Administration',
    navDashboard: 'Tableau de bord',
    navUsers: 'Utilisateurs',
    navSellers: 'Vendeurs',
    navOrders: 'Commandes',
    navSettings: 'Paramètres',
    myProfile: 'Mon profil',
    dashboardTitle: 'Tableau de bord',
    overview: "Vue d'ensemble de votre plateforme",
    statUsers: 'Utilisateurs',
    statSellers: 'Vendeurs',
    statOrders: 'Commandes',
    statRevenue: 'Revenus',
    sellersRegistered: (n: string) => `${n} inscrits`,
    noOrders: 'Aucune commande',
    noRevenue: 'Aucun revenu',
    ordersTotal: (n: string) => `${n} au total`,
    revenueTotal: (n: string) => `${n} € au total`,
    newThisMonth: (n: string, trend: string) => `+${n} ce mois (${trend})`,
    recentUsers: 'Derniers utilisateurs',
    viewAll: 'Voir tout',
    colName: 'Nom',
    colEmail: 'E-mail',
    colRole: 'Rôle',
    colStatus: 'Statut',
    colRegistered: 'Inscription',
    colUser: 'Utilisateur',
    colActions: 'Actions',
    noUsers: 'Aucun utilisateur',
    usersTitle: 'Utilisateurs',
    usersCount: (n: string) => `${n} utilisateurs inscrits`,
    filterRole: 'Rôle',
    filterStatus: 'Statut',
    changeRoleTitle: 'Changer le rôle',
    changeRoleHint: 'Cliquer pour changer le rôle',
    noUsersFound: 'Aucun utilisateur trouvé',
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

    // Dashboard (`/seller`)
    dash: {
      loading: 'Chargement…',
      verified: 'Vérifié',
      meta: (rating: string, reviews: string, products: string, date: string) =>
        `${rating} · ${reviews} avis · ${products} produits · Inscrit en ${date}`,
      viewPublic: 'Voir la page publique',
      editShop: 'Modifier la boutique',
      statRevenue: "Chiffre d'affaires",
      statMonth: 'Ce mois-ci',
      statOrders: 'Commandes',
      statProducts: 'Produits',
      soon: 'Bientôt disponible',
      outOfStockHint: (n: string) => `${n} en rupture`,
      recent: 'Produits récents',
      viewAll: 'Tout voir →',
      empty: "Vous n'avez pas encore ajouté de produit.",
      addFirst: '+ Ajouter votre premier produit',
      inStock: 'En stock',
      out: 'Rupture',
      quickActions: 'Actions rapides',
      addNew: 'Ajouter un produit',
      manageProducts: 'Gérer les produits',
      visitPublic: 'Voir la boutique publique',
    },

    // Products list (`/seller/products`)
    list: {
      title: 'Produits',
      total: (n: string) => `${n} au total`,
      addNew: 'Ajouter un produit',
      searchPlaceholder: 'Rechercher par nom, marque, SKU…',
      search: 'Rechercher',
      loadError: 'Impossible de charger les produits',
      deleteError: 'Échec de la suppression du produit',
      loading: 'Chargement…',
      emptyTitle: 'Aucun produit pour le moment',
      emptyDesc: 'Commencez à lister des articles pour apparaître sur la marketplace.',
      addFirst: 'Ajouter votre premier produit',
      colProduct: 'Produit',
      colBrand: 'Marque',
      colPrice: 'Prix',
      colStock: 'Stock',
      colStatus: 'Statut',
      colActions: 'Actions',
      inStock: 'En stock',
      out: 'Rupture',
      active: 'Actif',
      viewLive: 'Voir en ligne',
      edit: 'Modifier',
      delete: 'Supprimer',
      deleteTitle: 'Supprimer le produit ?',
      deleteSuffix: 'sera définitivement supprimé. Cette action est irréversible.',
      cancel: 'Annuler',
    },

    // Shop settings (`/seller/settings`)
    shopSettings: {
      loadError: 'Impossible de charger la boutique',
      updated: 'Boutique mise à jour.',
      updateError: 'Échec de la mise à jour de la boutique',
      loading: 'Chargement…',
      title: 'Paramètres de la boutique',
      subtitle: 'Modifiez le nom, la description et les visuels de votre boutique.',
      viewPublic: 'Voir la page publique →',
      shopName: 'Nom de la boutique',
      description: 'Description',
      logoUrl: 'URL du logo',
      bannerUrl: 'URL de la bannière',
      optional: '(facultatif)',
      logoPlaceholder: 'https://cdn.exemple.com/boutique/logo.png',
      bannerPlaceholder: 'https://cdn.exemple.com/boutique/banniere.jpg',
      saving: 'Enregistrement…',
      save: 'Enregistrer les modifications',
    },

    // Product create/edit form
    form: {
      backToProducts: 'Produits',
      editTitle: 'Modifier le produit',
      newTitle: 'Nouveau produit',
      cancel: 'Annuler',
      saving: 'Enregistrement…',
      publish: 'Publier',
      saveChanges: 'Enregistrer les modifications',
      productNotFound: 'Produit introuvable',
      productNotFoundDesc: "Ce produit n'existe pas ou n'appartient pas à votre boutique.",
      loading: 'Chargement…',
      errInvalidImage: "L'image doit être une URL valide",
      errCategory: 'Choisissez une catégorie',
      errImage: 'Ajoutez au moins une image produit',
      errVariant: 'Chaque variante nécessite un nom, un SKU et un prix',
      errSave: "Échec de l'enregistrement",
      errDelete: 'Échec de la suppression',
      basicInfo: 'Informations générales',
      name: 'Nom du produit',
      namePlaceholder: 'Sony WH-1000XM5 Casque sans fil',
      description: 'Description',
      descPlaceholder: 'Décrivez le produit, ses caractéristiques, le contenu de la boîte…',
      brand: 'Marque',
      brandPlaceholder: 'ex. Sony',
      tags: 'Mots-clés',
      tagPlaceholder: 'Ajouter un mot-clé…',
      images: 'Images',
      imagesHint: '1ʳᵉ = principale',
      imagePlaceholder: 'https://cdn.exemple.com/votre-image.jpg',
      add: 'Ajouter',
      noImage: 'Aucune image — collez une URL ci-dessus.',
      main: 'Principale',
      variants: 'Variantes',
      variantsDesc: 'Différentes tailles, couleurs, configurations.',
      addVariant: 'Ajouter une variante',
      dangerTitle: 'Supprimer ce produit',
      dangerDesc: "Définitif. Retire l'annonce pour tous les acheteurs.",
      deleteProduct: 'Supprimer le produit',
      status: 'Statut',
      active: 'Actif',
      activeHint: 'Visible par les acheteurs',
      inactive: 'Inactif',
      inactiveHint: 'Masqué pour les acheteurs',
      category: 'Catégorie',
      chooseCategory: 'Choisir une catégorie…',
      tips: 'Conseils',
      tip1: 'Indiquez la marque + le modèle exact dans le nom',
      tip2: 'Ajoutez au moins 3 images (angles différents)',
      tip3: 'Renseignez le prix barré pour afficher un badge promo',
      deleteConfirmTitle: 'Supprimer ce produit ?',
      deleteConfirmSuffix: 'sera définitivement supprimé.',
      deleting: 'Suppression…',
      delete: 'Supprimer',
      variantN: (n: number) => `Variante ${n}`,
      remove: 'Retirer',
      vName: 'Nom (ex. Noir)',
      vSku: 'SKU',
      vPrice: 'Prix (€)',
      vCompare: 'Prix barré (€)',
      vStock: 'Stock',
      attributes: 'Attributs',
      attrKey: 'clé (couleur)',
      attrValue: 'valeur (noir)',
      attrAdd: 'Ajouter',
    },
  },
} as const;

export type Translations = typeof t;
