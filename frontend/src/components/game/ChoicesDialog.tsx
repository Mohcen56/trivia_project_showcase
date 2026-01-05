'use client'

import React, { useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'

interface ChoicesDialogProps {
  open: boolean
  onClose: () => void
  choices: string[]
  onGoToQuestion?: () => void
}

export default function ChoicesDialog({
  open,
  onClose,
  choices,
  onGoToQuestion,
}: ChoicesDialogProps) {
  const constraintsRef = useRef<HTMLDivElement>(null)

  // pad empty spots so grid always has 4 cells
  const padded = [...choices].slice(0, 4)
  while (padded.length < 4) padded.push('')

  return (
    <motion.div ref={constraintsRef}>
      {/* ✅ Only Dialog root + overlay */}
      <Dialog open={open} onOpenChange={onClose}>
        {/* ❌ Instead of using the built-in DialogContent, 
            we’ll render our own content *inside* it */}
        <DialogContent
          className="p-0 bg-transparent border-none shadow-none data-[state=open]:animate-none"
        >
          {/* ✅ our draggable main container */}
          <motion.div
            drag
            dragMomentum={true}
            className="relative max-w-xl mx-auto rounded-2xl overflow-hidden shadow-2xl bg-white border"
            style={{ touchAction: 'none' }}
          >
            {/* ✅ The X is now INSIDE this draggable div */}
            <button
              onClick={onClose}
              className="absolute top-2 right-2 rounded-full p-1 hover:bg-gray-100 transition"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <DialogHeader>
              <DialogTitle className="text-sm sm:text-lg font-semibold text-center">
                
              </DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-0 divide-x divide-y border-t border-gray-200">
              {padded.map((c, i) => (
                <div
                  key={i}
                  className="min-h-[96px] flex items-center justify-center p-4 text-center"
                >
                  <div>
                    <div className="text-xs text-gray-500 mb-2">#{i + 1}</div>
                    <div className="text-sm sm:text-base font-medium">{c || '—'}</div>
                  </div>
                </div>
              ))}
            </div>

            {onGoToQuestion && (
              <div className="flex gap-2 justify-end p-3">
                <Button onClick={onGoToQuestion}>Go to question</Button>
              </div>
            )}
          </motion.div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
