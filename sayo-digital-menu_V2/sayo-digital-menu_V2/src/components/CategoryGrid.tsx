import { useTranslation } from "react-i18next";
import { useMenuContext } from "../context/MenuContext";
import { CategoryCard } from "./CategoryCard";

export const CategoryGrid: React.FC = () => {
  const { t } = useTranslation();
  const { categories, loading, error } = useMenuContext();

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
              Menus
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
              Special Menus
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
              Festive Menus
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
              SAYO Jubail
            </h2>
            <div
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
                <div style={{ fontWeight: 600 }}>Opening Hours</div>
                <div>5:30 PM – 3:00 AM · Sunday to Saturday</div>
                <div style={{ fontWeight: 600, marginTop: "0.6rem" }}>Phone</div>
                <a href="tel:+966000000000">+966 00 000 0000</a>
                <div style={{ fontWeight: 600, marginTop: "0.6rem" }}>Website</div>
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
                <div style={{ fontWeight: 600 }}>Address</div>
                <div>
                  Al Fanater District,
                  <br />
                  Jubail, Saudi Arabia
                </div>
                <div style={{ fontWeight: 600, marginTop: "0.6rem" }}>Other Locations</div>
                <a href="#">View more SAYO locations</a>
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
              Children aged 4–13 need 1,200–1,500 calories on average per day, and
              individual calorie needs may vary from one person to another. Adults need
              2,000 calories on average per day.
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

