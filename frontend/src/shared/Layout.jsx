// import { Outlet, useNavigate, useLocation } from "react-router-dom";
// import { useState, useEffect } from "react";
// import { BellOutlined, ExclamationCircleOutlined, ToolOutlined } from "@ant-design/icons";
// import { Badge, Dropdown, List, Typography, Button, Space } from "antd";
// import vaLogo from "../assets/VA.png";
// import lightLogo from "../assets/hi.jpg";
// import { getUserRole, getUsername, isTownAdmin } from "../service/auth";
// import api from "../service/api";


// const { Text } = Typography;

// const navArray = [
//   { label: "Dashboard", path: "/dashboard" },
//   {
//     label: "Employee",
//     children: [
//       { label: "List", path: "/employee/list" },
//       { label: "Attendance", path: "/employee/attendance" },
//     ],
//   },
//   { label: "Daily Entry", path: "/daily-entry" },
//   { label: "Purchase Order", path: "/purchase-order" },
//   { label: "Item Management", path: "/item-management" },
//   { label: "Service Management", path: "/service-management" },
//   { label: "Inventory Management", path: "/inventory-management" },
//   { label: "Machine Items", path: "/item-instances", icon: <ToolOutlined /> },
//   { label: "Machine", path: "/vehicle" },
//   { label: "Compressor", path: "/compressor" },
//   {
//     label: "Reports",
//     children: [
//       { label: "Item Stock Report", path: "/reports/item-stock" },
//       { label: "Production Report", path: "/reports/production" },
//     ],
//   },
//   { label: "Brand", path: "/brand" },
//   { label: "Site", path: "/site" },
//   { label: "Supplier", path: "/supplier" },
//   { label: "Address", path: "/address" },
//   { label: "User Management", path: "/user-management", adminOnly: true },
// ];

// export default function Layout() {
//   const [activeMenu, setActiveMenu] = useState(null);
//   const [showUserDropdown, setShowUserDropdown] = useState(false);
//   const [serviceAlerts, setServiceAlerts] = useState([]);
//   const [alertsLoading, setAlertsLoading] = useState(false);
//   const navigate = useNavigate();
//   const location = useLocation();

//   // Fetch urgent service alerts for notifications (RPM difference < 50)
//   const fetchServiceAlerts = async () => {
//     try {
//       setAlertsLoading(true);
//       const response = await api.get("/api/service-alerts/urgent");
//       const alerts = response.data.data || [];
//       setServiceAlerts(alerts);
//       return alerts;
//     } catch (error) {
//       console.error("Error fetching urgent service alerts:", error);
//       setServiceAlerts([]);
//       return [];
//     } finally {
//       setAlertsLoading(false);
//     }
//   };

//   // Fetch alerts on component mount and every 5 minutes
//   useEffect(() => {
//     let interval;
//     fetchServiceAlerts()
//       .then(() => {
//         interval = setInterval(fetchServiceAlerts, 5 * 60 * 1000);
//       })
//       .catch(() => {
//         // do nothing; error handled inside
//       });
//     return () => interval && clearInterval(interval);
//   }, []);

//   function logout() {
//     localStorage.removeItem("token");
//     navigate("/login", { replace: true });
//   }

//   const handleNavClick = (item) => {
//     if (item.children) {
//       setActiveMenu(item.label === activeMenu ? null : item.label);
//     } else {
//       navigate(item.path);
//       setActiveMenu(null);
//     }
//   };

//   const handleSubNavClick = (path) => {
//     navigate(path);
//     setActiveMenu(null);
//   };

//   const isActiveRoute = (path) => location.pathname === path;

//   const isParentActive = (item) => {
//     if (item.children) {
//       return item.children.some((child) => location.pathname === child.path);
//     }
//     return location.pathname === item.path;
//   };

//   // Filter navigation based on user role
//   const filteredNavArray = navArray.filter((item) => {
//     // Only xtown-admin should see User Management
//     if (item.adminOnly) {
//       return isTownAdmin();
//     }
//     // Everyone else sees all other items as per normal auth
//     return true;
//   });

