import {
  ArrowRight,
  Check,
  Clock,
  Eye,
  Gift,
  Leaf,
  MessageCircle,
  PackageCheck,
  Palette,
  Play,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const whatsappNumber = "393711883722";
const categories = ["Tutti", "Bouquet", "Regali", "Personalizzati"] as const;

type Category = (typeof categories)[number];

type Product = {
  id: string;
  title: string;
  category: Exclude<Category, "Tutti">;
  price: string;
  description: string;
  detail: string;
  benefits: string[];
  variants: string;
  note: string;
  images: string[];
  video?: string;
  accent: string;
};

const products: Product[] = [
  {
    id: "essenza-pura",
    title: "Essenza Pura",
    category: "Bouquet",
    price: "Media 40€ • Grande 70€",
    description:
      "Bouquet profumato artigianale dalla forma compatta e decorativa, realizzato con fiori in cera profumata e dettagli floreali coordinati.",
    detail:
      "Una composizione compatta e scenografica che porta la delicatezza di un bouquet negli ambienti, unendo profumo e decorazione in un oggetto da conservare.",
    benefits: ["Fiori in cera profumata", "Due dimensioni disponibili", "Palette coordinabile"],
    variants: "Colori: neutro, salvia, azzurro, rosa.",
    note: "Disponibile in due dimensioni.",
    images: [
      "/assets/catalog/essenza-pura-1.jpeg",
      "/assets/catalog/essenza-pura-2.jpeg",
      "/assets/catalog/essenza-pura-3.jpeg",
      "/assets/catalog/essenza-pura-media-azzurra.jpeg",
    ],
    accent: "#9cac8a",
  },
  {
    id: "essenza",
    title: "Essenza",
    category: "Bouquet",
    price: "40€",
    description:
      "Bouquet profumato artigianale ispirato alla forma di un vero mazzo di fiori, con sviluppo verticale e composizione floreale elegante.",
    detail:
      "La forma slanciata richiama un bouquet appena composto e crea un punto focale elegante per un regalo, una cerimonia o un angolo speciale della casa.",
    benefits: ["Effetto bouquet realistico", "Composizione verticale", "Quattro palette disponibili"],
    variants: "Colori: neutro, salvia, azzurro, rosa.",
    note: "Unica dimensione.",
    images: ["/assets/catalog/essenza.jpeg", "/assets/catalog/essenza-palette-salvia.jpeg"],
    accent: "#e58ba2",
  },
  {
    id: "essenza-petit",
    title: "Essenza Petit",
    category: "Bouquet",
    price: "25€",
    description: "Il bouquet in miniatura della collezione.",
    detail:
      "Un piccolo bouquet in cera profumata realizzato a mano, pensato per custodire tutta la bellezza di una composizione floreale in un formato delicato e versatile. Perfetto come dono, come ricordo di un evento o come dettaglio decorativo, nasce per portare eleganza e armonia anche nei gesti più semplici.",
    benefits: ["Formato miniatura", "Realizzato a mano", "Palette della collezione"],
    variants: "Disponibile nelle palette della collezione.",
    note: "Richiedi un preventivo personalizzato se lo desideri come bouquet bomboniera.",
    images: ["/assets/catalog/essenza-petit.jpeg"],
    video: "/assets/catalog/essenza-petit.mp4",
    accent: "#9baa91",
  },
  {
    id: "tart-botaniche-profumate",
    title: "Tart Botaniche Profumate",
    category: "Regali",
    price: "5€ cad.",
    description:
      "Tart profumate decorate con elementi botanici e floreali, pensate come piccolo pensiero, mini bomboniera o dettaglio profumato.",
    detail:
      "Un gesto piccolo ma curato, da donare singolarmente o inserire in una composizione. Forme e decorazioni possono seguire il tema scelto.",
    benefits: ["Piccolo formato profumato", "Decorazioni botaniche", "Forme personalizzabili"],
    variants: "Forme, colori e decorazioni personalizzabili.",
    note: "Ordine minimo: 6 pezzi.",
    images: ["/assets/catalog/tart-botaniche.jpeg"],
    accent: "#6d9da8",
  },
  {
    id: "aura",
    title: "Aura",
    category: "Regali",
    price: "25€",
    description: "Candela artigianale in cera di soia sotto campana in vetro, decorata con dettagli botanici.",
    detail:
      "Una candela da regalare e lasciare in vista: la campana in vetro custodisce la luce e i dettagli botanici, creando un'atmosfera intima e raffinata.",
    benefits: ["Cera di soia", "Campana in vetro", "Dettagli botanici"],
    variants: "Personalizzabile nei dettagli decorativi.",
    note: "Idea regalo profumata.",
    images: ["/assets/catalog/aura.jpeg"],
    accent: "#8ab182",
  },
  {
    id: "lettera-floreale",
    title: "Lettera Floreale",
    category: "Personalizzati",
    price: "Piccola 15€ • Media 30€ • Grande 40€",
    description: "Iniziale decorativa personalizzata con fiori in cera profumata e dettagli floreali coordinati.",
    detail:
      "Un'iniziale costruita su misura che racconta una persona o un'occasione attraverso fiori profumati, colori scelti e una forma da conservare nel tempo.",
    benefits: ["Iniziale su misura", "Fiori profumati in cera", "Tre dimensioni disponibili"],
    variants: "Lettera, formato e palette personalizzabili.",
    note: "Disponibile nei formati piccolo, medio e grande.",
    images: ["/assets/catalog/lettera-floreale.jpeg"],
    video: "/assets/catalog/lettera-floreale-grande.mp4",
    accent: "#318498",
  },
];

function createWhatsAppLink(product?: Product) {
  const message = product
    ? `Ciao Adornabile, vorrei ordinare "${product.title}" dal catalogo online. Potete indicarmi disponibilità, colori e tempi di consegna?`
    : "Ciao Adornabile, vorrei effettuare un ordine dal catalogo online. Potete aiutarmi?";

  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}

export default function App() {
  const [activeCategory, setActiveCategory] = useState<Category>("Tutti");
  const [query, setQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);

  useEffect(() => {
    if (!selectedProduct) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedProduct(null);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [selectedProduct]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory = activeCategory === "Tutti" || product.category === activeCategory;
      const searchable = [
        product.title,
        product.category,
        product.price,
        product.description,
        product.detail,
        ...product.benefits,
        product.variants,
        product.note,
      ]
        .join(" ")
        .toLowerCase();
      const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, query]);

  function openProduct(product: Product) {
    setSelectedMediaIndex(0);
    setSelectedProduct(product);
  }

  return (
    <>
      <div className="announcement-bar">
        <span>Catalogo artigianale profumato</span>
        <a href={createWhatsAppLink()} target="_blank" rel="noreferrer">
          Ordini WhatsApp
        </a>
      </div>

      <header className="site-header">
        <a className="brand" href="#top" aria-label="Adornabile home">
          <span className="brand-mark">A</span>
          <span>
            <strong>Adornabile</strong>
            <small>Catalogo</small>
          </span>
        </a>

        <nav className="main-nav" aria-label="Navigazione principale">
          <a href="#catalogo">Catalogo</a>
          <a href="#atelier">Personalizzazioni</a>
          <a href="#ordini">Ordini</a>
        </nav>

        <a className="header-order" href={createWhatsAppLink()} target="_blank" rel="noreferrer">
          <MessageCircle size={19} aria-hidden="true" />
          Ordina ora
        </a>
      </header>

      <main id="top">
        <section className="hero" aria-label="Catalogo Adornabile">
          <img className="hero-image" src="/assets/catalog/essenza-pura-1.jpeg" alt="Bouquet profumato Essenza Pura" />
          <div className="hero-shade" />
          <div className="hero-content">
            <p className="eyebrow">Catalogo online</p>
            <h1>Adornabile Handmade</h1>
            <p>
              Bouquet profumati, candele botaniche e dettagli personalizzati in cera profumata per
              regali, eventi e piccoli rituali di bellezza quotidiana.
            </p>
            <div className="hero-actions">
              <a className="primary-link" href="#catalogo">
                <Sparkles size={19} aria-hidden="true" />
                Sfoglia i prodotti
              </a>
              <a className="secondary-link" href={createWhatsAppLink()} target="_blank" rel="noreferrer">
                <MessageCircle size={19} aria-hidden="true" />
                Ordina ora
              </a>
            </div>
          </div>
        </section>

        <section className="signal-strip" aria-label="Punti di forza">
          <div>
            <Leaf size={23} aria-hidden="true" />
            <span>Ispirazione botanica</span>
          </div>
          <div>
            <Palette size={23} aria-hidden="true" />
            <span>Palette personalizzabili</span>
          </div>
          <div>
            <PackageCheck size={23} aria-hidden="true" />
            <span>Prodotti per regali e occasioni speciali</span>
          </div>
        </section>

        <section className="catalog-section" id="catalogo">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Portfolio prodotti</p>
              <h2>Un catalogo essenziale, pensato per scegliere e ordinare in chat.</h2>
            </div>
            <p>
              Una selezione curata di bouquet, candele e dettagli floreali pensata per occasioni
              speciali e regali personali.
            </p>
          </div>

          <div className="catalog-tools" aria-label="Filtra catalogo">
            <label className="search-box">
              <Search size={19} aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cerca prodotto, colore o occasione"
              />
            </label>

            <div className="category-tabs" role="tablist" aria-label="Categorie catalogo">
              {categories.map((category) => (
                <button
                  className={activeCategory === category ? "active" : ""}
                  type="button"
                  role="tab"
                  aria-selected={activeCategory === category}
                  key={category}
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="catalog-grid">
            {filteredProducts.map((product) => (
              <article className="product-card" key={product.id}>
                <div className={product.images.length > 1 ? "product-media multi" : "product-media"}>
                  {product.images.slice(0, 2).map((image) => (
                    <img src={image} alt={product.title} key={image} />
                  ))}
                  <span className="product-category">{product.category}</span>
                  <span className="product-availability">
                    <Clock size={14} aria-hidden="true" />
                    Su ordinazione
                  </span>
                </div>

                <div className="product-info">
                  <div className="product-title-row">
                    <div>
                      <h3>{product.title}</h3>
                      <p className="product-price">
                        <span>Prezzo</span>
                        <strong>{product.price}</strong>
                      </p>
                    </div>
                    <span className="swatch" style={{ backgroundColor: product.accent }} aria-hidden="true" />
                  </div>

                  <p className="product-description">{product.description}</p>

                  <ul className="product-benefits" aria-label={`Benefici di ${product.title}`}>
                    {product.benefits.slice(0, 2).map((benefit) => (
                      <li key={benefit}>
                        <Check size={15} aria-hidden="true" />
                        {benefit}
                      </li>
                    ))}
                  </ul>

                  <p className="product-card-note">{product.note}</p>

                  <div className="product-actions">
                    <button className="detail-button" type="button" onClick={() => openProduct(product)}>
                      <Eye size={18} aria-hidden="true" />
                      Scopri
                    </button>
                    <a className="order-link" href={createWhatsAppLink(product)} target="_blank" rel="noreferrer">
                      <MessageCircle size={18} aria-hidden="true" />
                      Ordina ora
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="empty-state">
              <Sparkles size={24} aria-hidden="true" />
              <p>Nessun prodotto trovato con questi filtri.</p>
            </div>
          )}
        </section>

        <section className="atelier-section" id="atelier">
          <div>
            <p className="eyebrow">Su misura</p>
            <h2>Colori, grafica e dettagli possono seguire la tua occasione.</h2>
          </div>
          <div className="atelier-copy">
            <p>
              Le linee del catalogo includono bouquet, candele e regali personalizzati. La palette può
              essere costruita su toni neutri, salvia, azzurro o rosa, con dettagli botanici coordinati.
            </p>
            <div className="atelier-stats" aria-label="Dettagli catalogo">
              <span>
                <strong>{products.length}</strong>
                prodotti in catalogo
              </span>
              <span>
                <strong>4</strong>
                palette base
              </span>
              <span>
                <strong>1</strong>
                chat per ordinare
              </span>
            </div>
          </div>
        </section>

        <section className="order-section" id="ordini">
          <img src="/assets/catalog/aura.jpeg" alt="Candela Aura sotto campana in vetro" />
          <div>
            <p className="eyebrow">Ordini WhatsApp</p>
            <h2>Un ordine semplice, personale, seguito in chat.</h2>
            <p>
              Scrivi direttamente ad Adornabile per definire prodotto, colori, quantità e tempi di
              consegna con un messaggio già predisposto.
            </p>
            <a className="primary-link" href={createWhatsAppLink()} target="_blank" rel="noreferrer">
              <MessageCircle size={19} aria-hidden="true" />
              Ordina ora
              <ArrowRight size={19} aria-hidden="true" />
            </a>
          </div>
        </section>
      </main>

      <footer className="footer">
        <strong>Adornabile Handmade</strong>
        <span>Catalogo online di prodotti artigianali profumati.</span>
        <a href={createWhatsAppLink()} target="_blank" rel="noreferrer">
          <Gift size={18} aria-hidden="true" />
          Richiedi informazioni
        </a>
      </footer>

      {selectedProduct && (
        <div className="product-modal-backdrop" onClick={() => setSelectedProduct(null)}>
          <section
            className="product-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`product-modal-${selectedProduct.id}`}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close"
              type="button"
              autoFocus
              onClick={() => setSelectedProduct(null)}
              aria-label="Chiudi scheda prodotto"
              title="Chiudi"
            >
              <X size={22} aria-hidden="true" />
            </button>

            <div className="product-modal-gallery">
              {selectedProduct.video && selectedMediaIndex === selectedProduct.images.length ? (
                <video className="modal-main-image modal-main-video" controls playsInline preload="metadata">
                  <source src={selectedProduct.video} type="video/mp4" />
                  Il browser non supporta la riproduzione video.
                </video>
              ) : (
                <img
                  className="modal-main-image"
                  src={selectedProduct.images[selectedMediaIndex]}
                  alt={selectedProduct.title}
                />
              )}
              {selectedProduct.images.length + (selectedProduct.video ? 1 : 0) > 1 && (
                <div className="modal-thumbnails" aria-label={`Foto e video di ${selectedProduct.title}`}>
                  {selectedProduct.images.map((image, index) => (
                    <button
                      className={selectedMediaIndex === index ? "active" : ""}
                      type="button"
                      onClick={() => setSelectedMediaIndex(index)}
                      aria-label={`Mostra foto ${index + 1} di ${selectedProduct.title}`}
                      key={image}
                    >
                      <img src={image} alt="" />
                    </button>
                  ))}
                  {selectedProduct.video && (
                    <button
                      className={selectedMediaIndex === selectedProduct.images.length ? "video-thumbnail active" : "video-thumbnail"}
                      type="button"
                      onClick={() => setSelectedMediaIndex(selectedProduct.images.length)}
                      aria-label={`Riproduci video della versione grande di ${selectedProduct.title}`}
                    >
                      <Play size={28} aria-hidden="true" />
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="product-modal-content">
              <p className="modal-kicker">{selectedProduct.category} • Creazione artigianale profumata</p>
              <h2 id={`product-modal-${selectedProduct.id}`}>{selectedProduct.title}</h2>
              <p className="modal-intro">{selectedProduct.description}</p>

              <ul className="modal-benefits" aria-label={`Punti di forza di ${selectedProduct.title}`}>
                {selectedProduct.benefits.map((benefit) => (
                  <li key={benefit}>
                    <Check size={17} aria-hidden="true" />
                    {benefit}
                  </li>
                ))}
              </ul>

              <div className="modal-purchase-info">
                <div>
                  <span>Prezzo</span>
                  <strong>{selectedProduct.price}</strong>
                </div>
                <div>
                  <span>Disponibilità</span>
                  <strong>
                    <Clock size={17} aria-hidden="true" />
                    Disponibile su ordinazione
                  </strong>
                </div>
              </div>

              <a
                className="modal-order-link"
                href={createWhatsAppLink(selectedProduct)}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle size={20} aria-hidden="true" />
                Ordina ora su WhatsApp
              </a>

              <p className="modal-detail">{selectedProduct.detail}</p>

              <dl className="modal-specs">
                <div>
                  <dt>Varianti e personalizzazioni</dt>
                  <dd>{selectedProduct.variants}</dd>
                </div>
                <div>
                  <dt>Dettagli d'ordine</dt>
                  <dd>{selectedProduct.note}</dd>
                </div>
              </dl>

            </div>
          </section>
        </div>
      )}
    </>
  );
}
