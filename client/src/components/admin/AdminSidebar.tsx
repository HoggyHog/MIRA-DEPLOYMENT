
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard,
  Users,
  Calendar,
  CreditCard,
  FileText,
  MessageSquare,
  Settings,
  BarChart3,
  Monitor,
  UserCog,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface AdminSidebarProps {
  activeModule: string;
  setActiveModule: (module: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeModule,
  setActiveModule,
  collapsed,
  setCollapsed
}) => {
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'attendance',
      label: 'Attendance Management',
      icon: Users,
      badge: null
    },
    {
      id: 'leaves',
      label: 'Leave Approval',
      icon: Calendar,
      badge: 12
    },
    {
      id: 'fees',
      label: 'Fee Collection',
      icon: CreditCard,
      badge: 8
    },
    {
      id: 'scheduling',
      label: 'Scheduling & Timetable',
      icon: FileText,
      badge: null
    },
    {
      id: 'records',
      label: 'Staff & Student Records',
      icon: Users,
      badge: null
    },
    {
      id: 'communication',
      label: 'Communication Center',
      icon: MessageSquare,
      badge: 5
    },
    {
      id: 'ai-analytics',
      label: 'AI Analytics',
      icon: BarChart3,
      badge: 3
    },
    {
      id: 'monitoring',
      label: 'System Monitoring',
      icon: Monitor,
      badge: null
    },
    {
      id: 'users',
      label: 'User Management',
      icon: UserCog,
      badge: null
    }
  ];

  return (
    <div className={`fixed left-0 top-0 h-full bg-white shadow-lg border-r transition-all duration-300 z-50 ${
      collapsed ? 'w-16' : 'w-64'
    }`}>
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <h2 className="text-lg font-semibold text-gray-800">Admin Panel</h2>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="h-8 w-8 p-0"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;
          
          return (
            <Button
              key={item.id}
              variant={isActive ? 'default' : 'ghost'}
              className={`w-full justify-start h-auto py-3 px-3 ${
                collapsed ? 'px-3' : 'px-4'
              }`}
              onClick={() => setActiveModule(item.id)}
            >
              <Icon className={`h-5 w-5 ${collapsed ? '' : 'mr-3'}`} />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left text-sm">{item.label}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="ml-auto">
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}
            </Button>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900">System Status</h3>
            <p className="text-xs text-blue-700 mt-1">All systems operational</p>
            <div className="flex items-center mt-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-blue-700 ml-2">Online</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
