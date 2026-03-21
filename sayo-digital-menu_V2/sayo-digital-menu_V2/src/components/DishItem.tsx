import { motion } from "framer-motion";
import type { MenuItemData } from "@/lib/customerAPI";
import type { DietaryTag } from "../types/filters";
import { useTranslation } from "react-i18next";
import { getCountryCodeForItem, isVegetarianSection, countryCodeToFlag } from "@/lib/dataConverters";
import { AppIcon, getDietaryIconName } from "./AppIcon";
import { IconWithTooltip } from "./IconWithTooltip";

const COUNTRY_CODE_TO_I18N: Record<string, string> = {
  IN: "india",
  JP: "japan",
  TH: "thailand",
  CN: "china",
  KR: "southKorea",
  LB: "lebanon",
  VN: "vietnam",
  MY: "malaysia",
  ID: "indonesia",
  SG: "singapore",
  SA: "countrySA",
};

const SPICE_LABELS: Record<number, string> = {
  0: "spiceLevelMild",
  1: "spiceLevelMedium",
  2: "spiceLevelHot",
  3: "spiceLevelExtreme",
};

interface Props {
  item: MenuItemData;
  onOpen: () => void;
  index: number;
}

export const DishItem: React.FC<Props> = ({ item, onOpen, index }) => {
  const { t } = useTranslation();

  const firstTag = item.tags?.[0];
  const tagLabel = firstTag
    ? {
        chef_special: t("chefSpecial"),
        chefSignature: t("chefSignature"),
        popular: t("popular"),
        new: t("new"),
      }[firstTag as keyof typeof firstTag]
    : undefined;
  const isChefSignature = firstTag === "chefSignature";

  const allergenList = (item.allergens ?? []) as DietaryTag[];
  const countryCode = getCountryCodeForItem(item);
  const isVegetarian = isVegetarianSection(item.section_id);
  /** 0 = mild, 1 = medium, 2 = hot, 3 = extra hot; show on every card, default mild */
  const spiceLevel = item.spice_level ?? 0;

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: 0.02 * index }}
      whileTap={{ scale: 0.98 }}
      style={{
        width: "100%",
        textAlign: "left",
        border: "none",
        background: "transparent",
        padding: 0,
      }}
    >
      <div className={`dish-item__card ${isChefSignature ? "dish-item__card--signature" : ""}`}>
        <div
          className="dish-item__image"
          style={{
            backgroundImage: item.image_url
              ? `url('${item.image_url}')`
              : "url('https://images.pexels.com/photos/958546/pexels-photo-958546.jpeg?auto=compress&cs=tinysrgb&w=600')",
          }}
        />
        <div className="dish-item__content">
          <div className="dish-item__title-row">
            <h3 className="dish-item__heading">{item.name_en}</h3>
            <div className="dish-item__price-wrap">
              <AppIcon name="price" size={14} strokeWidth={2} className="dish-item__price-icon" aria-hidden />
              <span className="price dish-item__price">
                {typeof item.price === "string" ? item.price : item.price.toFixed(0)}
              </span>
            </div>
          </div>
          {tagLabel && (
            <span
              className={`dish-item__pill ${isChefSignature ? "dish-item__pill--signature" : ""}`}
            >
              {isChefSignature && (
                <AppIcon name="chefSignature" size={12} strokeWidth={2} className="dish-item__pill-icon" aria-hidden />
              )}
              {tagLabel}
            </span>
          )}
          <p className="dish-item__description">{item.description_en}</p>
          <div className="dish-item__meta">
            {countryCode && (
              <IconWithTooltip
                label={t(`country_${countryCode.toLowerCase()}`) || countryCode}
              >
                <span className="dish-item__flag" aria-hidden>{countryCodeToFlag(countryCode)}</span>
              </IconWithTooltip>
            )}
            {isVegetarian && (
              <IconWithTooltip label={t("vegetarianDish")}>
                <AppIcon name="vegetarian" size={16} strokeWidth={2} className="dish-item__veg-icon" aria-hidden />
              </IconWithTooltip>
            )}
            <IconWithTooltip label={t(SPICE_LABELS[spiceLevel] ?? "spiceLevelMild")}>
              <span
                className={`dish-item__spice dish-item__spice--${["mild", "medium", "hot", "extreme"][spiceLevel] ?? "mild"}`}
                aria-hidden
              >
                {[1, 2, 3, 4].slice(0, Math.max(1, spiceLevel + 1)).map((i) => (
                  <AppIcon key={i} name="hot" size={12} strokeWidth={2} aria-hidden />
                ))}
                <span className="dish-item__spice-label">{t(SPICE_LABELS[spiceLevel] ?? "spiceLevelMild")}</span>
              </span>
            </IconWithTooltip>
            {item.calories != null && (
              <IconWithTooltip label={`${item.calories} ${t("calories")}`}>
                <span className="dish-item__calories-wrap">
                  <AppIcon name="calories" size={14} strokeWidth={2} className="dish-item__calories-icon" aria-hidden />
                  <span className="dish-item__calories">{item.calories} {t("calories")}</span>
                </span>
              </IconWithTooltip>
            )}
          </div>
          {allergenList.length > 0 && (
            <div className="dish-item__allergens">
              {allergenList.map((a) => (
                <AppIcon
                  key={a}
                  name={getDietaryIconName(a)}
                  size={14}
                  strokeWidth={2}
                  aria-hidden
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.button>
  );
};

