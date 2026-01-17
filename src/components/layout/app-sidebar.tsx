import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible'
import { Badge } from '@/components/ui/badge'
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
import {
  BarChart3,
  ChevronRight,
  DollarSign,
  Disc3,
  Heart,
  Shuffle
} from 'lucide-react'
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
        {/* Browse Section */}
        <Collapsible defaultOpen className="group/collapsible">
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex w-full items-center">
                {t('nav.browse')}
                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
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
                    <SidebarMenuButton disabled>
                      <Heart />
                      <span>{t('nav.wantlist')}</span>
                      <Badge variant="outline" className="ml-auto text-[10px]">
                        {t('common.soon')}
                      </Badge>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton disabled>
                      <Shuffle />
                      <span>{t('nav.random')}</span>
                      <Badge variant="outline" className="ml-auto text-[10px]">
                        {t('common.soon')}
                      </Badge>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {/* Analyze Section */}
        <Collapsible defaultOpen className="group/collapsible">
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex w-full items-center">
                {t('nav.analyze')}
                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton disabled>
                      <DollarSign />
                      <span>{t('nav.collectionValue')}</span>
                      <Badge variant="outline" className="ml-auto text-[10px]">
                        {t('common.soon')}
                      </Badge>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton disabled>
                      <BarChart3 />
                      <span>{t('nav.stats')}</span>
                      <Badge variant="outline" className="ml-auto text-[10px]">
                        {t('common.soon')}
                      </Badge>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
      </SidebarContent>

      <SidebarFooter className="pb-3">
        <SidebarUser />
      </SidebarFooter>
    </Sidebar>
  )
}
