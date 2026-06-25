const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full mt-auto bg-surface border-t border-line">
      <div className="px-4 md:px-6 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">

          <div>
            <h3 className="text-fg text-sm font-semibold mb-1.5">WhatsApp Campaigner</h3>
            <p className="text-fg-muted text-[13px]">Powerful messaging at your fingertips.</p>
          </div>

          <div>
            <h4 className="text-fg text-[13px] font-semibold mb-2">Quick Links</h4>
            <ul className="space-y-2">
              <li><a href="/docs" className="text-fg-muted text-[13px] no-underline hover:text-brand-light">Documentation</a></li>
              <li><a href="/support" className="text-fg-muted text-[13px] no-underline hover:text-brand-light">Support</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-fg text-[13px] font-semibold mb-2">Contact</h4>
            <p className="text-fg-muted text-[13px] mb-1">support@example.com</p>
            <p className="text-fg-muted text-[13px]">+91 1234567890</p>
          </div>
        </div>

        <div className="border-t border-line pt-4 text-center">
          <p className="text-fg-subtle text-xs">
            © {currentYear} WhatsApp Campaigner. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
