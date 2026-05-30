import {
  LayoutDashboard, BarChart3, Globe, Image, Building2, MapPin, Search, TrendingUp,
  Users, Shield, Bell, Palette, Send, TestTube,
  DollarSign, FileText, Settings, CreditCard, Landmark, Tag,
  Megaphone, Plus, Zap,
  Mail, Scale,
  MessageSquare, Receipt, Trophy
} from 'lucide-react';

export interface NavItem {
  label: string;
  labelKey?: string;
  path: string;
  icon: React.ReactNode;
}

export interface NavGroup {
  label: string;
  labelKey?: string;
  items: NavItem[];
}

export const adminNavGroups: NavGroup[] = [
  {
    labelKey: 'adminNav.groupMain',
    label: 'KRYESORE',
    items: [
      { labelKey: 'adminNav.dashboard', label: 'Ballina', path: '/admin', icon: <LayoutDashboard className="w-4 h-4" /> },
      { labelKey: 'adminNav.analytics', label: 'Analitika', path: '/admin/analitika', icon: <BarChart3 className="w-4 h-4" /> },
    ],
  },
  {
    labelKey: 'adminNav.groupHomepage',
    label: 'HOMEPAGE & PAMJA',
    items: [
      { labelKey: 'adminNav.homepage', label: 'Settings HomePage', path: '/admin/faqja', icon: <Globe className="w-4 h-4" /> },
      { labelKey: 'adminNav.hero', label: 'Hero Section', path: '/admin/hero', icon: <Image className="w-4 h-4" /> },
      { labelKey: 'adminNav.companies', label: 'Firmat', path: '/admin/kompanite', icon: <Building2 className="w-4 h-4" /> },
      { labelKey: 'adminNav.map', label: 'Harta ne Homepage', path: '/admin/harta', icon: <MapPin className="w-4 h-4" /> },
      { labelKey: 'adminNav.seo', label: 'SEO Google', path: '/admin/seo', icon: <Search className="w-4 h-4" /> },
      { labelKey: 'adminNav.seoReport', label: 'SEO Raporti', path: '/admin/seo-raporti', icon: <TrendingUp className="w-4 h-4" /> },
    ],
  },
  {
    labelKey: 'adminNav.groupUsers',
    label: 'PERDORUESIT & NJOFTIMET',
    items: [
      { labelKey: 'adminNav.users', label: 'Perdoruesit', path: '/admin/perdoruesit', icon: <Users className="w-4 h-4" /> },
      { labelKey: 'adminNav.pinSecurity', label: 'Fshirje e Sigurt (PIN)', path: '/admin/pin-security', icon: <Shield className="w-4 h-4" /> },
      { labelKey: 'adminNav.notifications', label: 'Njoftimet & Zile', path: '/admin/njoftimet', icon: <Bell className="w-4 h-4" /> },
      { labelKey: 'adminNav.notificationDesign', label: 'Dizajni Badge & Push', path: '/admin/notification-design', icon: <Palette className="w-4 h-4" /> },
      { labelKey: 'adminNav.testNotifications', label: 'Test Njoftimet', path: '/admin/test-njoftimet', icon: <TestTube className="w-4 h-4" /> },
      { labelKey: 'adminNav.sendNotifications', label: 'Dergo Njoftime', path: '/admin/dergo-njoftime', icon: <Send className="w-4 h-4" /> },
      { labelKey: 'adminNav.pushLogs', label: 'Push Logs', path: '/admin/push-logs', icon: <Bell className="w-4 h-4" /> },
    ],
  },
  {
    labelKey: 'adminNav.groupFinance',
    label: 'FINANCAT & PAGESAT',
    items: [
      { labelKey: 'adminNav.businessPlan', label: 'Business Plan & Financat', path: '/admin/business-plan', icon: <DollarSign className="w-4 h-4" /> },
      { labelKey: 'adminNav.invoices', label: 'Faturat', path: '/admin/faturat', icon: <FileText className="w-4 h-4" /> },
      { labelKey: 'adminNav.invoiceSettings', label: 'Cilesimet e Fatures', path: '/admin/faturat-cilesimet', icon: <Settings className="w-4 h-4" /> },
      { labelKey: 'adminNav.subscriptionPlans', label: 'Planet e Abonimit', path: '/admin/planet', icon: <CreditCard className="w-4 h-4" /> },
      { labelKey: 'adminNav.transactions', label: 'Pagesat', path: '/admin/transaksionet', icon: <Receipt className="w-4 h-4" /> },
      { labelKey: 'adminNav.bankDetails', label: 'Te Dhenat Bankare', path: '/admin/banka', icon: <Landmark className="w-4 h-4" /> },
      { labelKey: 'adminNav.discounts', label: 'Kode Zbritjesh', path: '/admin/zbritjet', icon: <Tag className="w-4 h-4" /> },
    ],
  },
  {
    labelKey: 'adminNav.groupAds',
    label: 'REKLAMAT & OFERTAT',
    items: [
      { labelKey: 'adminNav.ads', label: 'Reklamat', path: '/admin/reklamat', icon: <Megaphone className="w-4 h-4" /> },
      { labelKey: 'adminNav.createAd', label: 'Krijo Reklame', path: '/admin/reklamat/krijo', icon: <Plus className="w-4 h-4" /> },
      { labelKey: 'adminNav.dailyOffers', label: 'Oferta Ditore', path: '/admin/oferta-ditore', icon: <Zap className="w-4 h-4" /> },
      { labelKey: 'adminNav.loyalty', label: 'Loyalty & Referime', path: '/admin/loyalty', icon: <Trophy className="w-4 h-4" /> },
    ],
  },
  {
    labelKey: 'adminNav.groupSystem',
    label: 'SISTEMI & CILESIMET',
    items: [
      { labelKey: 'adminNav.emailTemplates', label: 'Email Management', path: '/admin/email-templates', icon: <Mail className="w-4 h-4" /> },
      { labelKey: 'adminNav.legalPages', label: 'Faqet Ligjore & Statike', path: '/admin/ligjore', icon: <Scale className="w-4 h-4" /> },
      { labelKey: 'adminNav.chat', label: 'Chat AI', path: '/admin/chat', icon: <MessageSquare className="w-4 h-4" /> },
      { labelKey: 'adminNav.liveChat', label: 'Live Chat (Bisedat)', path: '/admin/live-chat', icon: <MessageSquare className="w-4 h-4" /> },
      { labelKey: 'adminNav.emailHistory', label: 'Historiku Emaileve', path: '/admin/emailet', icon: <Mail className="w-4 h-4" /> },
      { labelKey: 'adminNav.financialReports', label: 'Raportet Financiare', path: '/admin/raportet', icon: <BarChart3 className="w-4 h-4" /> },
      { labelKey: 'adminNav.settings', label: 'Cilesimet', path: '/admin/cilesimet', icon: <Settings className="w-4 h-4" /> },
    ],
  },
];

export const adminNavItems = adminNavGroups.flatMap(g => g.items);
