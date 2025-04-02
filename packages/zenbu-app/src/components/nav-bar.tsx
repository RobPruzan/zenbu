'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function NavBar() {
  const pathname = usePathname()
  
  return (
    <div className="flex gap-4 p-3 border-b mb-4">
      <Link 
        href="/chat" 
        className={`hover:underline ${pathname === '/chat' ? 'font-bold' : ''}`}
      >
        Chat
      </Link>
      <Link 
        href="/context-log-demo" 
        className={`hover:underline ${pathname === '/context-log-demo' ? 'font-bold' : ''}`}
      >
        Context Log
      </Link>
    </div>
  )
} 