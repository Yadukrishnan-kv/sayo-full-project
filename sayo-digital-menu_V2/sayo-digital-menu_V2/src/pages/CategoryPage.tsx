import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useMenuContext } from "../context/MenuContext";
import { slugify } from "@/lib/dataConverters";
import type { MenuItemData, CategoryData } from "@/lib/customerAPI";
import { DishItem } from "../components/DishItem";
import { DishModal } from "../components/DishModal";
import { Footer } from "../components/Footer";
import { AppIcon } from "../components/AppIcon";
import { useFilter } from "../context/FilterContext";

type SubCategoryPayload = {
  _id?: string;
  id?: string;
  name_en?: string;
  name_ar?: string;
  category_id?: string;
};

export const CategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { categories, menuItems, loading, error } = useMenuContext();
  
  // Find category by slug
  const category = useMemo(() => {
    if (!slug) return undefined;
    return categories.find((c) => slugify(c.name_en) === slug);
  }, [categories, slug]);

  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";
  const { highlightFilters, hiddenAllergens, clearFilters } = useFilter();

  const [query, setQuery] = useState("");
  const [activeItem, setActiveItem] = useState<MenuItemData | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [subCategoryNamesById, setSubCategoryNamesById] = useState<Map<string, string>>(new Map());

  // Get items for this category
  const items = useMemo(() => {
    if (!category) return [];
    return menuItems.filter((item) => item.category_id === category._id);
  }, [category, menuItems]);

  const itemsByClassification = useMemo(() => {
    return items.filter((item) => {
      if (query.trim()) {
        const q = query.toLowerCase();
        const nameEn = (item.name_en || "").toLowerCase();
        const nameAr = (item.name_ar || "").toLowerCase();
        const descriptionEn = (item.description_en || "").toLowerCase();
        const descriptionAr = (item.description_ar || "").toLowerCase();
        if (
          !nameEn.includes(q) &&
          !nameAr.includes(q) &&
          !descriptionEn.includes(q) &&
          !descriptionAr.includes(q)
        ) {
          return false;
        }
      }
      if (hiddenAllergens.length > 0 && item.allergens?.length) {
        if (item.allergens.some((a) => hiddenAllergens.includes(a as any))) {
          return false;
        }
      }
      if (highlightFilters.length > 0) {
        const matchesHighlight = item.tags?.some((t) => {
          return highlightFilters.includes(t as any);
        });
        if (!matchesHighlight) return false;
      }
      return true;
    });
  }, [items, query, hiddenAllergens, highlightFilters]);

  const sections = useMemo(() => {
    const bySection = new Map<string, { title: string; items: MenuItemData[] }>();
    itemsByClassification.forEach((item) => {
      const subCategoryId = (item.subcategory_id || "").trim();
      const sectionId = (item.section_id || "").trim();
      const rawSection = subCategoryId || sectionId;
      const sectionKey = rawSection || "other-items";
      const mappedSubCategoryName = subCategoryId
        ? subCategoryNamesById.get(subCategoryId)
        : undefined;
      const sectionTitle = mappedSubCategoryName || rawSection || "Other Items";

      if (!bySection.has(sectionKey)) {
        bySection.set(sectionKey, { title: sectionTitle, items: [] });
      }

      bySection.get(sectionKey)!.items.push(item);
    });

    return Array.from(bySection.entries());
  }, [itemsByClassification, subCategoryNamesById]);

  useEffect(() => {
    let isMounted = true;

    const loadSubCategories = async () => {
      try {
        const baseUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim() || "http://localhost:5000";
        const response = await fetch(`${baseUrl}/api/subcategories`);
        if (!response.ok) return;

        const payload = await response.json();
        const list: SubCategoryPayload[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
            ? payload.data
            : [];

        const mapping = new Map<string, string>();
        list.forEach((entry) => {
          const id = (entry._id || entry.id || "").trim();
          const name = ((isArabic ? entry.name_ar : entry.name_en) || entry.name_en || entry.name_ar || "").trim();
          if (!id || !name) return;

          if (!category || !entry.category_id || String(entry.category_id) === String(category._id)) {
            mapping.set(id, name);
          }
        });

        if (isMounted) setSubCategoryNamesById(mapping);
      } catch {
        if (isMounted) setSubCategoryNamesById(new Map());
      }
    };

    loadSubCategories();
    return () => {
      isMounted = false;
    };
  }, [category, isArabic]);

  useEffect(() => {
    const persistedQuery = window.sessionStorage.getItem("sayo-search-query") || "";
    setQuery(persistedQuery);
    clearFilters();

    const handleSearchQuery = (event: Event) => {
      const custom = event as CustomEvent<string>;
      const nextQuery = custom.detail ?? "";
      setQuery(nextQuery);
      window.sessionStorage.setItem("sayo-search-query", nextQuery);
    };

    window.addEventListener("sayo-search-query", handleSearchQuery as EventListener);

    return () => {
      window.removeEventListener("sayo-search-query", handleSearchQuery as EventListener);
    };
  }, [slug, clearFilters]);

  if (loading) {
    return (
      <main className="layout">
        <div className="layout__content" style={{ padding: "3rem 1rem", textAlign: "center" }}>
          <p style={{ color: "var(--color-text-secondary)" }}>{t("loading") || "Loading..."}</p>
        </div>
      </main>
    );
  }

  if (error || !category) {
    return (
      <main className="layout">
        <div className="layout__content" style={{ padding: "3rem 1rem", textAlign: "center" }}>
          <p style={{ color: "var(--color-error)" }}>
            {error ? `Error: ${error}` : "Category not found"}
          </p>
        </div>
      </main>
    );
  }

  const hasActiveFilters = highlightFilters.length > 0 || hiddenAllergens.length > 0;

  return (
    <main className="layout">
      <div className="layout__content">
      <section className="category-page__header">
        <div className="container">
          <div className="category-page__heading-block">
            <div className="category-page__heading-row">
              <header>
                <h1
                  className="heading-xl"
                  style={{ margin: "0 0 0.15rem", fontSize: "1.35rem" }}
                >
                  {(isArabic ? category.name_ar : category.name_en) || category.name_en || category.name_ar}
                </h1>
                <p
                  className="body-sm-muted"
                  style={{ margin: 0, fontSize: "0.88rem" }}
                >
                  {(isArabic ? category.description_ar : category.description_en) || category.description_en || category.description_ar}
                </p>
              </header>

              <div className="category-page__header-actions">
                <div className="category-page__view-toggle-wrap">
                  <span className="category-page__view-toggle-label">{t("changeView")}</span>
                  <div className="category-page__view-toggle" role="group" aria-label={t("viewMode")}>
                  <button
                    type="button"
                    className={`category-page__view-btn ${viewMode === "list" ? "category-page__view-btn--active" : ""}`}
                    onClick={() => setViewMode("list")}
                    title={t("listView")}
                    aria-label={t("listView")}
                    aria-pressed={viewMode === "list"}
                  >
                    <AppIcon name="viewList" size={18} strokeWidth={2} aria-hidden />
                  </button>
                  <button
                    type="button"
                    className={`category-page__view-btn ${viewMode === "grid" ? "category-page__view-btn--active" : ""}`}
                    onClick={() => setViewMode("grid")}
                    title={t("gridView")}
                    aria-label={t("gridView")}
                    aria-pressed={viewMode === "grid"}
                  >
                    <AppIcon name="viewGrid" size={18} strokeWidth={2} aria-hidden />
                  </button>
                  </div>
                </div>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="category-page__chips">
                {hiddenAllergens.map((a) => (
                  <span
                    key={a}
                    className="badge-outline"
                    style={{ borderColor: "rgba(255,255,255,0.18)" }}
                  >
                    ✕ {t(a)}
                  </span>
                ))}
                {highlightFilters.map((h) => (
                  <span
                    key={h}
                    className="badge-outline"
                    style={{ borderColor: "rgba(201,164,108,0.9)" }}
                  >
                    ★ {t(h)}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section>
        <div className="container">
          <div className="scroll-y-soft category-page__list-shell">
            {itemsByClassification.length === 0 ? (
              <p className="body-sm-muted" style={{ padding: "1rem 0.25rem" }}>
                {query.trim() || hasActiveFilters
                  ? t("noResultsWithFilters")
                  : t("noItemsInCategory")}
              </p>
            ) : (
              sections.map(([sectionKey, sectionData]) => (
                <section
                  key={sectionKey}
                  id={`section-${sectionKey.replace(/\s+/g, "-")}`}
                  className="category-page__section"
                >
                  <h2 className="category-page__section-title">{sectionData.title}</h2>
                  <div
                    className={`category-page__section-grid ${viewMode === "list" ? "category-page__section-grid--list" : ""}`}
                  >
                    {sectionData.items.map((item, index) => (
                      <DishItem
                        key={item._id}
                        item={item}
                        index={index}
                        onOpen={() => setActiveItem(item)}
                      />
                    ))}
                  </div>
                </section>
              ))
            )}
          </div>
        </div>
      </section>

      <DishModal item={activeItem} onClose={() => setActiveItem(null)} category={category} />

      </div>
      <Footer />
    </main>
  );
};
