import { motion, AnimatePresence } from 'framer-motion';

const TYPE_STYLES = {
  distress_auto: { icon: '🔔', color: 'bg-red-50 border-red-200 text-red-700', label: 'Auto detected' },
  manual_individual: { icon: '👆', color: 'bg-indigo-50 border-indigo-200 text-indigo-700', label: 'Manual trigger' },
  broadcast: { icon: '📢', color: 'bg-amber-50 border-amber-200 text-amber-700', label: 'Broadcast' },
  parent_panic: { icon: '🆘', color: 'bg-orange-50 border-orange-200 text-orange-700', label: 'Parent alert' },
};

const OVERLAY_EMOJI = {
  balloons: '🎈',
  stars: '⭐',
  confetti: '🎉',
  mascot: '🚀',
  badge: '🏆',
  rainbow: '🌈',
  superpower: '🦸',
};

function formatTime(isoString) {
  try {
    return new Date(isoString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return '--:--';
  }
}

export default function AlertLog({ alerts }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">📋</span>
        <h3 className="font-display font-bold text-gray-700 text-sm uppercase tracking-wide">
          Alert Log
        </h3>
        {alerts.length > 0 && (
          <span className="ml-auto bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full">
            {alerts.length}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
        {alerts.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-6">
            <div className="text-3xl mb-2">✅</div>
            All calm! No alerts yet.
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {[...alerts].reverse().map((alert, idx) => {
              const style = TYPE_STYLES[alert.type] || TYPE_STYLES.distress_auto;
              return (
                <motion.div
                  key={`${alert.timestamp}-${idx}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`rounded-xl border px-3 py-2.5 ${style.color}`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-base mt-0.5">{style.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-display font-bold text-sm truncate">
                          {alert.childName || 'Class'}
                        </span>
                        <span className="text-xs opacity-60 shrink-0">
                          {formatTime(alert.timestamp)}
                        </span>
                      </div>
                      <div className="text-xs mt-0.5 opacity-80">
                        {style.label}
                        {alert.overlayType && (
                          <span className="ml-1">
                            → {OVERLAY_EMOJI[alert.overlayType] || '✨'} {alert.overlayType}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
