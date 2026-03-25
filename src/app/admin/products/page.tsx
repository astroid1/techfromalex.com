"use client";

import { useState, useMemo } from "react";
import { products } from "@/data/products";

export default function ProductsPage() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Products</h1>
          <p className="text-sm text-muted">{products.length} products in catalog</p>
        </div>
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search products..."
        className="w-full max-w-md rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent"
      />

      {/* Product Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((product) => (
          <div key={product.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted">{product.brand}</p>
                <h3 className="font-medium text-foreground">{product.name}</h3>
              </div>
              {product.price && (
                <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                  ${product.price}
                </span>
              )}
            </div>

            <p className="mt-2 text-xs text-muted">{product.category}</p>

            {product.rating && (
              <div className="mt-2 flex items-center gap-1">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill={star <= Math.round(product.rating!) ? "currentColor" : "none"}
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className={star <= Math.round(product.rating!) ? "text-warning" : "text-border"}
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>
                <span className="text-xs text-muted">{product.rating}/5</span>
              </div>
            )}

            {/* Affiliate Links */}
            <div className="mt-3 flex flex-wrap gap-1">
              {product.links.map((link) => (
                <span
                  key={link.program}
                  className="rounded bg-card-hover px-1.5 py-0.5 text-[10px] text-muted-foreground"
                >
                  {link.program}
                </span>
              ))}
            </div>

            {/* Specs preview */}
            {product.specs && (
              <div className="mt-3 space-y-1">
                {Object.entries(product.specs).slice(0, 3).map(([key, val]) => (
                  <div key={key} className="flex justify-between text-xs">
                    <span className="text-muted">{key}</span>
                    <span className="text-muted-foreground">{val}</span>
                  </div>
                ))}
                {Object.keys(product.specs).length > 3 && (
                  <p className="text-[10px] text-muted">+{Object.keys(product.specs).length - 3} more specs</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
