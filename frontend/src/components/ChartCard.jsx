import { motion } from 'framer-motion';

const ChartCard = ({ title, subtitle, children, className = '', loading = false, action }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`card ${className}`}
    >
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="font-semibold text-dark-text text-base">{title}</h3>
          {subtitle && <p className="text-xs text-dark-muted mt-0.5">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="skeleton h-48 w-full" />
          <div className="skeleton h-3 w-3/4" />
          <div className="skeleton h-3 w-1/2" />
        </div>
      ) : (
        children
      )}
    </motion.div>
  );
};

export default ChartCard;
