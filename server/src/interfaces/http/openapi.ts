/**
 * OpenAPI 3.0 specification served at /api/docs (Swagger UI) and /api/docs.json.
 * Hand-authored as a single source of truth so the contract is complete and
 * not fragmented across per-route annotations.
 */
export const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Abracadabra E-Commerce API',
    version: '1.0.0',
    description:
      'API REST de la marketplace Abracadabra (MERN + Next.js). Auth JWT, catalogue & recherche, panier, commandes, paiement Stripe, coupons, avis, vendeurs et administration.',
  },
  servers: [{ url: '/api', description: 'API base path' }],
  tags: [
    { name: 'Auth', description: 'Inscription, connexion, tokens' },
    { name: 'Users', description: 'Profil, adresses, préférences' },
    { name: 'Catalog', description: 'Produits, recherche, catégories' },
    { name: 'Reviews', description: 'Avis produits' },
    { name: 'Sellers', description: 'Boutiques' },
    { name: 'Cart', description: 'Panier (invité + connecté)' },
    { name: 'Orders', description: 'Commandes' },
    { name: 'Payments', description: 'Paiement Stripe' },
    { name: 'Coupons', description: 'Codes promo' },
    { name: 'Wishlist', description: 'Favoris' },
    { name: 'Disputes', description: 'Litiges (ouverture client, traitement admin)' },
    { name: 'Admin', description: 'Administration (RBAC admin)' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      ApiSuccess: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {},
          message: { type: 'string' },
        },
      },
      ApiError: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Resource not found' },
          errors: {
            type: 'object',
            additionalProperties: { type: 'array', items: { type: 'string' } },
          },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          total: { type: 'integer' },
          page: { type: 'integer' },
          limit: { type: 'integer' },
          totalPages: { type: 'integer' },
          hasNext: { type: 'boolean' },
          hasPrev: { type: 'boolean' },
        },
      },
      RegisterRequest: {
        type: 'object',
        required: ['email', 'password', 'firstName', 'lastName'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
      AuthResult: {
        type: 'object',
        properties: {
          user: { $ref: '#/components/schemas/User' },
          accessToken: { type: 'string' },
          refreshToken: { type: 'string' },
        },
      },
      User: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          email: { type: 'string' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          role: { type: 'string', enum: ['admin', 'seller', 'user'] },
          avatar: { type: 'string' },
        },
      },
      Product: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string' },
          slug: { type: 'string' },
          description: { type: 'string' },
          brand: { type: 'string' },
          minPrice: { type: 'number' },
          maxPrice: { type: 'number' },
          rating: { type: 'number' },
          reviewCount: { type: 'integer' },
          inStock: { type: 'boolean' },
          variants: { type: 'array', items: { $ref: '#/components/schemas/Variant' } },
        },
      },
      Variant: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string' },
          sku: { type: 'string' },
          price: { type: 'number' },
          stock: { type: 'integer' },
        },
      },
      CartItem: {
        type: 'object',
        properties: {
          productId: { type: 'string' },
          variantId: { type: 'string' },
          quantity: { type: 'integer' },
          price: { type: 'number' },
          lineTotal: { type: 'number' },
        },
      },
      Cart: {
        type: 'object',
        properties: {
          items: { type: 'array', items: { $ref: '#/components/schemas/CartItem' } },
          totalAmount: { type: 'number' },
          totalItems: { type: 'integer' },
        },
      },
      CreateOrderRequest: {
        type: 'object',
        required: ['items', 'deliveryType', 'shippingAddressId'],
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                productId: { type: 'string' },
                variantId: { type: 'string' },
                quantity: { type: 'integer' },
              },
            },
          },
          deliveryType: { type: 'string', enum: ['home', 'pickup_point'] },
          shippingAddressId: { type: 'string' },
          couponCode: { type: 'string' },
        },
      },
      Order: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          orderNumber: { type: 'string' },
          status: {
            type: 'string',
            enum: [
              'pending',
              'confirmed',
              'processing',
              'shipped',
              'delivered',
              'cancelled',
              'refunded',
            ],
          },
          subtotal: { type: 'number' },
          shippingCost: { type: 'number' },
          discountAmount: { type: 'number' },
          totalAmount: { type: 'number' },
        },
      },
      CreateReviewRequest: {
        type: 'object',
        required: ['productId', 'orderId', 'rating', 'title', 'comment'],
        properties: {
          productId: { type: 'string' },
          orderId: { type: 'string' },
          rating: { type: 'integer', minimum: 1, maximum: 5 },
          title: { type: 'string' },
          comment: { type: 'string' },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Créer un compte',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } },
          },
        },
        responses: {
          '201': {
            description: 'Compte créé',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/AuthResult' } },
            },
          },
          '409': {
            description: 'Email déjà utilisé',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
          },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Se connecter',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } },
          },
        },
        responses: {
          '200': {
            description: 'Connecté',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/AuthResult' } },
            },
          },
          '401': {
            description: 'Identifiants invalides',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
          },
          '429': { description: 'Trop de tentatives' },
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Rafraîchir les tokens (rotation)',
        security: [],
        responses: { '200': { description: 'Nouveaux tokens' } },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Utilisateur courant',
        responses: { '200': { description: 'OK' }, '401': { description: 'Non authentifié' } },
      },
    },
    '/users/addresses': {
      get: {
        tags: ['Users'],
        summary: 'Lister mes adresses',
        responses: { '200': { description: 'OK' } },
      },
      post: {
        tags: ['Users'],
        summary: 'Ajouter une adresse',
        responses: { '200': { description: 'Adresses mises à jour' } },
      },
    },
    '/products': {
      get: {
        tags: ['Catalog'],
        summary: 'Recherche produits à facettes',
        security: [],
        parameters: [
          { name: 'query', in: 'query', schema: { type: 'string' } },
          { name: 'categoryId', in: 'query', schema: { type: 'string' } },
          { name: 'brand', in: 'query', schema: { type: 'string' } },
          { name: 'minPrice', in: 'query', schema: { type: 'number' } },
          { name: 'maxPrice', in: 'query', schema: { type: 'number' } },
          { name: 'minRating', in: 'query', schema: { type: 'number' } },
          { name: 'inStock', in: 'query', schema: { type: 'boolean' } },
          {
            name: 'sortBy',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['relevance', 'price', 'rating', 'totalSold', 'createdAt'],
            },
          },
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
        ],
        responses: { '200': { description: 'Résultats + facettes' } },
      },
    },
    '/products/{slug}': {
      get: {
        tags: ['Catalog'],
        summary: 'Détail produit par slug',
        security: [],
        parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'OK',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Product' } } },
          },
          '404': { description: 'Introuvable' },
        },
      },
    },
    '/products/{productId}/reviews': {
      get: {
        tags: ['Reviews'],
        summary: 'Avis d’un produit (+ stats)',
        security: [],
        parameters: [{ name: 'productId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'OK' } },
      },
    },
    '/reviews': {
      post: {
        tags: ['Reviews'],
        summary: 'Poster un avis (commande livrée uniquement)',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/CreateReviewRequest' } },
          },
        },
        responses: {
          '201': { description: 'Avis créé' },
          '400': { description: 'Commande non livrée / produit absent' },
          '403': { description: 'Commande non possédée' },
          '409': { description: 'Avis déjà posté' },
        },
      },
    },
    '/categories': {
      get: {
        tags: ['Catalog'],
        summary: 'Lister les catégories',
        security: [],
        responses: { '200': { description: 'OK' } },
      },
    },
    '/sellers': {
      get: {
        tags: ['Sellers'],
        summary: 'Annuaire des boutiques',
        security: [],
        responses: { '200': { description: 'OK' } },
      },
    },
    '/sellers/{slug}': {
      get: {
        tags: ['Sellers'],
        summary: 'Boutique publique',
        security: [],
        parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'OK' }, '404': { description: 'Introuvable' } },
      },
    },
    '/cart': {
      get: {
        tags: ['Cart'],
        summary: 'Obtenir le panier (invité via cookie cartId)',
        security: [],
        responses: {
          '200': {
            description: 'OK',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Cart' } } },
          },
        },
      },
      delete: {
        tags: ['Cart'],
        summary: 'Vider le panier',
        security: [],
        responses: { '200': { description: 'OK' } },
      },
    },
    '/cart/items': {
      post: {
        tags: ['Cart'],
        summary: 'Ajouter un article',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['productId', 'variantId', 'quantity'],
                properties: {
                  productId: { type: 'string' },
                  variantId: { type: 'string' },
                  quantity: { type: 'integer' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Panier mis à jour' },
          '409': { description: 'Stock insuffisant' },
        },
      },
    },
    '/cart/merge': {
      post: {
        tags: ['Cart'],
        summary: 'Fusionner le panier invité après connexion',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/orders': {
      get: {
        tags: ['Orders'],
        summary: 'Mes commandes (paginées)',
        responses: { '200': { description: 'OK' } },
      },
      post: {
        tags: ['Orders'],
        summary: 'Créer une commande',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/CreateOrderRequest' } },
          },
        },
        responses: {
          '201': {
            description: 'Commande créée',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Order' } } },
          },
          '409': { description: 'Stock insuffisant' },
        },
      },
    },
    '/orders/{id}': {
      get: {
        tags: ['Orders'],
        summary: 'Détail d’une commande',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'OK' },
          '403': { description: 'Interdit' },
          '404': { description: 'Introuvable' },
        },
      },
    },
    '/orders/{id}/status': {
      patch: {
        tags: ['Orders'],
        summary: 'Mettre à jour le statut (vendeur/admin)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'OK' },
          '400': { description: 'Transition invalide' },
          '403': { description: 'Interdit' },
        },
      },
    },
    '/orders/{id}/cancel': {
      post: {
        tags: ['Orders'],
        summary: 'Annuler une commande',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'OK' } },
      },
    },
    '/orders/seller': {
      get: {
        tags: ['Orders'],
        summary: 'Commandes contenant mes produits (vendeur)',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/payments/intent': {
      post: {
        tags: ['Payments'],
        summary: 'Créer un PaymentIntent Stripe',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['orderId'],
                properties: { orderId: { type: 'string' } },
              },
            },
          },
        },
        responses: { '201': { description: 'clientSecret + paymentIntentId' } },
      },
    },
    '/payments/confirm': {
      post: {
        tags: ['Payments'],
        summary: 'Confirmer le paiement (déterministe)',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/payments/webhook': {
      post: {
        tags: ['Payments'],
        summary: 'Webhook Stripe (signature vérifiée)',
        security: [],
        responses: { '200': { description: 'received' } },
      },
    },
    '/coupons/validate': {
      post: {
        tags: ['Coupons'],
        summary: 'Valider un code promo',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['code', 'subtotal'],
                properties: { code: { type: 'string' }, subtotal: { type: 'number' } },
              },
            },
          },
        },
        responses: { '200': { description: 'Validation + remise' } },
      },
    },
    '/wishlist': {
      get: {
        tags: ['Wishlist'],
        summary: 'Mes favoris',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/disputes': {
      post: {
        tags: ['Disputes'],
        summary: 'Ouvrir un litige sur une commande (client)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['orderId', 'reason', 'description'],
                properties: {
                  orderId: { type: 'string' },
                  reason: {
                    type: 'string',
                    enum: ['not_received', 'damaged', 'wrong_item', 'not_as_described', 'other'],
                  },
                  description: { type: 'string', minLength: 10, maxLength: 2000 },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Litige créé' }, '409': { description: 'Déjà ouvert' } },
      },
      get: {
        tags: ['Disputes'],
        summary: 'Lister tous les litiges (admin, filtre ?status=)',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'OK' }, '403': { description: 'Admin requis' } },
      },
    },
    '/disputes/mine': {
      get: {
        tags: ['Disputes'],
        summary: 'Mes litiges (client)',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'OK' } },
      },
    },
    '/disputes/{id}': {
      patch: {
        tags: ['Disputes'],
        summary: 'Traiter un litige : en cours / résolu / rejeté (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: { type: 'string', enum: ['under_review', 'resolved', 'rejected'] },
                  resolution: { type: 'string', maxLength: 2000 },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Litige mis à jour' } },
      },
    },
    '/wishlist/{productId}/toggle': {
      post: {
        tags: ['Wishlist'],
        summary: 'Ajouter/retirer un favori',
        parameters: [{ name: 'productId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'OK' } },
      },
    },
    '/admin/coupons': {
      get: {
        tags: ['Admin'],
        summary: 'Lister les coupons (admin)',
        responses: { '200': { description: 'OK' } },
      },
      post: {
        tags: ['Admin'],
        summary: 'Créer un coupon (admin)',
        responses: { '201': { description: 'Créé' } },
      },
    },
    '/admin/users': {
      get: {
        tags: ['Admin'],
        summary: 'Lister les utilisateurs (admin)',
        responses: { '200': { description: 'OK' } },
      },
    },
  },
} as const;