//   return (
//     <div className="min-h-screen bg-gray-50 overflow-auto">
//       {/* Header */}
//       <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center h-16 bg-gradient-to-r from-purple-900 via-purple-800 to-purple-600 shadow-lg">
//         <div className="flex items-center pl-6">
//           <img src={vaLogo} className="h-10 w-auto" />
//         </div>
//         {/* <span
//         className="dev"
//         >Developed by <a href="https://instagram.com/last_autumnleaf/">:)</a> aravindh</span> */}
//         <div className="relative pr-6 flex items-center gap-3 text-white/90">
//           {/* Service Alerts Notification */}
//           <Dropdown
//             menu={{
//               items: [
//                 {
//                   key: 'alerts-header',
//                   label: (
//                     <div className="p-4 border-b border-gray-200">
//                       <div className="flex justify-between items-center">
//                         <Text strong className="text-lg">Service Alerts</Text>
//                         <Badge count={serviceAlerts.length} style={{ backgroundColor: serviceAlerts.some(a => a.priority === 'high') ? '#ff4d4f' : '#faad14' }} />
//                       </div>
//                     </div>
//                   ),
//                   type: 'group'
//                 },
//                 ...(serviceAlerts.length > 0 ? serviceAlerts.map((alert, index) => ({
//                   key: `alert-${index}`,
//                   label: (
//                     <div className="w-full">
//                       <div className="flex items-start gap-2">
//                         <ExclamationCircleOutlined 
//                           className={`mt-1 ${
//                             alert.priority === 'high' ? 'text-red-500' : 
//                             alert.priority === 'medium' ? 'text-orange-500' : 
//                             'text-yellow-500'
//                           }`} 
//                         />
//                         <div className="flex-1">
//                           <div className="font-medium">{alert.name}</div>
//                           <div className="text-sm text-gray-600">{alert.message}</div>
//                           <div className="text-xs text-gray-500 mt-1">
//                             Current: {alert.currentRPM} RPM | Next Service: {alert.nextServiceRPM} RPM
//                             {alert.overdue > 0 && (
//                               <span className="text-red-600 font-semibold ml-2">
//                                 ({alert.overdue} RPM overdue)
//                               </span>
//                             )}
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   ),
//                   onClick: () => navigate("/service-management")
//                 })) : [{
//                   key: 'no-alerts',
//                   label: (
//                     <div className="p-6 text-center text-gray-500">
//                       <Text>No service alerts at this time</Text>
//                     </div>
//                   )
//                 }]),
//                 {
//                   key: 'view-management',
//                   label: (
//                     <div className="p-3 border-t border-gray-200 text-center">
//                       <Button 
//                         type="link" 
//                         onClick={() => navigate("/service-management")}
//                         className="w-full"
//                       >
//                         View Service Management
//                       </Button>
//                     </div>
//                   )
//                 }
//               ]
//             }}
//             trigger={["click"]}
//             placement="bottomRight"
//             popupRender={(menu) => (
//               <div className="bg-white rounded-lg shadow-lg max-w-md" style={{ maxHeight: "400px", overflowY: "auto" }}>
//                 {menu}
//               </div>
//             )}
//           >
//             <button className="relative hover:bg-white/10 p-2 rounded-full transition-colors">
//               <Badge 
//                 count={serviceAlerts.length} 
//                 overflowCount={99}
//                 style={{ 
//                   backgroundColor: serviceAlerts.some(a => a.priority === 'high') ? '#ff4d4f' : 
//                                    serviceAlerts.some(a => a.priority === 'medium') ? '#faad14' : '#52c41a' 
//                 }}
//               >
//                 <BellOutlined className="text-xl" style={{ color: 'white' }} />
//               </Badge>
//             </button>
//           </Dropdown>

//           <span className="hidden sm:inline-block text-sm opacity-90">
//             {getUsername() || "User"}
//           </span>
//           <div
//             className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/30 transition-all duration-200"
//             onClick={() => setShowUserDropdown((prev) => !prev)}
//           >
//             <svg
//               className="w-5 h-5 text-white"
//               fill="none"
//               stroke="currentColor"
//               viewBox="0 0 24 24"
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth={2}
//                 d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
//               />
//             </svg>
//           </div>

//           {showUserDropdown && (
//             <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-xl p-2 z-50 min-w-[120px] border">
//               <button
//                 className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded transition-colors"
//                 onClick={logout}
//               >
//                 Logout
//               </button>
//             </div>
//           )}
//         </div>
//       </header>

