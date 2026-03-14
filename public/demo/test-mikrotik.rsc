# 2026-03-11 11:16:21 by RouterOS 7.14.3
# software id = B3F8-2KR5
#
# model = CCR2116-12G-4S+
# serial number = HHG0ACE609Q
/interface bridge
add name=loopback
/interface ethernet
set [ find default-name=ether2 ] comment="PC Monitoring"
set [ find default-name=ether4 ] comment="DNS SERVER"
set [ find default-name=ether5 ] comment="AP DUMMY CLIENT " name=\
    "ether5-To AP Master"
set [ find default-name=ether9 ] disabled=yes
set [ find default-name=ether10 ] name=ether10-iDirac
set [ find default-name=ether12 ] name=ether12-SVR
set [ find default-name=sfp-sfpplus1 ] comment=INTERKONEKSI-ONLY name=\
    sfp-1-UPLINK-Modem
set [ find default-name=sfp-sfpplus2 ] name=sfp-2UPBACKUP
set [ find default-name=sfp-sfpplus3 ] comment="To R.Distribusi" name=sfp-3
set [ find default-name=sfp-sfpplus4 ] auto-negotiation=no speed=1G-baseX
/interface ovpn-client
add comment=sg-15.hostddns.us:27983<->8291 connect-to=sg-15.hostddns.us \
    disabled=yes mac-address=FE:F9:37:DC:5C:99 name=ispkdi@mytunnel.id user=\
    ispkdi@mytunnel.id
add comment=sg-15.hostddns.us:28069<->8006 connect-to=sg-15.hostddns.us \
    disabled=yes mac-address=FE:A1:40:D0:24:4F name=kdisvr@mytunnel.id user=\
    kdisvr@mytunnel.id
add comment=id-25.hostddns.us:28158<->22 connect-to=id-25.hostddns.us \
    disabled=yes mac-address=FE:1A:9C:E6:AA:0B name=rmkdiserv@mytunnel.id \
    user=rmkdiserv@mytunnel.id
add comment=id-26.hostddns.us:28691<->80 connect-to=id-26.hostddns.us \
    disabled=yes mac-address=FE:67:FF:0E:AE:CB name=svrprtg@mytunnel.id user=\
    svrprtg@mytunnel.id
add comment=id-25.hostddns.us:28359<->80 connect-to=id-25.hostddns.us \
    disabled=yes mac-address=FE:0C:51:08:57:2E name=zabbixkdi@mytunnel.id \
    user=zabbixkdi@mytunnel.id
/interface l2tp-client
add connect-to=36.66.71.19 name=l2tp-out1 user=purnama
/interface wireguard
add listen-port=13233 mtu=1420 name=wg-asa-office
add listen-port=13231 mtu=1420 name=wg-customer
add listen-port=59607 mtu=1420 name=wg-hcm
add listen-port=13234 mtu=1420 name=wg-rajeg
add listen-port=13232 mtu=1420 name=wg-saipembintuni
add listen-port=51820 mtu=1420 name=wg-wazuh
/interface vlan
add disabled=yes interface=sfp-3 name=vlan120 vlan-id=120
add interface=sfp-1-UPLINK-Modem name=vlan2113-JLM vlan-id=2113
add interface=sfp-1-UPLINK-Modem name=vlan2114-DTP vlan-id=2114
add comment="Untuk Internet Via ITP Pakai IP Public ITP (Backup)" interface=\
    sfp-1-UPLINK-Modem name="vlan2903-Internet.Via.ITP-(Backup)" vlan-id=2903
add comment="Untuk Internet Via ITP Pakai IP Public ITP (Primary)" disabled=\
    yes interface=ether1 name="vlan2908-Internet.Via.ITP-(Primary)" vlan-id=\
    2908
/interface pppoe-client
add ac-name=R.Distribusi.01 add-default-route=yes comment=\
    "Untuk Internet Via ITP Pakai IP Public ITP" interface=\
    "vlan2908-Internet.Via.ITP-(Primary)" name=pppoe-out-PRIMARY user=\
    DACEN-RAJEG-PRIMARY
add ac-name=R.Distribusi.01 add-default-route=yes interface=\
    "vlan2903-Internet.Via.ITP-(Backup)" name=pppoe-out-Via.ITP user=PT.ASA
