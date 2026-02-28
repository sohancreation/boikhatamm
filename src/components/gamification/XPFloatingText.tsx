import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";

interface XPEvent {
  id: number;
  xp: number;
  coins?: number;
  x: number;
  y: number;
}

let addXPEvent: ((xp: number, coins?: number) => void) | null = null;
let eventId = 0;

export function triggerXPFloat(xp: number, coins?: number) {
  addXPEvent?.(xp, coins);
}

export default function XPFloatingText() {
  const [events, setEvents] = useState<XPEvent[]>([]);

  const handleAdd = useCallback((xp: number, coins?: number) => {
    const id = ++eventId;
    const x = 50 + Math.random() * 40 - 20;
    const y = 20 + Math.random() * 10;
    setEvents(prev => [...prev, { id, xp, coins, x, y }]);
    setTimeout(() => setEvents(prev => prev.filter(e => e.id !== id)), 1200);
  }, []);

  useEffect(() => {
    addXPEvent = handleAdd;
    return () => { addXPEvent = null; };
  }, [handleAdd]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[100]">
      <AnimatePresence>
        {events.map(e => (
          <motion.div
            key={e.id}
            initial={{ opacity: 1, y: 0, scale: 0.5 }}
            animate={{ opacity: 0, y: -60, scale: 1.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            style={{ position: "absolute", left: `${e.x}%`, top: `${e.y}%` }}
            className="flex flex-col items-center gap-0.5"
          >
            <span className="text-lg font-black text-primary drop-shadow-lg">
              +{e.xp} XP
            </span>
            {e.coins && e.coins > 0 && (
              <span className="text-sm font-bold text-secondary drop-shadow-md">
                +{e.coins} 💎
              </span>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
