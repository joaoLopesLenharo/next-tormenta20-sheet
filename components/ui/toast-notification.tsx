'use client'

import { useEffect } from 'react'
import { X, AlertCircle, CheckCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ToastType = 'success' | 'error' | 'info'

interface ToastNotificationProps {
  message: string
  type?: ToastType
  duration?: number
  onClose?: () => void
}

export function ToastNotification({
  message,
  type = 'info',
  duration = 4000,
  onClose,
}: ToastNotificationProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  const getStyles = () => {
    const baseClasses =
      'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium shadow-lg border'

    switch (type) {
      case 'success':
        return `${baseClasses} bg-green-500/20 border-green-500/30 text-green-400`
      case 'error':
        return `${baseClasses} bg-red-500/20 border-red-500/30 text-red-400`
      case 'info':
      default:
        return `${baseClasses} bg-blue-500/20 border-blue-500/30 text-blue-400`
    }
  }

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 flex-shrink-0" />
      case 'error':
        return <AlertCircle className="w-4 h-4 flex-shrink-0" />
      case 'info':
      default:
        return <Info className="w-4 h-4 flex-shrink-0" />
    }
  }

  return (
    <div className={cn(getStyles(), 'animate-in fade-in slide-in-from-top-4')}>
      {getIcon()}
      <span className="flex-1">{message}</span>
      <button
        onClick={onClose}
        className="flex-shrink-0 hover:opacity-75 transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

// Container para múltiplos toasts
interface ToastContainerProps {
  toasts: Array<{
    id: string
    message: string
    type?: ToastType
    duration?: number
  }>
  onRemoveToast: (id: string) => void
}

export function ToastContainer({ toasts, onRemoveToast }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
      {toasts.map((toast) => (
        <ToastNotification
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => onRemoveToast(toast.id)}
        />
      ))}
    </div>
  )
}