//       <div className="flex min-h-[calc(100vh-4rem)] pt-16">
//         {/* Main Sidebar */}
//         <aside className="hidden sm:flex w-64 bg-white shadow-lg border-r border-gray-200 flex-col fixed left-0 top-16 bottom-0 z-40">
//           <div className="p-4 flex-1 overflow-y-auto sidebar-scroll">
            
//             <div className="flex flex-col space-y-1">
//               {filteredNavArray.map((item) => (
//                 <button
//                   key={item.label}
//                   className={`
//                     w-full text-left px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-between
//                     ${
//                       isParentActive(item) || activeMenu === item.label
//                         ? "bg-purple-50 text-purple-700 border-l-4 border-purple-600"
//                         : "text-gray-700 hover:bg-gray-50 hover:text-purple-600"
//                     }
//                   `}
//                   onClick={() => handleNavClick(item)}
//                 >
//                   <span>{item.label}</span>
//                   {item.children && (
//                     <svg
//                       className={`w-4 h-4 transition-transform ${
//                         activeMenu === item.label ? "rotate-90" : ""
//                       }`}
//                       fill="none"
//                       stroke="currentColor"
//                       viewBox="0 0 24 24"
//                     >
//                       <path
//                         strokeLinecap="round"
//                         strokeLinejoin="round"
//                         strokeWidth={2}
//                         d="M9 5l7 7-7 7"
//                       />
//                     </svg>
//                   )}
//                 </button>
//               ))}
//             </div>
//           </div>
          
//           {/* Sidebar Bottom - Light Logo - Fixed */}
//           <div className="p-4 border-t border-gray-200 bg-white">
//             <div className="flex justify-center">
//               <img src={lightLogo} className="h-8 w-auto opacity-60" alt="Light Logo" />
//             </div>
//           </div>
//         </aside>

//         {/* Sub Sidebar */}
//         {activeMenu && (
//           <aside className="hidden sm:block w-56 bg-gray-50 border-r border-gray-200 fixed left-64 top-16 bottom-0 z-30">
//             <div className="p-4 h-full overflow-y-auto sidebar-scroll">
//               <div className="mb-4">
//                 <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wide">
//                   {activeMenu}
//                 </h3>
//               </div>
//               <div className="flex flex-col space-y-1">
//                 {filteredNavArray
//                   .find((x) => x.label === activeMenu)
//                   ?.children?.map((sub) => (
//                     <button
//                       key={sub.label}
//                       className={`
//                         w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all duration-200
//                         ${
//                           isActiveRoute(sub.path)
//                             ? "bg-purple-100 text-purple-700 font-medium"
//                             : "text-gray-600 hover:bg-gray-100 hover:text-purple-600"
//                         }
//                       `}
//                       onClick={() => handleSubNavClick(sub.path)}
//                     >
//                       {sub.label}
//                     </button>
//                   ))}
//               </div>
//             </div>
//           </aside>
//         )}

//         {/* Main content area */}
//         <main className={`flex-1 bg-gray-50 flex flex-col ${activeMenu ? 'sm:ml-56' : 'sm:ml-64'} pb-16 main-content-scroll`}>
//           <div className="p-6 flex-1">
//             <Outlet />
//           </div>
          
         
//         </main>
//       </div>
//     </div>
//   );
// }

import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { BellOutlined, ExclamationCircleOutlined, ToolOutlined, MenuOutlined } from "@ant-design/icons";
import { Badge, Dropdown, List, Typography, Button, Space } from "antd";
import vaLogo from "../assets/VA.png";
import lightLogo from "../assets/hi.jpg";
import { getUserRole, getUsername, isTownAdmin } from "../service/auth";
import api from "../service/api";


const { Text } = Typography;

const navArray = [
  { label: "Dashboard", path: "/dashboard" },
  {
    label: "Employee",
    children: [
      { label: "List", path: "/employee/list" },
      { label: "Attendance", path: "/employee/attendance" },
    ],
  },
  { label: "Daily Entry", path: "/daily-entry" },
  { label: "Purchase Order", path: "/purchase-order" },
  { label: "Item Management", path: "/item-management" },
  { label: "Service Management", path: "/service-management" },
  { label: "Inventory Management", path: "/inventory-management" },
  { label: "Machine Items", path: "/item-instances", icon: <ToolOutlined /> },
  { label: "Machine", path: "/vehicle" },
  { label: "Compressor", path: "/compressor" },
  {
    label: "Reports",
    children: [
      { label: "Item Stock Report", path: "/reports/item-stock" },
      { label: "Production Report", path: "/reports/production" },
    ],
  },
  { label: "Brand", path: "/brand" },
  { label: "Site", path: "/site" },
  { label: "Supplier", path: "/supplier" },
  { label: "Address", path: "/address" },
  { label: "User Management", path: "/user-management", adminOnly: true },
];

