import { ChevronsUpDown, LogOut } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from '@/components/ui/sidebar'

export function SidebarUser() {
  const { t } = useTranslation()
  const { username, logout } = useAuth()
  const { isMobile } = useSidebar()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    toast.success(t('auth.logoutSuccess'))
    navigate({ to: '/login' })
  }

  const initials = username
    ? username
        .split(/[\s_-]/)
        .map((part) => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?'

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
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
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
