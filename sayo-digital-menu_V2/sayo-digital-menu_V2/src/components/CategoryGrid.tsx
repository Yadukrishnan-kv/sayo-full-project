import { useTranslation } from "react-i18next";
import { useMenuContext } from "../context/MenuContext";
import { CategoryCard } from "./CategoryCard";
import type { OpeningHoursEntry } from "../lib/customerAPI";

// day: 0=Sunday ... 6=Saturday. Displayed Monday-first to match the restaurant's week.
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const DAY_TRANSLATION_KEYS: Record<number, string> = {
  0: "daySunday",
  1: "dayMonday",
  2: "dayTuesday",
  3: "dayWednesday",
  4: "dayThursday",
  5: "dayFriday",
  6: "daySaturday",
};

const DEFAULT_OPENING_HOURS: OpeningHoursEntry[] = [
  { day: 0, closed1: false, closed2: false, open: "07:00", close: "11:00", open2: "11:30", close2: "23:30" },
  { day: 1, closed1: false, closed2: false, open: "07:00", close: "11:00", open2: "11:30", close2: "23:30" },
  { day: 2, closed1: false, closed2: false, open: "07:00", close: "11:00", open2: "11:30", close2: "23:30" },
  { day: 3, closed1: false, closed2: false, open: "07:00", close: "11:00", open2: "11:30", close2: "23:30" },
  { day: 4, closed1: false, closed2: false, open: "07:00", close: "11:00", open2: "11:30", close2: "00:00" },
  { day: 5, closed1: false, closed2: false, open: "07:00", close: "11:00", open2: "11:30", close2: "00:00" },
  { day: 6, closed1: false, closed2: false, open: "07:00", close: "11:00", open2: "11:30", close2: "23:30" },
];

function formatTime(time?: string): string {
  if (!time) return "";
  const [hoursStr, minutesStr] = time.split(":");
  const hours = Number(hoursStr);
  const minutes = Number(minutesStr);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return time;
  const period = hours >= 12 ? "pm" : "am";
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  const displayMinutes = minutes === 0 ? "" : `:${minutesStr.padStart(2, "0")}`;
  return `${displayHour}${displayMinutes} ${period}`;
}

function formatHoursRange(entry: OpeningHoursEntry, closedLabel: string): string {
  if (entry.closed1 && entry.closed2) return closedLabel;
  const ranges: string[] = [];
  if (!entry.closed1) ranges.push(`${formatTime(entry.open)}–${formatTime(entry.close)}`);
  if (!entry.closed2 && entry.open2 && entry.close2) {
    ranges.push(`${formatTime(entry.open2)}–${formatTime(entry.close2)}`);
  }
  return ranges.join(", ");
}

export const CategoryGrid: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { categories, loading, error, settings } = useMenuContext();
  const isArabic = i18n.language === "ar";

  if (loading) {
    return (
      <section className="category-grid__section">
        <div className="container">
          <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
            <div style={{ display: "inline-block", marginBottom: "1rem" }}>
              <div style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⏳</div>
            </div>
            <p style={{ color: "var(--color-text-secondary)" }}>Loading menus...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="category-grid__section">
        <div className="container">
          <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--color-error)" }}>
            <p>Failed to load menus: {error}</p>
          </div>
        </div>
      </section>
    );
  }

  const openingHours = settings?.opening_hours?.length ? settings.opening_hours : DEFAULT_OPENING_HOURS;
  const closedLabel = t("closedToday");

  const mainCategories = categories.filter((c) => c.category_id !== 'special' && c.category_id !== 'festive');
  const specialCategories = categories.filter((c) => c.category_id === 'special');
  const festiveCategories = categories.filter((c) => c.category_id === 'festive');

  return (
    <>
      <section className="category-grid__section">
        <div className="container">
          {mainCategories.length > 0 && (
          <>
            <h2 className="heading-lg category-grid__heading">
              {t("menus")}
            </h2>
            <div className="category-grid__row">
              {mainCategories.map((category, index) => (
                <div key={category._id} className="category-grid__item">
                  <CategoryCard category={category} index={index} />
                </div>
              ))}
            </div>
          </>
        )}

          {specialCategories.length > 0 && (
          <>
            <h3 className="heading-lg category-grid__heading">
              {t("specialMenus")}
            </h3>
            <div className="category-grid__row">
              {specialCategories.map((category, index) => (
                <div key={category._id} className="category-grid__item">
                  <CategoryCard category={category} index={index} />
                </div>
              ))}
            </div>
          </>
        )}

          {festiveCategories.length > 0 && (
          <>
            <h3 className="heading-lg category-grid__heading">
              {t("festiveMenus")}
            </h3>
            <div className="category-grid__row">
              {festiveCategories.map((category, index) => (
                <div key={category._id} className="category-grid__item">
                  <CategoryCard category={category} index={index} />
                </div>
              ))}
            </div>
          </>
        )}
        </div>
      </section>
      <section className="category-grid__section">
        <div className="container">
          <div
            style={{
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--color-border)",
              padding: "2rem 1.8rem",
              backgroundColor: "var(--color-background-secondary)",
              marginInline: "auto",
            }}
          >
            <h2
              className="heading-lg"
              style={{
                margin: 0,
                fontSize: "1.1rem",
              }}
            >
              {(isArabic ? settings?.restaurant_name_ar : settings?.restaurant_name) || settings?.restaurant_name || settings?.restaurant_name_ar || "SAYO Jubail"}
            </h2>
            <div
              className="info-grid"
              style={{
                marginTop: "0.8rem",
                display: "grid",
                gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1.1fr)",
                gap: "1.5rem",
                fontSize: "0.85rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.4rem",
                }}
              >
                <div style={{ fontWeight: 600 }}>{t("openingHours")}</div>
                <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", columnGap: "0.6rem", rowGap: "0.1rem" }}>
                  {DAY_ORDER.map((day) => {
                    const entry = openingHours.find((e) => e.day === day);
                    const dayLabel = t(DAY_TRANSLATION_KEYS[day]);
                    const hours = entry ? formatHoursRange(entry, closedLabel) : closedLabel;
                    return (
                      <>
                        <span key={day + "-day"} style={{ fontWeight: 500 }}>{dayLabel}</span>
                        <span key={day + "-hours"}>{hours}</span>
                      </>
                    );
                  })}
                </div>
                <div style={{ fontWeight: 600, marginTop: "0.6rem" }}>{t("website")}</div>
                <a href="https://www.sayosaudi.com" target="_blank" rel="noreferrer">
                  www.sayosaudi.com
                </a>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.4rem",
                }}
              >
                <div style={{ fontWeight: 600 }}>{t("address")}</div>
                <div style={{ whiteSpace: "pre-line" }}>
                  {(isArabic ? settings?.address_ar : settings?.address_en) || settings?.address_en || settings?.address_ar || t("defaultAddress")}
                </div>
                <div style={{ fontWeight: 600, marginTop: "0.6rem" }}>{t("otherLocations")}</div>
                <a href="#">{t("viewMoreLocations")}</a>
              </div>
            </div>
            <div
              style={{
                marginTop: "1.2rem",
                fontSize: "0.75rem",
                color: "var(--color-text-secondary)",
                lineHeight: 1.6,
              }}
            >
              {t("calorieNotice")}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

