const WHATSAPP_PHONE = '905305165498';
const WHATSAPP_MESSAGE = 'Merhaba, hizli bilgi almak istiyorum.';

const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

export function StorefrontWhatsAppButton() {
  const fallbackStyle = {
    position: 'fixed' as const,
    right: '16px',
    bottom: '18px',
    zIndex: 2147483000,
    width: '58px',
    height: '58px',
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid #e9fff2',
    background: 'linear-gradient(145deg, #25d366, #1ebd5b)',
    boxShadow: '0 10px 24px rgba(12, 40, 20, 0.3)',
    color: '#ffffff',
    textDecoration: 'none',
  };

  return (
    <a
      className="sf-whatsapp-float"
      style={fallbackStyle}
      href={WHATSAPP_LINK}
      target="_blank"
      rel="noreferrer"
      aria-label="WhatsApp hizli iletisim"
      title="WhatsApp hizli iletisim"
    >
      <span className="icon" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M12.1 3a8.9 8.9 0 0 0-7.7 13.3L3 21l4.8-1.3A9 9 0 1 0 12 3h.1Z" />
          <path d="M16.9 14.8c-.2.6-1.2 1.1-1.7 1.2-.5.1-1 .2-3.3-.8-2.8-1.2-4.6-4.2-4.8-4.4-.2-.3-1.1-1.5-1.1-2.9 0-1.4.7-2.1 1-2.4.2-.2.5-.3.8-.3h.6c.2 0 .4 0 .5.4.2.5.7 1.7.7 1.8.1.2.1.3 0 .5-.1.2-.2.3-.3.5l-.4.4c-.2.2-.3.4-.1.7.1.2.7 1.2 1.5 1.9 1.1 1 2 1.3 2.3 1.4.3.1.5.1.7-.1l.9-1.1c.2-.2.4-.3.6-.2.2.1 1.5.7 1.8.9.3.1.4.2.4.3 0 .2 0 .8-.2 1.3Z" />
        </svg>
      </span>
    </a>
  );
}
