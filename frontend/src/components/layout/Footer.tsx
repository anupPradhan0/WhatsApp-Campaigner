const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="w-full mt-auto"
      style={{ background: '#111113', borderTop: '1px solid #27272a' }}
    >
      <div className="px-4 md:px-6 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">

          <div>
            <h3 style={{ color: '#f4f4f5', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>WhatsApp Campaigner</h3>
            <p style={{ color: '#71717a', fontSize: 13 }}>Powerful messaging at your fingertips.</p>
          </div>

          <div>
            <h4 style={{ color: '#f4f4f5', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Quick Links</h4>
            <ul className="space-y-2">
              <li><a href="/docs" style={{ color: '#71717a', fontSize: 13, textDecoration: 'none' }} onMouseEnter={e => (e.currentTarget.style.color = '#4ade80')} onMouseLeave={e => (e.currentTarget.style.color = '#71717a')}>Documentation</a></li>
              <li><a href="/support" style={{ color: '#71717a', fontSize: 13, textDecoration: 'none' }} onMouseEnter={e => (e.currentTarget.style.color = '#4ade80')} onMouseLeave={e => (e.currentTarget.style.color = '#71717a')}>Support</a></li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: '#f4f4f5', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Contact</h4>
            <p style={{ color: '#71717a', fontSize: 13, marginBottom: 4 }}>support@example.com</p>
            <p style={{ color: '#71717a', fontSize: 13 }}>+91 1234567890</p>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #27272a', paddingTop: 16, textAlign: 'center' }}>
          <p style={{ color: '#52525b', fontSize: 12 }}>
            © {currentYear} WhatsApp Campaigner. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
