import fs from 'fs';
import { parseMikroTikConfig } from './src/utils/parser.js';

try {
  const content = fs.readFileSync('backup_asa_130320262055.rsc', 'utf-8');
  console.log('Parsing file...');
  const config = parseMikroTikConfig(content);
  console.log('Parsed successfully!');
  console.log('Config keys:', Object.keys(config));
  
  // also try to simulate the dashboard destructuring and rendering
  // const { interfaces, ipAddresses, routes, firewall, vpn } = config;
  // Variables removed as they were unused:
  // const totalInterfaces = interfaces.length;
  // const activeInterfaces = interfaces.filter(i => i.active).length;
  // const totalVpns = vpn.wireguard.length + vpn.ovpn.length + vpn.l2tp.length;
  // const totalRoutes = routes.length;
  // const firewallRules = firewall.filter.length + firewall.nat.length + (firewall.mangle?.length || 0) + (firewall.raw?.length || 0);
  
} catch (e) {
  console.error('ERROR OCCURRED:', e);
}
