# 2026-03-14 12:35:00 by RouterOS 7.14.3
# software id = DEMO-CORE-VIEW
#
# model = RB5009UG+S+IN
# serial number = COREVIEW001
/interface bridge
add name=bridge-lan comment="Main LAN Bridge"
add name=bridge-vitals comment="Isolated Vital Services"
/interface ethernet
set [ find default-name=ether1 ] comment="WAN - Primary ISP" name=ether1-wan1
set [ find default-name=ether2 ] comment="WAN - Secondary ISP (Backup)"
set [ find default-name=ether3 ] comment="Trunk to Switch Core"
set [ find default-name=ether4 ] comment="Management PC"
set [ find default-name=ether5 ] comment="VoIP Phone System"
/interface vlan
add interface=bridge-lan name=vlan10-users vlan-id=10 comment="Employee Network"
add interface=bridge-lan name=vlan20-guest vlan-id=20 comment="Guest WiFi"
add interface=bridge-lan name=vlan30-iot vlan-id=30 comment="IoT Devices"
add interface=bridge-vitals name=vlan100-servers vlan-id=100 comment="Internal Database Servers"
/interface list
add name=WAN
add name=LAN
/interface wireguard
add listen-port=51820 mtu=1420 name=wg-remote-work comment="VPN for remote employees"
/interface ovpn-client
add connect-to=vpn.provider.com name=ovpn-cloud-backup user=coreview-backup password=securepass
/interface list member
add interface=ether1-wan1 list=WAN
add interface=ether2 list=WAN
add interface=bridge-lan list=LAN
add interface=vlan10-users list=LAN
/ip pool
add name=pool-users ranges=192.168.10.10-192.168.10.250
add name=pool-guest ranges=10.0.0.10-10.0.0.250
add name=pool-vpn ranges=172.16.0.2-172.16.0.50
/ip dhcp-server
add address-pool=pool-users interface=vlan10-users name=dhcp-users
add address-pool=pool-guest interface=vlan20-guest name=dhcp-guest
/ip address
add address=192.168.1.2/24 interface=ether1-wan1 comment="Public IP from ISP"
add address=192.168.10.1/24 interface=vlan10-users
add address=10.0.0.1/24 interface=vlan20-guest
add address=172.16.0.1/24 interface=wg-remote-work
add address=10.10.10.1/24 interface=vlan100-servers
/ip dhcp-client
add interface=ether2-wan2 disabled=no
/ip dns
set allow-remote-requests=yes servers=8.8.8.8,1.1.1.1
/ip firewall address-list
add address=192.168.10.0/24 list=local-networks
add address=10.10.10.0/24 list=server-farm
/ip firewall filter
add action=accept chain=input comment="Accept established,related" connection-state=established,related
add action=drop chain=input comment="Drop invalid" connection-state=invalid
add action=accept chain=input comment="Allow ICMP" protocol=icmp
add action=accept chain=input comment="Allow Winbox access from trusted" src-address-list=local-networks dst-port=8291 protocol=tcp
add action=drop chain=input comment="Drop all other input"
add action=accept chain=forward comment="Allow established,related" connection-state=established,related
add action=drop chain=forward comment="Drop invalid forward" connection-state=invalid
add action=accept chain=forward comment="Allow LAN to WAN" in-interface-list=LAN out-interface-list=WAN
add action=drop chain=forward comment="Drop guest to internal" in-interface=vlan20-guest out-address-list=server-farm
/ip firewall nat
add action=masquerade chain=srcnat out-interface-list=WAN comment="MASQ TO INTERNET"
add action=dst-nat chain=dstnat dst-port=443 protocol=tcp to-addresses=10.10.10.5 comment="Web Server Access"
/ip route
add dst-address=0.0.0.0/0 gateway=192.168.1.1 check-gateway=ping distance=1
/queue simple
add max-limit=100M/100M name="Total BW Limit" target=192.168.10.0/24
add max-limit=10M/10M name="Guest Limit" target=vlan20-guest
/system identity
set name=CoreView-Gateway
/system logging
add action=memory topics=info,critical,error
/snmp
set enabled=yes contact="admin@coreview.io" location="Data Center A"
/ip service
set winbox port=8291
set ssh port=2222
/ip cloud
set ddns-enabled=yes
