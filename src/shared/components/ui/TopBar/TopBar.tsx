'use client'
import React, { useState, useContext } from 'react';
import Image from 'next/image';
import SideBar, { SideBarMenuItem } from './SideBar';
// TODO: Create UserProfileDropdown component
// import UserProfileDropdown from '@/shared/components/ui/TopBar/UserProfileDropdown';

interface TopBarProps {
  title: string;
  logoSrc: string;
  menuItems: SideBarMenuItem[]; // Use SideBarMenuItem for consistency with SideBar
  showUserButton?: boolean;
  userName?: string;            // login name, prefixed with @ when displayed
  firstName?: string;           // persona first name
  lastName?: string;            // persona last name
  onOpenChangePassword?: () => void;
}

interface SideBarControl {
  open: () => void;
  close: () => void;
  isOpen: boolean;
  expanded: Record<string, boolean>;
  setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

const SideBarContext = React.createContext<SideBarControl>({
  open: () => {},
  close: () => {},
  isOpen: false,
  expanded: {},
  setExpanded: () => {},
});

export function useSideBar() {
  return useContext(SideBarContext);
}

const TopBar: React.FC<TopBarProps & { className?: string }> = ({
  title,
  logoSrc,
  menuItems = [],
  showUserButton = false,
  userName,
  firstName,
  lastName,
  onOpenChangePassword,
  className = ""
}) => {
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState<Record<string, boolean>>({});
  const [logoError, setLogoError] = useState(false);

  const resolvedUserName = [firstName, lastName]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .join(' ')
    .trim() || (typeof userName === 'string' ? userName.trim() : '');

  const open = () => setShowSidebar(true);
  const close = () => setShowSidebar(false);

  return (
    <SideBarContext.Provider value={{ open, close, isOpen: showSidebar, expanded: sidebarExpanded, setExpanded: setSidebarExpanded }}>
        <div data-test-id="top-bar-root">
      <header className={`fixed top-0 z-30 w-full flex items-center justify-between px-10 py-2 pb-3 bg-background border-b-[2px] border-primary ${className}`}>
          <div className="flex items-center gap-3">
            {logoSrc ? (
              !logoError ? (
                <Image
                  src={logoSrc}
                  alt="Logo Paddy"
                  width={40}
                  height={40}
                  unoptimized
                  className="h-10 w-10 object-contain"
                  data-test-id="top-bar-logo"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div className="h-10 w-10 bg-neutral-300 rounded-lg flex items-center justify-center" data-test-id="top-bar-logo-fallback">
                  <span className="material-symbols-outlined text-neutral-400" style={{ fontSize: 20 }}>
                    image_not_supported
                  </span>
                </div>
              )
            ) : (
              <div className="h-10 w-10 bg-neutral-300 rounded-lg flex items-center justify-center" data-test-id="top-bar-logo-placeholder">
                <span className="material-symbols-outlined text-neutral-400" style={{ fontSize: 20 }}>
                  image
                </span>
              </div>
            )}
            {title && title.trim() && (
              <span className="text-lg font-bold text-foreground" data-test-id="top-bar-title">{title}</span>
            )}
          </div>

          {/* Right side elements */}
          <div className="flex items-center gap-2">
            {/* Display logged user name before menu button */}
            {resolvedUserName && (
              <span className="max-w-56 truncate text-sm font-normal text-foreground" data-test-id="top-bar-user-name" title={resolvedUserName}>
                {resolvedUserName}
              </span>
            )}

            {/* User Profile Dropdown */}
            {showUserButton && (
              <>
                {/* TODO: Uncomment when UserProfileDropdown component is created */}
                {/* <UserProfileDropdown /> */}
              </>
            )}

            {/* Menu button */}
            <button
              type="button"
              onClick={open}
              className="flex h-10 w-10 items-center justify-center rounded-full transition-colors text-foreground hover:text-secondary focus:outline-none"
              data-test-id="top-bar-menu-button"
              aria-label="Abrir menú"
            >
              <span className="material-symbols-outlined text-2xl" aria-hidden>
                menu
              </span>
            </button>
          </div>
        </header>
        {/* Renderizar SideBar como modal, solo si showSidebar está activo */}
        {showSidebar && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/10"
              onClick={close}
              aria-label="Cerrar menú lateral"
              data-test-id="sidebar-overlay"
            />
            <SideBar
              menuItems={menuItems}
              onClose={close}
              logoUrl={logoSrc}
              expandedState={sidebarExpanded}
              onExpandedChange={setSidebarExpanded}
              onOpenChangePassword={onOpenChangePassword}
            />
          </>
        )}
        {/* Children se renderizan fuera de TopBar, en el layout */}
      </div>
    </SideBarContext.Provider>
  );
};

export default TopBar;
