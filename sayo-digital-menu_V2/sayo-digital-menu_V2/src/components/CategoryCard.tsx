import { motion } from "framer-motion";
import type { CategoryData } from "@/lib/customerAPI";
import { Link } from "react-router-dom";

interface Props {
  category: CategoryData;
  index: number;
}

export const CategoryCard: React.FC<Props> = ({ category, index }) => {
  return (
    <motion.article
      layout
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.03 * index }}
      className="category-card"
    >
      <Link
        to={`/category/${category.name_en.toLowerCase().replace(/\s+/g, '-')}`}
        className="category-card__link"
        aria-label={category.name_en}
      >
        <div
          className="category-card__media"
          style={{
            backgroundImage: category.image_url
              ? `url('${category.image_url}')`
              : "url('https://images.pexels.com/photos/958546/pexels-photo-958546.jpeg?auto=compress&cs=tinysrgb&w=800')",
          }}
        >
          {/* image only, no overlay text */}
        </div>
        <div
          className="category-card__body"
        >
          <h3
            className="heading-lg category-card__title"
          >
            {category.name_en}
          </h3>
          <p
            className="body-sm-muted category-card__description"
          >
            {category.description_en}
          </p>
        </div>
      </Link>
    </motion.article>
  );
};