export default function Layout() {
  const [activeMenu, setActiveMenu] = useState(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [serviceAlerts, setServiceAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch urgent service alerts for notifications (RPM difference < 50)
  const fetchServiceAlerts = async () => {
    try {
      setAlertsLoading(true);
      const response = await api.get("/api/service-alerts/urgent");
      const alerts = response.data.data || [];
      setServiceAlerts(alerts);
      return alerts;
    } catch (error) {
      console.error("Error fetching urgent service alerts:", error);
      setServiceAlerts([]);
      return [];
    } finally {
      setAlertsLoading(false);
    }
  };

  // Fetch alerts on component mount and every 5 minutes
  useEffect(() => {
    let interval;
    fetchServiceAlerts()
      .then(() => {
        interval = setInterval(fetchServiceAlerts, 5 * 60 * 1000);
      })
      .catch(() => {
        // do nothing; error handled inside
      });
    return () => interval && clearInterval(interval);
  }, []);

  function logout() {
    localStorage.removeItem("token");
    navigate("/login", { replace: true });
  }

  const handleNavClick = (item) => {
    if (item.children) {
      setActiveMenu(item.label === activeMenu ? null : item.label);
    } else {
      navigate(item.path);
      setActiveMenu(null);
      setSidebarOpen(false);
    }
  };

  const handleSubNavClick = (path) => {
    navigate(path);
    setActiveMenu(null);
    setSidebarOpen(false);
  };

  const isActiveRoute = (path) => location.pathname === path;

  const isParentActive = (item) => {
    if (item.children) {
      return item.children.some((child) => location.pathname === child.path);
    }
    return location.pathname === item.path;
  };

  // Filter navigation based on user role
  const filteredNavArray = navArray.filter((item) => {
    // Only xtown-admin should see User Management
    if (item.adminOnly) {
      return isTownAdmin();
    }
    // Everyone else sees all other items as per normal auth
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 ">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center h-16 bg-gradient-to-r from-purple-900 via-purple-800 to-purple-600 shadow-lg">
        <div className="flex items-center pl-6 gap-20">
          <img src={vaLogo} className="h-10 w-auto" />

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
          >
            <MenuOutlined className="text-xl" />
          </button>
        </div>
        {/* <span
        className="dev"
        >Developed by <a href="https://instagram.com/last_autumnleaf/">:)</a> aravindh</span> */}
        <div className="relative pr-6 flex items-center gap-3 text-white/90">
          {/* Service Alerts Notification */}
          <Dropdown
            menu={{
              items: [
                {
                  key: 'alerts-header',
                  label: (
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex justify-between items-center">
                        <Text strong className="text-lg">Service Alerts</Text>
                        <Badge count={serviceAlerts.length} style={{ backgroundColor: serviceAlerts.some(a => a.priority === 'high') ? '#ff4d4f' : '#faad14' }} />
                      </div>
                    </div>
                  ),
                  type: 'group'
                },
                ...(serviceAlerts.length > 0 ? serviceAlerts.map((alert, index) => ({
                  key: `alert-${index}`,
                  label: (
                    <div className="w-full">
                      <div className="flex items-start gap-2">
                        <ExclamationCircleOutlined 
                          className={`mt-1 ${
                            alert.priority === 'high' ? 'text-red-500' : 
                            alert.priority === 'medium' ? 'text-orange-500' : 
                            'text-yellow-500'
                          }`} 
                        />
                        <div className="flex-1">
                          <div className="font-medium">{alert.name}</div>
                          <div className="text-sm text-gray-600">{alert.message}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            Current: {alert.currentRPM} RPM | Next Service: {alert.nextServiceRPM} RPM
                            {alert.overdue > 0 && (
                              <span className="text-red-600 font-semibold ml-2">
                                ({alert.overdue} RPM overdue)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ),
                  onClick: () => navigate("/service-management")
                })) : [{
                  key: 'no-alerts',
                  label: (
                    <div className="p-6 text-center text-gray-500">
                      <Text>No service alerts at this time</Text>
                    </div>
                  )
                }]),
                {
                  key: 'view-management',
                  label: (
                    <div className="p-3 border-t border-gray-200 text-center">
                      <Button 
                        type="link" 
                        onClick={() => navigate("/service-management")}
                        className="w-full"
                      >
                        View Service Management
                      </Button>
                    </div>
                  )
                }
              ]
            }}
            trigger={["click"]}
            placement="bottomRight"
            popupRender={(menu) => (
              <div className="bg-white rounded-lg shadow-lg max-w-md" style={{ maxHeight: "400px", overflowY: "auto" }}>
                {menu}
              </div>
            )}
          >
            <button className="relative hover:bg-white/10 p-2 rounded-full transition-colors">
              <Badge 
                count={serviceAlerts.length} 
                overflowCount={99}
                style={{ 
                  backgroundColor: serviceAlerts.some(a => a.priority === 'high') ? '#ff4d4f' : 
                                   serviceAlerts.some(a => a.priority === 'medium') ? '#faad14' : '#52c41a' 
                }}
              >
                <BellOutlined className="text-xl" style={{ color: 'white' }} />
              </Badge>
            </button>
          </Dropdown>

          <span className="hidden sm:inline-block text-sm opacity-90">
            {getUsername() || "User"}
          </span>
          <div
            className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/30 transition-all duration-200"
            onClick={() => setShowUserDropdown((prev) => !prev)}
          >
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>

          {showUserDropdown && (
            <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-xl p-2 z-50 min-w-[120px] border">
              <button
                className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded transition-colors"
                onClick={logout}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-4rem)] pt-16">
        {/* Main Sidebar */}
        <aside className={`${sidebarOpen ? 'hidden sm:flex' : 'hidden'} w-64 bg-white shadow-lg border-r border-gray-200 flex-col fixed left-0 top-16 bottom-0 z-40 transition-all duration-300`}>
          <div className="p-4 flex-1 overflow-y-auto sidebar-scroll">
            
            <div className="flex flex-col space-y-1">
              {filteredNavArray.map((item) => (
                <button
                  key={item.label}
                  className={`
                    w-full text-left px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-between
                    ${
                      isParentActive(item) || activeMenu === item.label
                        ? "bg-purple-50 text-purple-700 border-l-4 border-purple-600"
                        : "text-gray-700 hover:bg-gray-50 hover:text-purple-600"
                    }
                  `}
                  onClick={() => handleNavClick(item)}
                >
                  <span>{item.label}</span>
                  {item.children && (
                    <svg
                      className={`w-4 h-4 transition-transform ${
                        activeMenu === item.label ? "rotate-90" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
          
          {/* Sidebar Bottom - Light Logo - Fixed */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex justify-center">
              <img src={lightLogo} className="h-8 w-auto opacity-60" alt="Light Logo" />
            </div>
          </div>
        </aside>

        {/* Sub Sidebar */}
        {activeMenu && sidebarOpen && (
          <aside className="hidden sm:block w-56 bg-gray-50 border-r border-gray-200 fixed left-64 top-16 bottom-0 z-30 transition-all duration-300">
            <div className="p-4 h-full overflow-y-auto sidebar-scroll">
              <div className="mb-4">
                <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wide">
                  {activeMenu}
                </h3>
              </div>
              <div className="flex flex-col space-y-1">
                {filteredNavArray
                  .find((x) => x.label === activeMenu)
                  ?.children?.map((sub) => (
                    <button
                      key={sub.label}
                      className={`
                        w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all duration-200
                        ${
                          isActiveRoute(sub.path)
                            ? "bg-purple-100 text-purple-700 font-medium"
                            : "text-gray-600 hover:bg-gray-100 hover:text-purple-600"
                        }
                      `}
                      onClick={() => handleSubNavClick(sub.path)}
                    >
                      {sub.label}
                    </button>
                  ))}
              </div>
            </div>
          </aside>
        )}

        {/* Main content area */}
        <main className={`flex-1 bg-gray-50 flex flex-col ${sidebarOpen ? (activeMenu ? 'sm:ml-56' : 'sm:ml-64') : 'sm:ml-0'} pb-16 main-content-scroll transition-all duration-300`}>
          <div className="p-6 flex-1">
            <Outlet />
          </div>
          
         
        </main>
      </div>
    </div>
  );
}