'use client'
import { SessionProvider } from 'next-auth/react'
import { useEffect } from 'react'
import { ToastContainer } from 'react-toastify'
import { DEFAULT_PAGE_TITLE } from '@/context/constants'
import dynamic from 'next/dynamic'
const LayoutProvider = dynamic(() => import('@/context/useLayoutContext').then((mod) => mod.LayoutProvider), {
  ssr: false,
})
import { NotificationProvider } from '@/context/useNotificationContext'
import { ChildrenType } from '@/types/component-props'

const AppProvidersWrapper = ({ children }: ChildrenType) => {
  const handleChangeTitle = () => {
    if (document.visibilityState == 'hidden') document.title = 'Quay lại đi 🥺'
    else document.title = DEFAULT_PAGE_TITLE
  }

  useEffect(() => {
    if (typeof document !== 'undefined') {
      // Remove splash screen after a short delay
      const timer = setTimeout(() => {
        document.querySelector('#splash-screen')?.classList.add('remove')
      }, 500)

      const e = document.querySelector<HTMLDivElement>('#__next_splash')
      if (e?.hasChildNodes()) {
        document.querySelector('#splash-screen')?.classList.add('remove')
      }

      document.addEventListener('visibilitychange', handleChangeTitle)

      return () => {
        clearTimeout(timer)
        document.removeEventListener('visibilitychange', handleChangeTitle)
      }
    }
  }, [])

  return (
    <SessionProvider>
      <LayoutProvider>
        <NotificationProvider>
          {children}
          <ToastContainer theme="colored" />
        </NotificationProvider>
      </LayoutProvider>
    </SessionProvider>
  )
}
export default AppProvidersWrapper
