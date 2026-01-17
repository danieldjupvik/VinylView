import type { MouseEvent } from 'react'
import { ChevronsUpDown, LogOut, Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import { usePreferences } from '@/hooks/use-preferences'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar'

export function SidebarUser() {
  const { t } = useTranslation()
  const { username, logout, avatarUrl } = useAuth()
  const { avatarSource, gravatarUrl } = usePreferences()
  const navigate = useNavigate()
  const location = useLocation()
  const currentLocation = `${location.pathname}${location.search}${location.hash}`
  const isModifiedEvent = (event: MouseEvent) =>
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    event.button === 1

  const handleLogout = () => {
    logout()
    toast.success(t('auth.logoutSuccess'))
    navigate({ to: '/login' })
  }

  const initials = username
    ? username
        .split(/[\s_-]/)
        .filter(Boolean)
        .map((part) => part.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?'

  const preferredAvatar = avatarSource === 'gravatar' ? gravatarUrl : avatarUrl
  const fallbackAvatar = avatarSource === 'gravatar' ? avatarUrl : gravatarUrl
  const resolvedAvatar = preferredAvatar || fallbackAvatar

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                {resolvedAvatar ? (
                  <AvatarImage
                    src={resolvedAvatar}
                    alt={username ?? 'User'}
                    className="rounded-lg object-cover"
                  />
                ) : null}
                <AvatarFallback className="rounded-lg">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{username}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side="top"
            align="start"
            sideOffset={4}
          >
            <DropdownMenuItem asChild>
              <Link
                to="/settings"
                onClick={(event) => {
                  if (isModifiedEvent(event)) {
                    return
                  }

                  if (currentLocation === '/settings') {
                    event.preventDefault()
                  }
                }}
              >
                <Settings className="mr-2 size-4" />
                {t('nav.settings')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 size-4" />
              {t('auth.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