/interface list
add name=VPNREMOTE
/ip ipsec profile
set [ find default=yes ] dpd-interval=8s dpd-maximum-failures=4
/ip pool
add name=dhcp_pool0 ranges=172.16.20.2-172.16.20.14
add name=pool-vlan120 ranges=172.120.20.10-172.120.20.88
add name=dhcp_pool3 ranges=192.168.10.2-192.168.10.254
add name=dhcp_pool4 ranges=192.168.200.2-192.168.200.254
add name=dhcp_pool5 ranges=192.168.200.2-192.168.200.254
add name=dhcp_pool6 ranges=192.168.11.2-192.168.11.254
/ip dhcp-server
add address-pool=dhcp_pool0 interface=ether12-SVR name=dhcp1
add address-pool=pool-vlan120 disabled=yes interface=ether3 name=dhcp-vlan120
add address-pool=dhcp_pool5 interface=loopback name=dhcp2
add address-pool=dhcp_pool5 interface="ether5-To AP Master" name=dhcp3
/port
set 0 name=serial0
/queue type
add kind=fq-codel name="fq codel"
/queue simple
add disabled=yes max-limit=50M/50M name="Limit BW" queue="fq codel/fq codel" \
    target=""
/routing bgp template
add disabled=yes input.filter=peer-JLM-IN name=ASA output.filter-chain=\
    peer-JLM-OUT .network=bgp_networks
/routing table
add disabled=no fib name=to-JLM
/snmp community
add addresses=172.16.20.0/24 name=zabbix
/system logging action
add name=syslog remote=172.120.20.1 target=remote
/interface bridge port
add bridge=loopback disabled=yes interface="ether5-To AP Master"
add bridge=loopback disabled=yes interface=ether7
add bridge=loopback disabled=yes interface=ether6
add bridge=loopback disabled=yes interface=ether8
/interface list member
add interface=ispkdi@mytunnel.id list=VPNREMOTE
add interface=kdisvr@mytunnel.id list=VPNREMOTE
add interface=rmkdiserv@mytunnel.id list=VPNREMOTE
/ip address
add address=192.168.88.1/24 comment=defconf disabled=yes interface=ether13 \
    network=192.168.88.0
add address=172.16.20.1/28 interface=ether4 network=172.16.20.0
add address=172.120.20.1/24 comment="METRO-E KE DACEN" disabled=yes \
    interface=ether3 network=172.120.20.0
add address=103.159.113.58/30 interface="vlan2903-Internet.Via.ITP-(Backup)" \
    network=103.159.113.56
add address=172.120.20.1/24 interface=sfp-3 network=172.120.20.0
add address=172.16.10.1/24 interface=ether10-iDirac network=172.16.10.0
add address=10.33.1.2/29 disabled=yes interface=vlan2113-JLM network=\
    10.33.1.0
add address=10.88.0.1/24 disabled=yes interface=wg-wazuh network=10.88.0.0
add address=10.89.0.1/24 disabled=yes interface=wg-customer network=10.89.0.0
add address=10.0.97.254/30 interface=ether11 network=10.0.97.252
add address=138.252.136.225/29 interface=loopback network=138.252.136.224
add address=10.90.0.1/24 disabled=yes interface=wg-saipembintuni network=\
    10.90.0.0
add address=10.87.0.1/24 interface=wg-asa-office network=10.87.0.0
add address=10.91.0.1/24 disabled=yes interface=wg-rajeg network=10.91.0.0
add address=172.28.50.2/30 interface=vlan2114-DTP network=172.28.50.0
add address=10.86.0.1/24 disabled=yes interface=wg-hcm network=10.86.0.0
add address=150.107.140.28/29 disabled=yes interface=vlan2113-JLM network=\
    150.107.140.24
add address=192.168.200.1/24 interface="ether5-To AP Master" network=\
    192.168.200.0
add address=192.168.12.1/24 disabled=yes interface=ether7 network=\
    192.168.12.0
add address=192.168.200.1/24 disabled=yes interface=loopback network=\
    192.168.200.0
add address=192.168.11.1/24 disabled=yes interface=ether6 network=\
    192.168.11.0
add address=124.158.176.174/30 disabled=yes interface=vlan2113-JLM network=\
    124.158.176.172
add address=124.158.176.174/30 interface=vlan2113-JLM network=124.158.176.172
add address=138.252.136.1/24 interface=loopback network=138.252.136.0
add address=138.252.137.1/24 interface=loopback network=138.252.137.0
add address=138.252.136.10/24 interface=loopback network=138.252.136.0
/ip firewall nat
add action=masquerade chain=srcnat comment="NAT Zabbix to DTP Target" \
    dst-address=172.28.132.2 src-address=172.16.20.7
add action=masquerade chain=srcnat comment="MASQ TO INTERNET"
/ip route
add dst-address=172.16.20.0/24 gateway=172.28.50.2
add comment="To SITE 10.87.0.0/24 via wg-as-office" dst-address=10.87.0.0/24 \
    gateway=10.0.7.2
add comment="To Zabbix LAN via WG 10.8.0.x" dst-address=172.16.20.0/24 \
    gateway=10.8.0.1
