/**
 * Utility to generate localized (Indonesian) explanations for individual MikroTik configuration items.
 */

export const generateItemExplanation = (type, item) => {
  if (!item) return '-';

  switch (type) {
    case 'interface': {
      let desc = `Antarmuka ${item.type} bernama '${item.name || item.defaultName}'.`;
      if (item.disabled === 'yes' || !item.active) {
        desc += ' (Saat ini dinonaktifkan)';
      }
      if (item.type === 'bridge') {
        desc += ' Berfungsi untuk menggabungkan beberapa port ke dalam satu jaringan lokal (Layer 2).';
      } else if (item.type === 'vlan') {
        desc += ` Memisahkan jaringan secara logis dengan VLAN ID ${item['vlan-id']}.`;
      }
      return desc;
    }
    
    case 'interface-list': {
      let desc = `Mendefinisikan grup antarmuka bernama '${item.name}'.`;
      return desc;
    }

    case 'bridge': {
      let desc = `Virtual switch (bridge) bernama '${item.name}'.`;
      if (item['protocol-mode']) {
        desc += ` Menggunakan protokol ${item['protocol-mode']} untuk mencegah looping jaringan.`;
      }
      return desc;
    }

    case 'bridge-port': {
      return `Memasukkan antarmuka '${item.interface}' ke dalam bridge '${item.bridge}' agar berada di jaringan lokal yang sama.`;
    }

    case 'ip-address': {
      let desc = `Mengatur alamat IP lokal ${item.address} pada antarmuka '${item.interface}'.`;
      if (item.network) {
        desc += ` Berada di jaringan ${item.network}.`;
      }
      return desc;
    }

    case 'dhcp-server': {
      let desc = `Menjalankan layanan DHCP Server untuk membagikan IP otomatis di antarmuka '${item.interface}'.`;
      if (item['address-pool']) {
        desc += ` Menggunakan rentang IP dari pool '${item['address-pool']}'.`;
      }
      return desc;
    }

    case 'dhcp-client': {
      let desc = `Meminta alamat IP otomatis (sebagai DHCP Client) pada antarmuka '${item.interface}'.`;
      if (item['add-default-route'] !== 'no') {
        desc += ' Mengatur akses internet default secara otomatis.';
      }
      return desc;
    }

    case 'dns-static': {
      return `Mengarahkan nama domain '${item.name}' ke alamat IP ${item.address} secara paksa (DNS lokal).`;
    }

    case 'route': {
      if (item['dst-address'] === '0.0.0.0/0') {
        return `Default route (jalur utama) untuk akses internet, diarahkan ke gateway ${item.gateway}.`;
      }
      return `Mengarahkan lalu lintas jaringan untuk tujuan ${item['dst-address']} ke gateway ${item.gateway}.`;
    }

    case 'pool': {
      return `Mendefinisikan rentang IP alamat: ${item.ranges}. Digunakan untuk DHCP atau VPN.`;
    }

    case 'hotspot-server': {
      return `Menjalankan portal login Hotspot di antarmuka '${item.interface}' menggunakan pool '${item['address-pool']}'.`;
    }
    
    case 'hotspot-user-profile': {
      let desc = `Profil pengguna Hotspot '${item.name}'.`;
      if (item['shared-users']) {
        desc += ` Dapat digunakan bersamaan oleh ${item['shared-users']} perangkat.`;
      }
      return desc;
    }

    case 'hotspot-user': {
      let desc = `Akun pengguna ('${item.name}') untuk login Hotspot.`;
      if (item.profile) {
        desc += ` Terikat dengan profil '${item.profile}'.`;
      }
      if (item['mac-address']) {
        desc += ` Hanya diizinkan masuk dari MAC address ${item['mac-address']}.`;
      }
      return desc;
    }

    case 'routing-table': {
      return `Mendefinisikan tabel routing terpisah bernama '${item.name}' untuk keperluan policy-routing atau multi-WAN.`;
    }

    case 'firewall-filter': {
      let actionText = item.action === 'drop' ? 'Memblokir (Drop)' : item.action === 'accept' ? 'Mengizinkan (Accept)' : `Aksi: ${item.action}`;
      let targetText = item.chain === 'input' ? 'lalu lintas yang masuk ke router' : item.chain === 'forward' ? 'lalu lintas yang melewati router' : 'lalu lintas keluar dari router';
      let desc = `${actionText} ${targetText}.`;
      if (item.protocol || item['dst-port']) {
        desc += ` Berlaku untuk protokol ${item.protocol || 'semua'}${item['dst-port'] ? ` pada port ${item['dst-port']}` : ''}.`;
      }
      return desc;
    }

    case 'firewall-nat': {
      if (item.action === 'masquerade') {
        let desc = 'Menerjemahkan IP privat menjadi IP publik agar jaringan lokal bisa mengakses internet (Masquerade).';
        if (item['out-interface']) desc += ` Berlaku pada antarmuka keluar '${item['out-interface']}'.`;
        if (item['out-interface-list']) desc += ` Berlaku pada grup antarmuka keluar '${item['out-interface-list']}'.`;
        return desc;
      } else if (item.action === 'dst-nat') {
        let desc = `Meneruskan akses dari luar ke server internal (Port Forwarding)`;
        if (item['to-addresses']) {
          desc += ` ke alamat ${item['to-addresses']}`;
        }
        if (item['to-ports']) {
          desc += ` di port ${item['to-ports']}.`;
        } else {
          desc += '.';
        }
        return desc;
      }
      return `Aturan NAT dengan aksi '${item.action}' pada chain '${item.chain}'.`;
    }

    case 'firewall-mangle': {
      let actionMap = {
        'mark-connection': 'Menandai koneksi jaringan',
        'mark-routing': 'Menandai lalu lintas untuk tabel routing tertentu',
        'mark-packet': 'Menandai paket untuk prioritas/limitasi bandwidth Queue',
        'change-mss': 'Mengubah nilai MSS (Maximum Segment Size)',
      };
      let actionText = actionMap[item.action] || `Aksi Mangle: ${item.action}`;
      return `${actionText} pada chain '${item.chain}'.`;
    }

    case 'firewall-raw': {
      let actionText = item.action === 'drop' ? 'Membuang' : 'Menerima';
      return `${actionText} paket mentah sebelum connection tracking pada chain '${item.chain}'.`;
    }

    case 'queue-tree': {
      return `Membatasi bandwidth menggunakan hierarki Tree. Memiliki batas maksimal ${item['max-limit'] || 'tidak dibatasi'} untuk paket dengan penanda '${item['packet-mark'] || 'semua'}'.`;
    }

    case 'queue-type': {
      return `Mendefinisikan jenis antrean (queue) jaringan dengan algoritma ${item.kind}.`;
    }

    case 'vpn-wireguard': {
      return `Interface server WireGuard '${item.name}' yang berjalan mendengarkan port ${item['listen-port']}.`;
    }

    case 'vpn-legacy': {
      return `Interface VPN (${item._type || 'OVPN/L2TP'}) bernama '${item.name}'.`;
    }

    case 'vpn-wireguard-peer': {
      return `Klien/Peer VPN WireGuard dengan kunci publik yang diizinkan menggunakan alamat IP ${item['allowed-address'] || 'apa saja'}.`;
    }

    case 'tool-graphing': {
      return `Membuat dan menyimpan grafik lalu lintas (traffic) untuk antarmuka '${item.interface}'.`;
    }
    
    case 'ip-service': {
      return `Layanan akses manajemen router (${item.name}) yang berjalan di port ${item.port || 'default'}.`;
    }

    case 'system-logging': {
      return `Mencatat log jenis '${item.topics || 'default'}' dan menyimpannya ke '${item.target || 'disk'}'.`;
    }

    case 'port': {
      return `Mengonfigurasi port akses serial hardware atau modem: '${item.name}'.`;
    }

    case 'lte-apn': {
      let desc = `Profil Data (APN): ${item.apn || 'default'}.`;
      if (item['use-network-apn'] === 'yes') desc += ' Menggunakan APN bawaan jaringan secara otomatis.';
      return desc;
    }

    case 'snmp-community': {
      return `Kredensial akses SNMP bernama '${item.name}' untuk monitoring perangkat. Hanya mengizinkan akses dari alamat: ${item.addresses || 'semua (::/0)'}.`;
    }

    case 'ipsec-profile': {
      return `Profil fase negosiasi enkripsi IPsec bawaan yang menentukan algoritma keamanan terowongan Layer 3.`;
    }

    case 'routing-bfd': {
      return `Konfigurasi deteksi kegagalan rute super cepat (BFD) untuk antarmuka '${item.interfaces || 'semua'}'.`;
    }

    case 'routing-rule': {
      return `Kebijakan perutean (Policy Routing): Jika kondisi terpenuhi, arahkan ke tabel '${item.table}'.`;
    }

    case 'vpn-ovpn-server': {
      return `Layanan penerima OpenVPN Server bernama '${item.name}', membutuhkan autentikasi ${item.auth || 'standar'}.`;
    }

    case 'pppoe-server': {
      return `Layanan PPPoE Server "${item['service-name'] || 'service'}" menyediakan akses akun klien di antarmuka ${item.interface || 'unknown'}.`;
    }
      
    case 'routing-table': {
      return `Tabel rute khusus bermana "${item.name}" untuk memisahkan tabel lalu lintas paket data utama.`;
    }

    case 'routing-bgp-tmpl': {
      return `BGP Template "${item.name || 'default'}" untuk routing dengan Remote AS ${item.as || 'unknown'}.`;
    }

    case 'routing-bgp-conn': {
      return `Sesi interkoneksi eBGP/iBGP ke alamat IP peer ${item['remote.address'] || 'unknown'} (Dengan AS tujuan ${item['remote.as'] || 'unknown'}).`;
    }

    case 'routing-filter': {
      return `Filter BGP/OSPF pada chain/arah "${item.chain || 'unknown'}" dengan kebijakan: ${item.rule || 'accept'}.`;
    }

    case 'queue-type': {
      return `Mengatur algoritma antrian khusus bernama "${item.name || 'default'}" yang berjenis ${item.kind || 'unknown'}.`;
    }

    case 'queue-simple': {
      return `Membatasi kecepatan traffic "${item.name || 'rule'}" target ${item.target || 'any'} dengan max-limit terkonfigurasi pada ${item['max-limit'] || 'unlimited'}.`;
    }

    case 'log-action': {
      return `Pengiriman data rekam jejak logging router ini ke tujuan ${item.target || 'memory'}.`;
    }

    case 'system-logging': {
      return `Merekam aktivitas aktivitas router tipe topik "${item.topics || 'all'}" menggunakan mekanisme action "${item.action || 'memory'}".`;
    }

    default:
      return 'Konfigurasi belum ada penjelasan spesifik.';
  }
};
