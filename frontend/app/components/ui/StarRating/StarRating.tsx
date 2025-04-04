import styles from "./StarRating.module.scss";
import { calculateAverageRating } from "@/app/utils/calculateAverageRating";
import { FaStar } from "react-icons/fa";

interface StarRatingProps {
  reviews: { rating: number }[] | undefined;
  className?: string;
  size?: number;
}

const StarRating: React.FC<StarRatingProps> = ({ reviews, className, size = 24 }) => {
  const averageRating = reviews ? calculateAverageRating(reviews) : 0;
  const fullStars = Math.floor(averageRating);
  const remainder = averageRating - fullStars;

  return (
    <div 
      className={`${styles.star_block} ${className || ""}`.trim()}
      style={{ "--star-size": `${size}px` } as React.CSSProperties}
    >
      <div className={styles.star_block__stars}>
        {[...Array(5)].map((_, index) => (
          <div key={index} className={styles.star_block__star}>
            <FaStar />

            {index < fullStars && (
              <span
                className={`${styles.star_block__yellow} ${styles.full_star}`}
              >
                <FaStar />
              </span>
            )}
            {index === fullStars && remainder > 0 && (
              <span
                className={`${styles.star_block__yellow} ${styles.partial_star}`}
                style={{
                  clipPath: `inset(0 ${100 - remainder * 100}% 0 0)`,
                }}
              >
                <FaStar />
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StarRating;
