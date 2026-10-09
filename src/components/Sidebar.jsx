import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ChevronRight, PanelLeft, PanelLeftClose } from 'lucide-react';
import { buildMenus } from './menus.jsx';
import { PLACEHOLDER_TABS } from './placeholderTabs';

const STORAGE_KEY = 'coreview-sidebar-collapsed';

/**
 * Submenu yang muncul di samping rail saat sidebar dalam keadaan collapsed.
 * Ditempatkan fixed memakai koordinat viewport karena sidebar bersifat sticky
 * dan scrollable, sehingga elemen absolute bersaudara dengannya akan mengacu ke
 * kotak yang salah dan terpotong oleh overflow sidebar itu sendiri.
 */
const Flyout = ({ menu, activeTab, dataCounts, position, onItemClick, onItemKeyDown, itemRef }) => {
  if (!menu || !position) return null;

  return (
    <div
      className="sidebar-flyout"
      role="menu"
      aria-label={`Submenu ${menu.label}`}
      // Posisi diukur dari trigger saat runtime, jadi tidak bisa ditaruh di CSS.
      style={{ top: position.top, left: position.left }}
    >
      {menu.submenus.map((sub, index) => (
        <div
          key={sub.id}
          ref={(el) => {
            itemRef.current[index] = el;
          }}
          className={`sidebar-flyout-item ${activeTab === sub.id ? 'active' : ''}`}
          onClick={() => onItemClick(sub.id)}
          role="menuitem"
          tabIndex={0}
          onKeyDown={(e) => onItemKeyDown(e, index)}
        >
          <span>{sub.label}</span>
          <span className="sidebar-flyout-trailing">
            {PLACEHOLDER_TABS.has(sub.id) && (
              <span className="sidebar-soon" title="Belum ada isinya, masih dalam pengembangan">
                Segera
              </span>
            )}
            {dataCounts[sub.id] > 0 && <span className="sidebar-count-badge">{dataCounts[sub.id]}</span>}
          </span>
        </div>
      ))}
    </div>
  );
};

