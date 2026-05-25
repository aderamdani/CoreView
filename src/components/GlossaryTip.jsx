import React, { useState } from 'react';

const GLOSSARY = {
  'CIDR':             'Format penulisan alamat jaringan. Contoh: 192.168.1.0/24 berarti 254 IP tersedia (dari .1 sampai .254).',
  'NAT':              'Network Address Translation — teknik mengubah IP private (lokal) menjadi IP public agar bisa mengakses internet.',
  'Masquerade':       'Bentuk NAT otomatis — router mengganti IP sumber dengan IP interface WAN-nya sendiri.',
  'Chain':            'Alur pemrosesan paket. "input" = ke router, "forward" = lewat router, "output" = dari router.',
  'Input chain':      'Aturan untuk paket yang ditujukan ke router itu sendiri (bukan diteruskan ke device lain).',
  'Forward chain':    'Aturan untuk paket yang melewati router (dari satu jaringan ke jaringan lain).',
  'Output chain':     'Aturan untuk paket yang dikirim oleh router itu sendiri.',
  'Accept':           'Izinkan paket lewat. Paket diteruskan ke tujuannya.',
  'Drop':             'Buang paket diam-diam. Pengirim tidak tahu paketnya dibuang.',
  'Reject':           'Tolak paket dan kirim pesan error ke pengirim.',
  'BGP':              'Border Gateway Protocol — protokol routing antar jaringan besar (seperti antar ISP). Kompleks tapi sangat powerful.',
  'OSPF':             'Open Shortest Path First — protokol routing yang menemukan jalur terpendek di jaringan internal secara otomatis.',
  'DHCP':             'Dynamic Host Configuration Protocol — layanan yang memberikan IP otomatis ke device yang terhubung.',
  'DNS':              'Domain Name System — penerjemah nama website (google.com) ke alamat IP (142.250.x.x).',
  'NTP':              'Network Time Protocol — protokol sinkronisasi waktu antar perangkat jaringan.',
  'VPN':              'Virtual Private Network — terowongan terenkripsi yang menghubungkan dua jaringan lewat internet.',
  'VLAN':             'Virtual LAN — pemisahan jaringan secara logis dalam satu jaringan fisik.',
  'QoS':              'Quality of Service — pengaturan prioritas traffic agar layanan penting (VoIP, video) tidak terganggu.',
  'MTU':              'Maximum Transmission Unit — ukuran maksimal paket data yang bisa dikirim sekaligus.',
  'TTL':              'Time To Live — batas "usia" paket agar tidak berputar selamanya di jaringan.',
  'WAN':              'Wide Area Network — jaringan luar (internet atau jaringan ISP).',
  'LAN':              'Local Area Network — jaringan lokal dalam gedung atau rumah.',
  'Firewall':         'Sistem keamanan yang menyaring traffic masuk dan keluar berdasarkan aturan yang ditentukan.',
  'Mangle':           'Mekanisme MikroTik untuk menandai (marking) paket sebelum diproses oleh QoS atau routing policy.',
  'Masquerade NAT':   'Router mengganti IP sumber paket dengan IP-nya sendiri — semua device lokal keluar lewat satu IP.',
  'Gateway':          'IP router yang menjadi "pintu keluar" jaringan lokal ke internet atau jaringan lain.',
  'Subnet':           'Segmen jaringan. /24 = 256 IP, /25 = 128 IP, /16 = 65536 IP.',
  'Interface':        'Port fisik atau virtual di router (ether1, wlan1, bridge1, dll.).',
  'PPPoE':            'Point-to-Point Protocol over Ethernet — cara ISP mengautentikasi pelanggan sebelum memberikan akses internet.',
  'SNMP':             'Simple Network Management Protocol — protokol monitoring perangkat jaringan dari jarak jauh.',
  'ARP':              'Address Resolution Protocol — menerjemahkan IP address ke MAC address di jaringan lokal.',
  'Bridge':           'Menggabungkan beberapa interface seolah-olah menjadi satu jaringan fisik.',
  'WireGuard':        'Protokol VPN modern yang cepat dan sederhana — lebih efisien dari OpenVPN atau IPsec.',
  'IPsec':            'Internet Protocol Security — protokol enkripsi untuk VPN yang sangat aman tapi kompleks.',
};

export function GlossaryTip({ term, children, inline = true }) {
  const [show, setShow] = useState(false);
  const explanation = GLOSSARY[term] || GLOSSARY[children] || null;
  if (!explanation) return <>{children || term}</>;

  const Tag = inline ? 'span' : 'div';
  return (
    <Tag
      style={{ position: 'relative', display: 'inline-block', cursor: 'help' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <span style={{
        borderBottom: '1px dashed var(--text-muted)',
        color: 'inherit',
      }}>
        {children || term}
      </span>
      {show && (
        <div style={{
          position: 'absolute',
          bottom: '130%',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9000,
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '10px 14px',
          fontSize: '0.78rem',
          color: 'var(--text-primary)',
          lineHeight: 1.6,
          maxWidth: '280px',
          minWidth: '180px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          pointerEvents: 'none',
          whiteSpace: 'normal',
        }}>
          <div style={{ fontWeight: 700, color: 'var(--accent)', marginBottom: '4px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {term}
          </div>
          {explanation}
          <div style={{
            position: 'absolute',
            bottom: '-6px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: '6px solid var(--border)',
          }} />
        </div>
      )}
    </Tag>
  );
}

export { GLOSSARY };
