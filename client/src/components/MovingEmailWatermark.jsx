import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext.jsx'

export default function MovingEmailWatermark() {
  const { user } = useAuth()

  if (!user?.email) {
    return null
  }

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden"
      aria-hidden="true"
    >
      <motion.div
        className="absolute whitespace-nowrap text-sm font-medium tracking-wide text-rose-600"
        animate={{
          x: ['5vw', '75vw', '5vw'],
          y: ['12vh', '75vh', '40vh', '12vh'],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        {user.email}
      </motion.div>
    </div>
  )
}