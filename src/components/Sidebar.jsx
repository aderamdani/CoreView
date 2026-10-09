import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronRight, PanelLeft, PanelLeftClose } from 'lucide-react';
import { buildMenus } from './menus.jsx';
import { PLACEHOLDER_TABS } from './placeholderTabs';

const SIDEBAR_WIDTH_EXPANDED = 220;
const SIDEBAR_WIDTH_COLLAPSED = 60;
const STORAGE_KEY = 'coreview-sidebar-collapsed';

const Flyout = ({ flyoutOpen, menus, activeTab, dataCounts, handleSubItemClick, flyoutTop }) => {
  if (!flyoutOpen || flyoutTop === null) return null;

  const menu = menus.find((m) => m.id === flyoutOpen);
  if (!menu || !menu.submenus) return null;

  return (
    <div
      className="sidebar-flyout"
      role="menu"
      aria-label={`${menu.label} submenu`}
      style={{
        position: 'absolute',
        top: flyoutTop,
        left: SIDEBAR_WIDTH_COLLAPSED,
      }}
    >
      {menu.submenus.map((sub) => (
        <div
          key={sub.id}
          className={`sidebar-flyout-item ${activeTab === sub.id ? 'active' : ''}`}
          onClick={() => handleSubItemClick(sub.id)}
          role="menuitem"
          tabIndex={-1}
          title={sub.label}
        >
          <span>{sub.label}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            {PLACEHOLDER_TABS.has(sub.id) && (
              <span className="sidebar-soon" title="Belum ada isinya, masih dalam pengembangan">
                Segera
              </span>
            )}
            {dataCounts[sub.id] > 0 && (
              <span className="sidebar-count-badge" style={{ marginLeft: '4px' }}>
                {dataCounts[sub.id]}
              </span>
            )}
          </div>
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
  const [flyoutTop, setFlyoutTop] = useState(null);
  const sidebarRef = useRef(null);
  const flyoutTriggerRef = useRef(null);

  const menus = React.useMemo(
    () =>
      buildMenus({
        criticalCount: healthAnalysis.criticalCount,
        warningCount: healthAnalysis.warningCount,
      }),
    [healthAnalysis],
  );

  useEffect(() => {
    if (!controlledCollapsed) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sidebarCollapsed));
    }
  }, [sidebarCollapsed, controlledCollapsed]);

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

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setFlyoutOpen(null);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (flyoutOpen && flyoutTriggerRef.current && sidebarRef.current) {
      const triggerRect = flyoutTriggerRef.current.getBoundingClientRect();
      const sidebarRect = sidebarRef.current.getBoundingClientRect();
      setFlyoutTop(triggerRect.top - sidebarRect.top);
    } else {
      setFlyoutTop(null);
    }
  }, [flyoutOpen]);

  const handleToggleCollapse = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
    setFlyoutOpen(null);
  }, [setSidebarCollapsed]);

  const handleFlyoutTrigger = useCallback(
    (menuId, triggerRef) => {
      if (!sidebarCollapsed) return;
      setFlyoutOpen((prev) => (prev === menuId ? null : menuId));
      flyoutTriggerRef.current = triggerRef;
    },
    [sidebarCollapsed, setFlyoutOpen],
  );

  const toggleMenu = useCallback(
    (menuId) => {
      setExpandedMenus((prev) => ({ ...prev, [menuId]: !prev[menuId] }));
    },
    [setExpandedMenus],
  );

  const handleItemClick = useCallback(
    (menu) => {
      if (menu.submenus) {
        toggleMenu(menu.id);
        if (!expandedMenus[menu.id] && !menu.submenus.some((s) => s.id === activeTab)) {
          setActiveTab(menu.submenus[0].id);
        }
      } else {
        setActiveTab(menu.id);
      }
      if (sidebarCollapsed) {
        setFlyoutOpen(null);
      }
    },
    [toggleMenu, expandedMenus, activeTab, setActiveTab, sidebarCollapsed],
  );

  const handleSubItemClick = useCallback(
    (subId) => {
      setActiveTab(subId);
      if (sidebarCollapsed) {
        setFlyoutOpen(null);
      }
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
        ref={sidebarRef}
        className={`sidebar ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}
        style={{
          width: sidebarCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED,
        }}
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
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
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
            const showBadge = menu.badge || (parentCount > 0 && (hasSubmenus || !hasSubmenus));

            return (
              <li key={menu.id} role="none">
                <div
                  ref={flyoutOpen === menu.id ? flyoutTriggerRef : null}
                  className={`sidebar-item ${isActive && !hasSubmenus ? 'active' : parentActive ? 'parent-active' : ''}`}
                  onClick={() => handleItemClick(menu)}
                  role="menuitem"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleItemClick(menu);
                    }
                    if (e.key === 'ArrowRight' && hasSubmenus && sidebarCollapsed) {
                      e.preventDefault();
                      handleFlyoutTrigger(menu.id, e.currentTarget);
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
                      <span
                        className="sidebar-count-badge"
                        style={menu.badge ? { background: menu.badge.color, color: '#fff' } : undefined}
                      >
                        {menu.badge ? menu.badge.count : parentCount}
                      </span>
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
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                      >
                        <span>{sub.label}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          {PLACEHOLDER_TABS.has(sub.id) && (
                            <span className="sidebar-soon" title="Belum ada isinya, masih dalam pengembangan">
                              Segera
                            </span>
                          )}
                          {dataCounts[sub.id] > 0 && (
                            <span className="sidebar-count-badge" style={{ marginLeft: '4px' }}>
                              {dataCounts[sub.id]}
                            </span>
                          )}
                        </div>
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
        flyoutOpen={flyoutOpen}
        menus={menus}
        activeTab={activeTab}
        dataCounts={dataCounts}
        handleSubItemClick={handleSubItemClick}
        flyoutTop={flyoutTop}
      />
    </>
  );
};

export default Sidebar;
