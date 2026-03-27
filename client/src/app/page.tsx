export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-4">E-Commerce Platform</h1>
      <p className="text-lg text-gray-600 mb-8">Stack: Next.js + Express + MongoDB + Redis</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full">
        <div className="border rounded-lg p-6 hover:border-primary-500 transition-colors">
          <h2 className="text-xl font-semibold mb-2">Section 1 — Auth & Admin</h2>
          <p className="text-gray-500 text-sm">JWT, RBAC, admin dashboard</p>
        </div>

        <div className="border rounded-lg p-6 hover:border-primary-500 transition-colors">
          <h2 className="text-xl font-semibold mb-2">Section 2 — Catalog & Search</h2>
          <p className="text-gray-500 text-sm">Products, filters, recommendations</p>
        </div>

        <div className="border rounded-lg p-6 hover:border-primary-500 transition-colors">
          <h2 className="text-xl font-semibold mb-2">Section 3 — Cart & Orders</h2>
          <p className="text-gray-500 text-sm">Checkout, Stripe, order tracking</p>
        </div>

        <div className="border rounded-lg p-6 hover:border-primary-500 transition-colors">
          <h2 className="text-xl font-semibold mb-2">Section 4 — Infra & Transversal</h2>
          <p className="text-gray-500 text-sm">Docker, CI/CD, WebSockets, Redis</p>
        </div>
      </div>
    </main>
  );
}
