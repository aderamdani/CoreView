import fs from 'fs';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { parseMikroTikConfig } from './src/utils/parser.js';
import { Dashboard } from './src/components/Dashboard.jsx';

// Hack for browser SVGs from lucide-react if needed, but it should work in node

try {
  const content = fs.readFileSync('backup_asa_130320262055.rsc', 'utf-8');
  console.log('Parsing file...');
  const config = parseMikroTikConfig(content);
  console.log('Parsed successfully!');
  
  console.log('Rendering Dashboard...');
  // We need to pass the config to Dashboard. Active tab is "overview" by default.
  const html = ReactDOMServer.renderToString(React.createElement(Dashboard, { config }));
  console.log('Rendered successfully, length:', html.length);
  
} catch (e) {
  console.error('ERROR OCCURRED DURING RENDER:', e);
}
