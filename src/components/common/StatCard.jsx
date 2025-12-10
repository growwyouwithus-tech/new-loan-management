import { motion } from 'framer-motion'
import { Card, CardContent } from '../ui/Card'

export default function StatCard({ title, value, icon: Icon, color = 'blue', onClick }) {
  const colors = {
    blue: { 
      textColor: 'text-blue-700 dark:text-blue-500',
    },
    green: { 
      textColor: 'text-emerald-600 dark:text-emerald-400',
    },
    red: { 
      textColor: 'text-rose-600 dark:text-rose-400',
    },
    yellow: { 
      textColor: 'text-amber-600 dark:text-amber-400',
    },
    purple: { 
      textColor: 'text-violet-600 dark:text-violet-400',
    },
    orange: { 
      textColor: 'text-orange-600 dark:text-orange-400',
    },
    indigo: { 
      textColor: 'text-indigo-700 dark:text-indigo-500',
    },
    emerald: { 
      textColor: 'text-teal-600 dark:text-teal-400',
    },
    cyan: { 
      textColor: 'text-sky-600 dark:text-sky-400',
    },
  }

  const colorConfig = colors[color] || colors.blue

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -8 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="h-full cursor-pointer"
      onClick={onClick}
    >
      <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-md hover:shadow-lg transition-all duration-300 h-full transform hover:-translate-y-2">
        <CardContent className="p-6 h-full flex flex-col">
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest opacity-75">
              {title}
            </p>
            <h3 className="text-3xl md:text-4xl font-bold mt-3 text-gray-900 dark:text-white">
              {value}
            </h3>
          </div>
          <div className="mt-6 flex justify-end">
            <motion.div 
              whileHover={{ rotate: 12, scale: 1.15 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.3, type: 'spring', stiffness: 400 }}
            >
              <Icon className={`h-8 w-8 ${colorConfig.textColor}`} strokeWidth={1.5} />
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