export const Sidebar = ({
  config,
  healthAnalysis,
  dataCounts,
  activeTab,
  setActiveTab,
  expandedMenus,
  setExpandedMenus,
  sidebarCollapsed: controlledCollapsed,
  onSidebarCollapseChange,
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'false');
    } catch {
      return false;
    }
  });

  const sidebarCollapsed = controlledCollapsed ?? internalCollapsed;
  const setSidebarCollapsed = onSidebarCollapseChange ?? setInternalCollapsed;

  const [flyoutOpen, setFlyoutOpen] = useState(null);
  const [flyoutPosition, setFlyoutPosition] = useState(null);
  const flyoutTriggerRef = useRef(null);
  const flyoutItemRefs = useRef([]);

  const menus = useMemo(
    () =>
      buildMenus({
        criticalCount: healthAnalysis.criticalCount,
        warningCount: healthAnalysis.warningCount,
      }),
    [healthAnalysis],
  );

  const flyoutMenu = useMemo(() => menus.find((m) => m.id === flyoutOpen) || null, [menus, flyoutOpen]);
  const flyoutCount = flyoutMenu?.submenus?.length ?? 0;

  const persistCollapsed = useCallback((value) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch {
      // Storage bisa tidak tersedia, misalnya di mode privat. Sidebar tetap
      // berfungsi, hanya tidak mengingat pilihannya.
    }
  }, []);

  const closeFlyout = useCallback((restoreFocus) => {
    setFlyoutOpen(null);
    if (restoreFocus) flyoutTriggerRef.current?.focus();
  }, []);

  const openFlyout = useCallback(
    (menuId, triggerEl) => {
      if (triggerEl) flyoutTriggerRef.current = triggerEl;
      if (flyoutOpen === menuId) {
        setFlyoutOpen(null);
        return;
      }
      // Posisi diukur dari trigger di sini, bukan di efek, supaya tidak ada
      // setState di dalam effect yang memicu render berantai.
      if (triggerEl) {
        const rect = triggerEl.getBoundingClientRect();
        setFlyoutPosition({ top: rect.top, left: rect.right + 8 });
      }
      setFlyoutOpen(menuId);
    },
    [flyoutOpen],
  );

  const handleToggleCollapse = useCallback(() => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    // Hanya pilihan eksplisit pengguna yang disimpan. Auto-collapse di layar
    // sempit sengaja tidak menyimpan, supaya mengubah ukuran jendela tidak
    // menimpa preferensi yang diset di layar lebar.
    persistCollapsed(next);
    setFlyoutOpen(null);
  }, [sidebarCollapsed, setSidebarCollapsed, persistCollapsed]);

  // Pindahkan fokus ke item pertama supaya flyout bisa dijangkau keyboard.
  useEffect(() => {
    if (flyoutOpen) flyoutItemRefs.current[0]?.focus();
  }, [flyoutOpen]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && !sidebarCollapsed) {
        setSidebarCollapsed(true);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarCollapsed, setSidebarCollapsed]);

  // Escape menutup flyout dan mengembalikan fokus ke trigger.
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && flyoutOpen) closeFlyout(true);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [flyoutOpen, closeFlyout]);

  // Menu fixed akan tertinggal dari triggernya kalau halaman digulir.
  useEffect(() => {
    if (!flyoutOpen) return undefined;
    const close = () => setFlyoutOpen(null);
    window.addEventListener('scroll', close, true);
    return () => window.removeEventListener('scroll', close, true);
  }, [flyoutOpen]);

  const handleFlyoutItemKeyDown = useCallback(
    (e, index) => {
      if (flyoutCount === 0) return;
      const focusAt = (i) => flyoutItemRefs.current[i]?.focus();
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        focusAt((index + 1) % flyoutCount);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        focusAt((index - 1 + flyoutCount) % flyoutCount);
      } else if (e.key === 'Home') {
        e.preventDefault();
        focusAt(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        focusAt(flyoutCount - 1);
      }
    },
    [flyoutCount],
  );

  const toggleMenu = useCallback(
    (menuId) => {
      setExpandedMenus((prev) => ({ ...prev, [menuId]: !prev[menuId] }));
    },
    [setExpandedMenus],
  );

  const handleItemClick = useCallback(
    (menu, triggerEl) => {
      if (sidebarCollapsed) {
        if (menu.submenus) {
          // Di rail tidak ada ruang untuk label, jadi parent membuka flyout,
          // bukan mengembangkan submenu inline.
          openFlyout(menu.id, triggerEl);
        } else {
          setActiveTab(menu.id);
          setFlyoutOpen(null);
        }
        return;
      }
      if (menu.submenus) {
        toggleMenu(menu.id);
        if (!expandedMenus[menu.id] && !menu.submenus.some((s) => s.id === activeTab)) {
          setActiveTab(menu.submenus[0].id);
        }
      } else {
        setActiveTab(menu.id);
      }
    },
    [sidebarCollapsed, openFlyout, toggleMenu, expandedMenus, activeTab, setActiveTab],
  );

  const handleSubItemClick = useCallback(
    (subId) => {
      setActiveTab(subId);
      if (sidebarCollapsed) setFlyoutOpen(null);
    },
    [setActiveTab, sidebarCollapsed],
  );

  const getParentCount = (menu) => {
    if (!menu.submenus) return dataCounts[menu.id] || 0;
    return menu.submenus.reduce((s, sub) => s + (dataCounts[sub.id] || 0), 0);
  };

  const isParentActive = (menu) => {
    return menu.submenus && menu.submenus.some((s) => s.id === activeTab);
  };

  return (
    <>
      <aside
        className={`sidebar ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}
        aria-label="Navigasi sidebar"
      >
        <div className="sidebar-header">
          <div className="sidebar-logo" aria-hidden="true">
            {sidebarCollapsed
              ? 'CV'
              : config?.system?.identity?.name || config?.metadata?.identity || 'CoreView'}
          </div>
          <button
            className="sidebar-toggle"
            onClick={handleToggleCollapse}
            aria-expanded={!sidebarCollapsed}
            aria-label={sidebarCollapsed ? 'Buka sidebar' : 'Tutup sidebar'}
            title={sidebarCollapsed ? 'Buka sidebar' : 'Tutup sidebar'}
          >
            {sidebarCollapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>

        <ul className="sidebar-menu" role="menubar">
          {menus.map((menu) => {
            const hasSubmenus = !!menu.submenus;
            const isMenuExpanded = expandedMenus[menu.id];
            const isActive = activeTab === menu.id;
            const parentActive = isParentActive(menu);
            const parentCount = getParentCount(menu);
            const showBadge = menu.badge || parentCount > 0;
            const badgeLevel = menu.badge ? ` sidebar-count-badge-${menu.badge.level}` : '';

            return (
              <li key={menu.id} role="none">
                <div
                  className={`sidebar-item ${isActive && !hasSubmenus ? 'active' : parentActive ? 'parent-active' : ''}`}
                  onClick={(e) => handleItemClick(menu, e.currentTarget)}
                  role="menuitem"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleItemClick(menu, e.currentTarget);
                    }
                    if (e.key === 'ArrowRight' && hasSubmenus && sidebarCollapsed) {
                      e.preventDefault();
                      openFlyout(menu.id, e.currentTarget);
                    }
                  }}
                  aria-expanded={hasSubmenus ? isMenuExpanded : undefined}
                  aria-label={sidebarCollapsed ? menu.label : undefined}
                >
                  <div className="sidebar-item-content">
                    {menu.icon}
                    {!sidebarCollapsed && <span>{menu.label}</span>}
                  </div>
                  <div className="sidebar-item-trailing">
                    {!sidebarCollapsed && !hasSubmenus && PLACEHOLDER_TABS.has(menu.id) && (
                      <span className="sidebar-soon" title="Belum ada isinya, masih dalam pengembangan">
                        Segera
                      </span>
                    )}
                    {!sidebarCollapsed && showBadge && (
                      <span className={`sidebar-count-badge${badgeLevel}`}>
                        {menu.badge ? menu.badge.count : parentCount}
                      </span>
                    )}
                    {sidebarCollapsed && showBadge && (
                      <span
                        className={`sidebar-dot${badgeLevel ? ` sidebar-dot-${menu.badge.level}` : ''}`}
                        aria-hidden="true"
                      />
                    )}
                    {hasSubmenus && !sidebarCollapsed && (
                      <ChevronRight size={13} className={`sidebar-chevron ${isMenuExpanded ? 'open' : ''}`} />
                    )}
                  </div>
                </div>

                {!sidebarCollapsed && hasSubmenus && isMenuExpanded && (
                  <div className="sidebar-submenus" role="menu">
                    {menu.submenus.map((sub) => (
                      <div
                        key={sub.id}
                        className={`sidebar-subitem ${activeTab === sub.id ? 'active' : ''}`}
                        onClick={() => handleSubItemClick(sub.id)}
                        role="menuitem"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleSubItemClick(sub.id);
                          }
                        }}
                        title={sub.label}
                      >
                        <span>{sub.label}</span>
                        <span className="sidebar-subitem-trailing">
                          {PLACEHOLDER_TABS.has(sub.id) && (
                            <span className="sidebar-soon" title="Belum ada isinya, masih dalam pengembangan">
                              Segera
                            </span>
                          )}
                          {dataCounts[sub.id] > 0 && (
                            <span className="sidebar-count-badge">{dataCounts[sub.id]}</span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </aside>

      <Flyout
        menu={sidebarCollapsed ? flyoutMenu : null}
        activeTab={activeTab}
        dataCounts={dataCounts}
        position={flyoutPosition}
        onItemClick={handleSubItemClick}
        onItemKeyDown={handleFlyoutItemKeyDown}
        itemRef={flyoutItemRefs}
      />
    </>
  );
};
