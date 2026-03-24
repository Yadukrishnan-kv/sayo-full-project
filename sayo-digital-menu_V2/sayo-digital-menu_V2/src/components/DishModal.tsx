import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { MenuItemData, CategoryData } from "@/lib/customerAPI";
import { useTranslation } from "react-i18next";
import { getCountryCodeForItem, isVegetarianSection, countryCodeToFlag } from "@/lib/dataConverters";
import { AppIcon, getDietaryIconName } from "./AppIcon";
import type { DietaryTag } from "../types/filters";

const COUNTRY_CODE_TO_I18N: Record<string, string> = {
  IN: "india", JP: "japan", TH: "thailand", CN: "china", KR: "southKorea",
  LB: "lebanon", VN: "vietnam", MY: "malaysia", ID: "indonesia", SG: "singapore", SA: "countrySA",
};

const SPICE_LABELS: Record<number, string> = {
  0: "spiceLevelMild",
  1: "spiceLevelMedium",
  2: "spiceLevelHot",
  3: "spiceLevelExtreme",
};

const MODAL_BAR_BG = "#1e3a5f";
const MODAL_TAB_ACTIVE_BG = "#1e3a5f";
const FALLBACK_DISH_IMAGE = "https://images.pexels.com/photos/958546/pexels-photo-958546.jpeg?auto=compress&cs=tinysrgb&w=1200";

interface Props {
  item: MenuItemData | null;
  onClose: () => void;
  category?: CategoryData;
}

