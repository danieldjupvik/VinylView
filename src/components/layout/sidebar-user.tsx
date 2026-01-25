import {
  Link,
  useLocation,
  useNavigate,
  useRouterState
} from '@tanstack/react-router'
import { LogOut, Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarImage
} from '@/components/ui/avatar'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from '@/components/ui/sidebar'
import { useAuth } from '@/hooks/use-auth'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { usePreferences } from '@/hooks/use-preferences'
import { useUserProfile } from '@/hooks/use-user-profile'
import { storeRedirectUrl } from '@/lib/redirect-utils'

import type { MouseEvent } from 'react'

export function SidebarUser(): React.JSX.Element {
  const { t } = useTranslation()
  const { signOut } = useAuth()
  const { profile } = useUserProfile()
  const isOnline = useOnlineStatus()
  const { avatarSource, gravatarUrl } = usePreferences()
  const navigate = useNavigate()
  const location = useRouterState({ select: (s) => s.location })
  const routeLocation = useLocation()
  const { isMobile, setOpenMobile } = useSidebar()

  const username = profile?.username
  const avatarUrl = profile?.avatar_url

  const isActive = (path: string) =>
    routeLocation.pathname === path ||
    routeLocation.pathname.startsWith(`${path}/`)

  const handleNavClick =
    (path: string) => (event: MouseEvent<HTMLAnchorElement>) => {
      if (
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        event.button === 1
      ) {
        return
      }

      if (isActive(path)) {
        event.preventDefault()
      }

      if (isMobile) {
        setOpenMobile(false)
      }
    }

  const handleSignOut = () => {
    const currentUrl = location.pathname + location.searchStr + location.hash
    storeRedirectUrl(currentUrl)

    signOut()
    toast.success(t('auth.signOutSuccess'))
    void navigate({ to: '/login' })

    if (isMobile) {
      setOpenMobile(false)
    }
  }

  const initials = username
    ? username
        .split(/[\s_-]/)
        .filter(Boolean)
        .map((part: string) => part.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?'

  const preferredAvatar = avatarSource === 'gravatar' ? gravatarUrl : avatarUrl
  const fallbackAvatar = avatarSource === 'gravatar' ? avatarUrl : gravatarUrl
  const resolvedAvatar = preferredAvatar || fallbackAvatar

  return (
    <SidebarMenu>
      {/* Settings */}
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          isActive={isActive('/settings')}
          tooltip={t('nav.settings')}
        >
          <Link
            to="/settings"
            viewTransition
            onClick={handleNavClick('/settings')}
          >
            <Settings />
            <span>{t('nav.settings')}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      {/* Sign Out */}
      <SidebarMenuItem>
        <SidebarMenuButton onClick={handleSignOut} tooltip={t('auth.signOut')}>
          <LogOut />
          <span>{t('auth.signOut')}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>

      {/* User info row */}
      <SidebarMenuItem>
        <div className="flex h-12 w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0! [&>span:last-child]:truncate">
          <Avatar className="h-8 w-8 rounded-lg group-data-[collapsible=icon]:h-5 group-data-[collapsible=icon]:w-5">
            {resolvedAvatar ? (
              <AvatarImage
                src={resolvedAvatar}
                alt={username ?? t('user.fallback')}
                className="rounded-lg object-cover"
              />
            ) : null}
            <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
            <AvatarBadge
              className={
                isOnline
                  ? 'bg-green-500 dark:bg-green-600'
                  : 'bg-muted-foreground/50'
              }
            />
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate font-medium">{username}</span>
          </div>
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
