import { useState, useEffect } from 'react';
import { Bell, Shield, Moon, Globe, LogOut, ChevronRight, User, CreditCard, HelpCircle, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { auth, logOut, db, OperationType, handleFirestoreError } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { UserSettings } from '../types';

export default function Settings() {
  const [settings, setSettings] = useState<UserSettings>({
    notifications: true,
    privacyMode: false,
    amoledMode: true,
    language: 'English',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!auth.currentUser) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists() && userDoc.data().settings) {
          setSettings(userDoc.data().settings);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'users');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const toggleSetting = async (key: keyof UserSettings) => {
    if (!auth.currentUser) return;
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        settings: newSettings
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'users');
    }
  };

  const sections = [
    {
      title: 'Account',
      items: [
        { icon: User, label: 'Personal Information', value: auth.currentUser?.displayName },
        { icon: CreditCard, label: 'Payment Methods', value: 'KhojAI Wallet' },
        { icon: Shield, label: 'Security & Password', value: 'Protected' },
      ]
    },
    {
      title: 'Preferences',
      items: [
        { 
          icon: Bell, 
          label: 'Push Notifications', 
          type: 'toggle', 
          value: settings.notifications, 
          onToggle: () => toggleSetting('notifications') 
        },
        { 
          icon: Moon, 
          label: 'AMOLED Dark Mode', 
          type: 'toggle', 
          value: settings.amoledMode, 
          onToggle: () => toggleSetting('amoledMode') 
        },
        { 
          icon: Shield, 
          label: 'Privacy Mode', 
          type: 'toggle', 
          value: settings.privacyMode, 
          onToggle: () => toggleSetting('privacyMode') 
        },
        { icon: Globe, label: 'App Language', value: settings.language },
      ]
    },
    {
      title: 'Support',
      items: [
        { icon: HelpCircle, label: 'Help Center' },
        { icon: Info, label: 'About KhojAI', value: 'v1.0.4' },
      ]
    }
  ];

  return (
    <div className="space-y-8 pb-20">
      <header>
        <h1 className="text-3xl font-black tracking-tighter">SETTINGS</h1>
        <p className="text-sm text-gray-400">Manage your account and app preferences</p>
      </header>

      <div className="space-y-8">
        {sections.map((section) => (
          <div key={section.title} className="space-y-4">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 px-4">
              {section.title}
            </h2>
            <div className="glass-card !p-0 overflow-hidden">
              {section.items.map((item, idx) => (
                <div 
                  key={item.label}
                  className={`flex items-center justify-between p-4 hover:bg-white/5 transition-colors cursor-pointer ${
                    idx !== section.items.length - 1 ? 'border-b border-white/5' : ''
                  }`}
                  onClick={() => item.type === 'toggle' ? item.onToggle?.() : null}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{item.label}</p>
                      {item.value && typeof item.value === 'string' && (
                        <p className="text-[10px] text-gray-400">{item.value}</p>
                      )}
                    </div>
                  </div>

                  {item.type === 'toggle' ? (
                    <div className={`h-6 w-11 rounded-full p-1 transition-colors duration-300 ${
                      item.value ? 'bg-primary' : 'bg-white/10'
                    }`}>
                      <div className={`h-4 w-4 rounded-full bg-white transition-transform duration-300 ${
                        item.value ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </div>
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-600" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        <button
          onClick={logOut}
          className="w-full glass-card flex items-center justify-center gap-3 text-red-500 hover:bg-red-500/10 transition-all duration-300 border-red-500/20"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-bold uppercase tracking-widest text-xs">Log Out Account</span>
        </button>
      </div>
    </div>
  );
}
