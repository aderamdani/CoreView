import { parseMikroTikConfig } from './parser.js';

const mockRsc = `
/interface ethernet
set [ find default-name=ether1 ] name=ether1-wan
set [ find default-name=ether2 ] disable=yes name=ether2-lan
set [ find default-name=ether3 ] disable=no
`;

const config = parseMikroTikConfig(mockRsc);
console.log(config.interfaces);