export const DishModal: React.FC<Props> = ({ item, onClose, category }) => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<"description" | "information">("description");

  if (!item) return null;

  const isArabic = i18n.language === "ar";
  const isChefSignature = item.tags?.includes("chef_special");
  const countryCode = getCountryCodeForItem(item);
  const isVegetarian = isVegetarianSection(item.section_id);
  const itemName = (isArabic ? item.name_ar : item.name_en) || item.name_en || item.name_ar;
  const itemDescription =
    (isArabic ? item.description_ar : item.description_en) || item.description_en || item.description_ar;
  const categoryName =
    (isArabic ? category?.name_ar : category?.name_en) || category?.name_en || category?.name_ar || item.section_id || item.category_id || "Menu";
  const dishImage = item.image_url || FALLBACK_DISH_IMAGE;

  return (
    <AnimatePresence>
      <>
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="dish-modal__backdrop"
        />
        <motion.div
          key="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dish-modal-title"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          className="dish-modal"
        >
          {/* Image */}
          <div className="dish-modal__image-wrap">
            <div
              className="dish-modal__image"
              style={{
                backgroundImage: `url('${dishImage}')`,
              }}
            />
          </div>

          {/* Tabs */}
          <div className="dish-modal__tabs">
            <button
              type="button"
              className={`dish-modal__tab ${activeTab === "description" ? "dish-modal__tab--active" : ""}`}
              onClick={() => setActiveTab("description")}
            >
              {t("description").toUpperCase()}
            </button>
            <button
              type="button"
              className={`dish-modal__tab ${activeTab === "information" ? "dish-modal__tab--active" : ""}`}
              onClick={() => setActiveTab("information")}
            >
              {t("information").toUpperCase()}
            </button>
          </div>

          {/* Content */}
          <div className="dish-modal__body">
            {activeTab === "description" && (
              <>
                <div className="dish-modal__title-row">
                  <div className="dish-modal__title-block">
                    <h2 id="dish-modal-title" className="dish-modal__title">{itemName}</h2>
                    {item.section_id && (
                      <p className="dish-modal__sub">{item.section_id}</p>
                    )}
                  </div>
                  <div className="dish-modal__price-wrap">
                    <AppIcon name="price" size={18} strokeWidth={2} aria-hidden />
                    <span className="price dish-modal__price">
                      {typeof item.price === "string" ? item.price : item.price.toFixed(0)}
                    </span>
                  </div>
                </div>
                <div className="dish-modal__attributes">
                  {item.calories != null && (
                    <span className="dish-modal__attr">
                      <AppIcon name="calories" size={16} strokeWidth={2} aria-hidden />
                      {item.calories} {t("calories")}
                    </span>
                  )}
                  {countryCode && (
                    <span className="dish-modal__attr" title={COUNTRY_CODE_TO_I18N[countryCode] ? t(COUNTRY_CODE_TO_I18N[countryCode]) : countryCode}>
                      <span className="dish-modal__flag">{countryCodeToFlag(countryCode)}</span>
                    </span>
                  )}
                  {isVegetarian && (
                    <span className="dish-modal__attr" title={t("vegetarianDish")}>
                      <AppIcon name="vegetarian" size={16} strokeWidth={2} aria-hidden />
                      {t("vegetarian")}
                    </span>
                  )}
                  {item.allergens?.map((a) => (
                    <span key={a} className="dish-modal__attr">
                      <AppIcon name={getDietaryIconName(a as DietaryTag)} size={16} strokeWidth={2} aria-hidden />
                      {t(a)}
                    </span>
                  ))}
                </div>
                <p className="dish-modal__description">{itemDescription}</p>
              </>
            )}
            {activeTab === "information" && (
              <div className="dish-modal__info">
                {item.section && (
                  <div className="dish-modal__detail-row">
                    <span className="dish-modal__detail-label">{t("detailSection")}</span>
                    <span className="dish-modal__detail-value">{item.section}</span>
                  </div>
                )}
                <div className="dish-modal__detail-row">
                  <span className="dish-modal__detail-label">{t("detailCategory")}</span>
                  <span className="dish-modal__detail-value">{categoryName}</span>
                </div>
                {countryCode && (
                  <div className="dish-modal__detail-row">
                    <span className="dish-modal__detail-label">{t("detailCuisine")}</span>
                    <span className="dish-modal__detail-value">
                      <span className="dish-modal__flag">{countryCodeToFlag(countryCode)}</span>
                      {COUNTRY_CODE_TO_I18N[countryCode] ? t(COUNTRY_CODE_TO_I18N[countryCode]) : countryCode}
                    </span>
                  </div>
                )}
                <div className="dish-modal__detail-row">
                  <span className="dish-modal__detail-label">{t("detailDietary")}</span>
                  <span className="dish-modal__detail-value">
                    {isVegetarian ? t("vegetarianDish") : t("nonVegetarian")}
                  </span>
                </div>
                <div className="dish-modal__detail-row">
                  <span className="dish-modal__detail-label">{t("detailSpiceLevel")}</span>
                  <span className="dish-modal__detail-value">
                    {t(SPICE_LABELS[item.spiceLevel ?? (item.tags?.includes("extraHot") ? 3 : item.tags?.includes("hot") ? 2 : 0)] ?? "spiceLevelMild")}
                  </span>
                </div>
                {item.calories != null && (
                  <div className="dish-modal__detail-row">
                    <span className="dish-modal__detail-label">{t("detailCalories")}</span>
                    <span className="dish-modal__detail-value">
                      <AppIcon name="calories" size={16} strokeWidth={2} aria-hidden />
                      {item.calories} {t("calories")}
                    </span>
                  </div>
                )}
                {item.allergens && item.allergens.length > 0 && (
                  <div className="dish-modal__detail-row">
                    <span className="dish-modal__detail-label">{t("detailAllergens")}</span>
                    <span className="dish-modal__detail-value dish-modal__detail-value--wrap">
                      {item.allergens.map((a) => (
                        <span key={a} className="dish-modal__allergen-tag">
                          <AppIcon name={getDietaryIconName(a as DietaryTag)} size={14} strokeWidth={2} aria-hidden />
                          {t(a)}
                        </span>
                      ))}
                    </span>
                  </div>
                )}
                {isChefSignature && (
                  <div className="dish-modal__detail-row">
                    <span className="dish-modal__detail-label">{t("detailHighlight")}</span>
                    <span className="dish-modal__detail-value">
                      <AppIcon name="chefSignature" size={18} strokeWidth={2} className="dish-modal__info-icon" aria-hidden />
                      {t("chefSignature")}
                    </span>
                  </div>
                )}
                <div className="dish-modal__detail-row dish-modal__detail-row--price">
                  <span className="dish-modal__detail-label">{t("detailPrice")}</span>
                  <span className="dish-modal__detail-value dish-modal__price-wrap">
                    <AppIcon name="price" size={18} strokeWidth={2} aria-hidden />
                    <span className="price">{typeof item.price === "string" ? item.price : item.price.toFixed(0)}</span>
                  </span>
                </div>
              </div>
            )}

            {/* Share + Close */}
            <div className="dish-modal__share">
              <div className="dish-modal__share-row">
                <div>
                  <span className="dish-modal__share-label">{t("share")}</span>
                  <div className="dish-modal__share-icons">
                    <a href="#" className="dish-modal__share-link" aria-label="Facebook">
                      <AppIcon name="facebook" size={20} strokeWidth={2} />
                    </a>
                    <a href="#" className="dish-modal__share-link" aria-label="Instagram">
                      <AppIcon name="instagram" size={20} strokeWidth={2} />
                    </a>
                    <a href="#" className="dish-modal__share-link" aria-label="Youtube">
                      <AppIcon name="youtube" size={20} strokeWidth={2} />
                    </a>
                  </div>
                </div>
                <button type="button" className="dish-modal__btn-close" onClick={onClose}>
                  <AppIcon name="xmark" size={16} strokeWidth={2} aria-hidden />
                  {t("close").toUpperCase()}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </>
    </AnimatePresence>
  );
};
