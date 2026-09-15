const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/CommandCenter/CommandCenterNav.tsx', 'utf8');

code = code.replace(
  `  const tabs = [
    { name: "Repair", href: "/dashboard/command-center/repair" },
    { name: "MFG", href: "/dashboard/command-center/mfg" },
    { name: "Locations Topology", href: "/dashboard/command-center/locations" },
  ];`,
  `  let tabs = [
    { name: "Repair", href: "/dashboard/command-center/repair" },
    { name: "MFG", href: "/dashboard/command-center/mfg" },
    { name: "Locations Topology", href: "/dashboard/command-center/locations" },
  ];

  if (user?.role === "MANUFACTURING_SUPERVISOR") {
    tabs = tabs.filter(t => t.name !== "Repair");
  } else if (user?.role === "REPAIR_SUPERVISOR") {
    tabs = tabs.filter(t => t.name !== "MFG");
  }`
);

fs.writeFileSync('frontend/src/components/CommandCenter/CommandCenterNav.tsx', code);
