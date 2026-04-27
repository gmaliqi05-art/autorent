import {
  LayoutDashboard, BarChart3, Globe, Image, Building2, MapPin, Search, TrendingUp,
  Users, Shield, Bell, Palette, Send, TestTube,
  DollarSign, FileText, Settings, CreditCard, Landmark, Tag,
  Megaphone, Plus, Zap,
  Mail, Scale,
  Map, MessageSquare, Receipt
} from 'lucide-react';

export interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const adminNavGroups: NavGroup[] = [
  {
    label: 'KRYESORE',
    items: [
      { label: 'Ballina', path: '/admin', icon: <LayoutDashboard className="w-4 h-4" /> },
      { label: 'Analitika', path: '/admin/analitika', icon: <BarChart3 className="w-4 h-4" /> },
    ],
  },
  {
    label: 'HOMEPAGE & PAMJA',
    items: [
      { label: 'Settings HomePage', path: '/admin/faqja', icon: <Globe className="w-4 h-4" /> },
      { label: 'Hero Section', path: '/admin/hero', icon: <Image className="w-4 h-4" /> },
      { label: 'Firmat', path: '/admin/kompanite', icon: <Building2 className="w-4 h-4" /> },
      { label: 'Harta ne Homepage', path: '/admin/harta', icon: <MapPin className="w-4 h-4" /> },
      { label: 'SEO Google', path: '/admin/seo', icon: <Search className="w-4 h-4" /> },
      { label: 'SEO Raporti', path: '/admin/seo-raporti', icon: <TrendingUp className="w-4 h-4" /> },
    ],
  },
  {
    label: 'PERDORUESIT & NJOFTIMET',
    items: [
      { label: 'Perdoruesit', path: '/admin/perdoruesit', icon: <Users className="w-4 h-4" /> },
      { label: 'Fshirje e Sigurt (PIN)', path: '/admin/pin-security', icon: <Shield className="w-4 h-4" /> },
      { label: 'Njoftimet & Zile', path: '/admin/njoftimet', icon: <Bell className="w-4 h-4" /> },
      { label: 'Dizajni Badge & Push', path: '/admin/notification-design', icon: <Palette className="w-4 h-4" /> },
      { label: 'Test Njoftimet', path: '/admin/test-njoftimet', icon: <TestTube className="w-4 h-4" /> },
      { label: 'Dergo Njoftime', path: '/admin/dergo-njoftime', icon: <Send className="w-4 h-4" /> },
    ],
  },
  {
    label: 'FINANCAT & PAGESAT',
    items: [
      { label: 'Business Plan & Financat', path: '/admin/business-plan', icon: <DollarSign className="w-4 h-4" /> },
      { label: 'Faturat', path: '/admin/faturat', icon: <FileText className="w-4 h-4" /> },
      { label: 'Cilesimet e Fatures', path: '/admin/faturat-cilesimet', icon: <Settings className="w-4 h-4" /> },
      { label: 'Planet e Abonimit', path: '/admin/planet', icon: <CreditCard className="w-4 h-4" /> },
      { label: 'Pagesat', path: '/admin/transaksionet', icon: <Receipt className="w-4 h-4" /> },
      { label: 'Te Dhenat Bankare', path: '/admin/banka', icon: <Landmark className="w-4 h-4" /> },
      { label: 'Kode Zbritjesh', path: '/admin/zbritjet', icon: <Tag className="w-4 h-4" /> },
    ],
  },
  {
    label: 'REKLAMAT & OFERTAT',
    items: [
      { label: 'Reklamat', path: '/admin/reklamat', icon: <Megaphone className="w-4 h-4" /> },
      { label: 'Krijo Reklame', path: '/admin/reklamat/krijo', icon: <Plus className="w-4 h-4" /> },
      { label: 'Oferta Ditore', path: '/admin/oferta-ditore', icon: <Zap className="w-4 h-4" /> },
    ],
  },
  {
    label: 'SISTEMI & CILESIMET',
    items: [
      { label: 'Email Management', path: '/admin/email-templates', icon: <Mail className="w-4 h-4" /> },
      { label: 'Faqet Ligjore & Statike', path: '/admin/ligjore', icon: <Scale className="w-4 h-4" /> },
      { label: 'Chat AI', path: '/admin/chat', icon: <MessageSquare className="w-4 h-4" /> },
      { label: 'Historiku Emaileve', path: '/admin/emailet', icon: <Mail className="w-4 h-4" /> },
      { label: 'Raportet Financiare', path: '/admin/raportet', icon: <BarChart3 className="w-4 h-4" /> },
      { label: 'Cilesimet', path: '/admin/cilesimet', icon: <Settings className="w-4 h-4" /> },
    ],
  },
];

export const adminNavItems = adminNavGroups.flatMap(g => g.items);
