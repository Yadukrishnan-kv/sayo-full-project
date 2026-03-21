import { useEffect, useMemo, useState } from "react";
import { flushSync } from "react-dom";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import { useMenuContext } from "../context/MenuContext";
import { slugify } from "@/lib/dataConverters";
import type { MenuItemData, CategoryData } from "@/lib/customerAPI";
import { DishItem } from "../components/DishItem";
import { DishModal } from "../components/DishModal";
import { Footer } from "../components/Footer";
import { AppIcon } from "../components/AppIcon";
import { CustomDropdown } from "../components/CustomDropdown";
import { useFilter } from "../context/FilterContext";

export const CategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { categories, menuItems, loading, error } = useMenuContext();
  
  // Find category by slug
  const category = useMemo(() => {
    if (!slug) return undefined;
    return categories.find((c) => slugify(c.name_en) === slug);
  }, [categories, slug]);

  const { t } = useTranslation();
  const { highlightFilters, hiddenAllergens, clearFilters } = useFilter();

  const [query, setQuery] = useState("");
  const [activeItem, setActiveItem] = useState<MenuItemData | null>(null);
  const [selectedClassification, setSelectedClassification] = useState<string | null>(null);
  const [floatingNavOpen, setFloatingNavOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  // Get items for this category
  const items = useMemo(() => {
    if (!category) return [];
    return menuItems.filter((item) => item.category_id === category._id);
  }, [category, menuItems]);

  const classifications = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      if (item.section_id?.trim()) set.add(item.section_id.trim());
    });
    return Array.from(set).sort();
  }, [items]);

  const classificationCounts = useMemo(() => {
    const map = new Map<string, number>();
    items.forEach((item) => {
      const key = item.section_id?.trim() || "";
      if (key) map.set(key, (map.get(key) ?? 0) + 1);
    });
    return map;
  }, [items]);

  const itemsByClassification = useMemo(() => {
    let list = items;
    const selected = (selectedClassification || "").trim();
    if (selected) {
      list = list.filter((item) => (item.section_id || "").trim() === selected);
    }
    return list.filter((item) => {
      if (query.trim()) {
        const q = query.toLowerCase();
        if (
          !item.name_en.toLowerCase().includes(q) &&
          !item.description_en.toLowerCase().includes(q)
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
  }, [items, selectedClassification, query, hiddenAllergens, highlightFilters]);

  const sections = useMemo(() => {
    const bySection = new Map<string, MenuItemData[]>();
    itemsByClassification.forEach((item) => {
      const key = item.section_id || "";
      if (!bySection.has(key)) bySection.set(key, []);
      bySection.get(key)!.push(item);
    });
    return Array.from(bySection.entries());
  }, [itemsByClassification]);

  useEffect(() => {
    setQuery("");
    setSelectedClassification(null);
    clearFilters();

    const handleSearchQuery = (event: Event) => {
      const custom = event as CustomEvent<string>;
      setQuery(custom.detail ?? "");
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
                  {category.name_en}
                </h1>
                <p
                  className="body-sm-muted"
                  style={{ margin: 0, fontSize: "0.88rem" }}
                >
                  {category.description_en}
                </p>
              </header>

              <div className="category-page__header-actions">
                {classifications.length > 0 && (
                  <div className="category-page__section-dropdown-wrap">
                    <span className="category-page__section-dropdown-label">{t("selectCategory")}</span>
                    <CustomDropdown
                      options={[
                        { value: null, label: `${t("allClassifications")} (${items.length})` },
                        ...classifications.map((name) => ({
                          value: name,
                          label: `${name} (${classificationCounts.get(name) ?? 0})`,
                        })),
                      ]}
                      value={selectedClassification}
                      onChange={setSelectedClassification}
                      placeholder={t("allClassifications")}
                      className="category-page__section-dropdown"
                      aria-label={t("allClassifications")}
                    />
                  </div>
                )}
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
              sections.map(([sectionName, sectionItems]) => (
                <section
                  key={sectionName || "default"}
                  id={sectionName ? `section-${sectionName.replace(/\s+/g, "-")}` : undefined}
                  className="category-page__section"
                >
                  {sectionName && (
                    <h2 className="category-page__section-title">{sectionName}</h2>
                  )}
                  <div
                    className={`category-page__section-grid ${viewMode === "list" ? "category-page__section-grid--list" : ""}`}
                  >
                    {sectionItems.map((item, index) => (
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

      {classifications.length > 0 && (
        <motion.div
          className="category-page__floating-nav-wrap"
          initial={{ opacity: 0, x: 72 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 72 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
          <AnimatePresence>
            {floatingNavOpen && (
              <>
                <motion.div
                  className="category-page__floating-nav-backdrop"
                  aria-hidden
                  onClick={() => setFloatingNavOpen(false)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                />
                <motion.aside
                  className="category-page__floating-nav"
                  aria-label="Jump to section"
                  initial={{ opacity: 0, scale: 0.92, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: 8 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                >
                  <div className="category-page__floating-nav-inner">
                  <div className="category-page__floating-nav-header">
                    <span className="category-page__floating-nav-title">{category.name_en}</span>
                    <span className="category-page__floating-nav-count">{items.length}</span>
                  </div>
                  <nav className="category-page__floating-nav-list">
                    <button
                      type="button"
                      className={`category-page__floating-nav-item ${selectedClassification === null ? "category-page__floating-nav-item--active" : ""}`}
                      onClick={() => {
                        window.scrollTo({ top: 0, behavior: "smooth" });
                        flushSync(() => setSelectedClassification(null));
                        setFloatingNavOpen(false);
                        setTimeout(() => {
                          document.querySelector(".category-page__list-shell")?.scrollIntoView({ behavior: "smooth", block: "start" });
                        }, 80);
                      }}
                    >
                      <span>{t("allClassifications")}</span>
                      <span className="category-page__floating-nav-item-count">{items.length}</span>
                    </button>
                    {classifications.map((name) => (
                      <button
                        key={name}
                        type="button"
                        className={`category-page__floating-nav-item ${(selectedClassification || "").trim() === (name || "").trim() ? "category-page__floating-nav-item--active" : ""}`}
                        onClick={() => {
                          window.scrollTo({ top: 0, behavior: "smooth" });
                          const value = String(name).trim() || null;
                          flushSync(() => setSelectedClassification(value));
                          setFloatingNavOpen(false);
                          const sectionId = value ? `section-${String(value).replace(/\s+/g, "-")}` : null;
                          setTimeout(() => {
                            if (sectionId) document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
                          }, 80);
                        }}
                      >
                        <span>{name}</span>
                        <span className="category-page__floating-nav-item-count">
                          {classificationCounts.get(name) ?? 0}
                        </span>
                      </button>
                    ))}
                  </nav>
                </div>
                </motion.aside>
              </>
            )}
          </AnimatePresence>
          <motion.button
            type="button"
            className="category-page__floating-nav-fab"
            onClick={() => setFloatingNavOpen((o) => !o)}
            aria-expanded={floatingNavOpen}
            aria-label={floatingNavOpen ? "Close menu sections" : "Open menu sections"}
            whileTap={{ scale: 0.92 }}
            whileHover={{ scale: 1.06 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <motion.span
              className="category-page__floating-nav-fab-icon"
              aria-hidden
              animate={{ scale: floatingNavOpen ? 1.1 : 1 }}
              transition={{ duration: 0.2 }}
            >
              <AppIcon name="categoryList" size={22} strokeWidth={2} />
            </motion.span>
          </motion.button>
        </motion.div>
      )}

      </div>
      <Footer />
    </main>
  );
};
