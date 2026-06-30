export enum UserRole {
    SUPER_ADMIN = 'super_admin',
    ADMIN = 'admin',
    RESELLER = 'reseller',
    USER = 'user'
  }
  
  export interface MenuItem {
    label: string;
    path: string;
    allowedRoles: UserRole[];
  }
  
  export interface MenuSection {
    title?: string;
    items: MenuItem[];
  }
  
  // Define which roles can see which menu items
  export const menuConfig: MenuSection[] = [
    {
      items: [
        { 
          label: 'Dashboard', 
          path: '/home',
          allowedRoles: [UserRole.ADMIN, UserRole.RESELLER, UserRole.USER]
        },
        { 
          label: 'Send Whatsapp', 
          path: '/send-whatsapp',
          allowedRoles: [UserRole.ADMIN, UserRole.RESELLER, UserRole.USER]
        },
        { 
          label: 'Credits', 
          path: '/credits',
          allowedRoles: [UserRole.ADMIN, UserRole.RESELLER, UserRole.USER]
        },
      ]
    },
    {
      title: 'RESELLERS & USERS',
      items: [
        {
          label: 'Manage Admins',
          path: '/manage-admin',
          allowedRoles: [UserRole.SUPER_ADMIN]
        },
        {
          label: 'Manage Reseller',
          path: '/manage-reseller',
          allowedRoles: [UserRole.ADMIN]
        },
        {
          label: 'Manage Users',
          path: '/manage-users',
          allowedRoles: [UserRole.ADMIN, UserRole.RESELLER]
        },
      ]
    },
    {
      title: 'REPORTS',
      items: [
        // { 
        //   label: 'Credit Reports', 
        //   path: '/credit-reports',
        //   allowedRoles: [UserRole.ADMIN, UserRole.RESELLER, UserRole.USER]
        // },
        { 
          label: 'WhatsApp Report', 
          path: '/whatsapp-report',
          allowedRoles: [UserRole.ADMIN, UserRole.RESELLER, UserRole.USER]
        },
        {
          label: 'All Campaign',
          path: '/all-campaign',
          allowedRoles: [UserRole.ADMIN, UserRole.RESELLER]
        }
      ]
    },
    {
      title: 'OTHERS',
      items: [
        { 
          label: 'News', 
          path: '/news',
          allowedRoles: [UserRole.ADMIN, UserRole.RESELLER, UserRole.USER]
        },
        { 
          label: 'Tree View', 
          path: '/tree-view',
          allowedRoles: [UserRole.ADMIN, UserRole.RESELLER]
        },
        { 
          label: 'Complaints', 
          path: '/complaints',
          allowedRoles: [UserRole.ADMIN, UserRole.RESELLER, UserRole.USER]
        },
        { 
          label: 'Manage Business', 
          path: '/manage-business',
          allowedRoles: [UserRole.ADMIN, UserRole.RESELLER, UserRole.USER]
        },
      ]
    },
  ];
  