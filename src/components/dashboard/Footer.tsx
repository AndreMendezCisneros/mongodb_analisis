import { Instagram, Phone } from 'lucide-react';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-sidebar-border bg-sidebar mt-auto">
      <div className="container mx-auto px-6 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Información del equipo */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <p className="text-sm font-semibold text-sidebar-foreground">
              Desarrollado por <span className="text-primary font-bold">TOGABMODEL</span>
            </p>
            <p className="text-xs text-sidebar-foreground/70 mt-1">
              © {currentYear} Todos los derechos reservados
            </p>
          </div>

          {/* Redes sociales y contacto */}
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
            {/* Instagram 1 */}
            <a
              href="https://www.instagram.com/nick_huamani/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sidebar-foreground/70 hover:text-primary transition-colors group"
              aria-label="Síguenos en Instagram - nick_huamani"
            >
              <Instagram className="h-5 w-5 group-hover:scale-110 transition-transform" />
              <span className="text-sm hidden sm:inline font-medium">@nick_huamani</span>
            </a>

            {/* Instagram 2 */}
            <a
              href="https://www.instagram.com/arden_gmc/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sidebar-foreground/70 hover:text-primary transition-colors group"
              aria-label="Síguenos en Instagram - arden_gmc"
            >
              <Instagram className="h-5 w-5 group-hover:scale-110 transition-transform" />
              <span className="text-sm hidden sm:inline font-medium">@arden_gmc</span>
            </a>

            {/* WhatsApp 1 */}
            <a
              href="https://wa.me/51947854586"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sidebar-foreground/70 hover:text-primary transition-colors group"
              aria-label="Contáctanos por WhatsApp - 947 854 586"
            >
              <Phone className="h-5 w-5 group-hover:scale-110 transition-transform" />
              <span className="text-sm hidden sm:inline font-medium">+51 947 854 586</span>
              <span className="text-sm sm:hidden font-medium">WSP 1</span>
            </a>

            {/* WhatsApp 2 */}
            <a
              href="https://wa.me/51949261503"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sidebar-foreground/70 hover:text-primary transition-colors group"
              aria-label="Contáctanos por WhatsApp - 949 261 503"
            >
              <Phone className="h-5 w-5 group-hover:scale-110 transition-transform" />
              <span className="text-sm hidden sm:inline font-medium">+51 949 261 503</span>
              <span className="text-sm sm:hidden font-medium">WSP 2</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
