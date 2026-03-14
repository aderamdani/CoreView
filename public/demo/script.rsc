# 2026-03-14 12:35:00 by RouterOS 7.14.3
# model = RB750Gr3
# serial number = DEMOBASIC01
/interface bridge
add name=bridge-local
/interface ethernet
set [ find default-name=ether1 ] name=ether1-wan
set [ find default-name=ether2 ] name=ether2-lan
/interface bridge port
add bridge=bridge-local interface=ether2-lan
add bridge=bridge-local interface=ether3
/ip address
add address=192.168.88.1/24 interface=bridge-local network=192.168.88.0
/ip dhcp-client
add interface=ether1-wan disabled=no
/ip pool
add name=dhcp_pool1 ranges=192.168.88.10-192.168.88.254
/ip dhcp-server
add address-pool=dhcp_pool1 interface=bridge-local name=dhcp1
/ip dhcp-server network
add address=192.168.88.0/24 gateway=192.168.88.1
/ip dns
set allow-remote-requests=yes servers=8.8.8.8
/ip firewall nat
add action=masquerade chain=srcnat out-interface=ether1-wan
/system identity
set name=Basic-Router
