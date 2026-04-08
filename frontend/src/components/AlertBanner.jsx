import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, AlertCircle, X, ChevronDown } from 'lucide-react';

const AlertBanner = ({ alerts = [] }) => {
  const [dismissed, setDismissed] = useState([]);
  const [expanded, setExpanded] = useState(false);

  const visible = alerts.filter((_, i) => !dismissed.includes(i));
  if (visible.length === 0) return null;

  const shown = expanded ? visible : visible.slice(0, 2);
  const remaining = visible.length - 2;

  return (
    <div className="space-y-2 mb-6">
      <AnimatePresence>
        {shown.map((alert, idx) => {
          const isWarning = alert.level === 'warning';
          const Icon = isWarning ? AlertTriangle : AlertCircle;
          const originalIdx = alerts.findIndex(
            (a) => a.category === alert.category && a.message === alert.message
          );

          return (
            <motion.div
              key={`${alert.category}-${idx}`}
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              transition={{ duration: 0.25 }}
              className={isWarning ? 'alert-warning' : 'alert-danger'}
            >
              <Icon
                size={18}
                className={`shrink-0 mt-0.5 ${isWarning ? 'text-warning-400' : 'text-danger-400'}`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-sm font-medium ${isWarning ? 'text-warning-400' : 'text-danger-400'}`}>
                    {alert.message}
                  </p>
                  <button
                    onClick={() => setDismissed((d) => [...d, originalIdx])}
                    className="shrink-0 p-1 rounded-md opacity-60 hover:opacity-100 transition-opacity"
                  >
                    <X size={14} />
                  </button>
                </div>
                {alert.percent && (
                  <div className="mt-1.5 progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${Math.min(alert.percent, 100)}%`,
                        background: isWarning
                          ? 'linear-gradient(90deg, #F59E0B, #FBBF24)'
                          : 'linear-gradient(90deg, #F43F5E, #FB7185)',
                      }}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {remaining > 0 && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="flex items-center gap-1 text-xs text-dark-muted hover:text-dark-text transition-colors ml-1"
        >
          <ChevronDown size={14} />
          Show {remaining} more alert{remaining > 1 ? 's' : ''}
        </button>
      )}
    </div>
  );
};

export default AlertBanner;
