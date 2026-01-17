import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar'
import { Link, useLocation } from '@tanstack/react-router'
import { Disc3, Heart } from 'lucide-react'
import type { MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { BrandMark } from './brand-mark'
import { SidebarUser } from './sidebar-user'

export function AppSidebar() {
  const { t } = useTranslation()
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path
  const handleSameRouteClick =
    (path: string) => (event: MouseEvent<HTMLAnchorElement>) => {
      if (isActive(path)) {
        event.preventDefault()
      }
    }

  return (
    <Sidebar>
      <SidebarHeader className="pt-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="gap-3 text-base hover:bg-transparent active:bg-transparent"
            >
              <Link
                to="/collection"
                onClick={handleSameRouteClick('/collection')}
              >
                <BrandMark size="sm" />
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate font-semibold">
                    {t('app.name')}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t('nav.browse')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive('/collection')}
                  tooltip={t('nav.collection')}
                >
                  <Link
                    to="/collection"
                    onClick={handleSameRouteClick('/collection')}
                  >
                    <Disc3 />
                    <span>{t('nav.collection')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  disabled
                  tooltip={`${t('nav.wantlist')} ${t('common.comingSoon')}`}
                >
                  <Heart />
                  <span>{t('nav.wantlist')}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="pb-3">
        <SidebarUser />
      </SidebarFooter>
    </Sidebar>
  )
}
