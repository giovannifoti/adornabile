import {
  ArrowRight,
  Gift,
  Leaf,
  MessageCircle,
  PackageCheck,
  Palette,
  Search,
  Sparkles,
} from "lucide-react";
import { useMemo, useState } from "react";

const whatsappNumber = "393711883722";
const categories = ["Tutti", "Bouquet", "Bomboniere", "Eventi", "Regali", "Personalizzati"] as const;

type Category = (typeof categories)[number];

type Product = {
  id: string;
  title: string;
  category: Exclude<Category, "Tutti">;
  price: string;
  description: string;
  variants: string;
  note: string;
  images: string[];
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
    variants: "Colori: neutro, salvia, azzurro, rosa.",
    note: "Disponibile in due dimensioni.",
    images: ["/assets/catalog/essenza-pura-1.jpeg", "/assets/catalog/essenza-pura-2.jpeg"],
    accent: "#9cac8a",
  },
  {
    id: "essenza",
    title: "Essenza",
    category: "Bouquet",
    price: "40€",
    description:
      "Bouquet profumato artigianale ispirato alla forma di un vero mazzo di fiori, con sviluppo verticale e composizione floreale elegante.",
    variants: "Colori: neutro, salvia, azzurro, rosa.",
    note: "Unica dimensione.",
    images: ["/assets/catalog/essenza.jpeg"],
    accent: "#e58ba2",
  },
  {
    id: "essenza-petit",
    title: "Essenza Petit",
    category: "Bomboniere",
    price: "18€ cad.",
    description: "Bouquet in cera profumata pensato per bomboniere ed eventi.",
    variants: "Colori: neutro, salvia, azzurro, rosa.",
    note: "Ordine minimo: 10 pezzi.",
    images: ["/assets/catalog/essenza-petit.jpeg"],
    accent: "#d5b37c",
  },
  {
    id: "candela-botanica",
    title: "Candela Botanica",
    category: "Bomboniere",
    price: "13€ cad.",
    description: "Candela artigianale in cera di soia decorata con elementi botanici.",
    variants: "Colori: neutro, salvia, azzurro, rosa.",
    note: "Ordine minimo: 10 pezzi.",
    images: ["/assets/catalog/candela-botanica.jpeg"],
    accent: "#8fa184",
  },
  {
    id: "candela-rose",
    title: "Candela Rosé",
    category: "Bomboniere",
    price: "18€ cad.",
    description: "Candela profumata con rosa in cera e campana in vetro personalizzabile per eventi e cerimonie.",
    variants: "Personalizzabile per palette, evento e dettagli coordinati.",
    note: "Ordine minimo: 10 pezzi.",
    images: ["/assets/catalog/candela-rose.jpeg"],
    accent: "#d493a3",
  },
  {
    id: "segnaposto-floreale-personalizzato",
    title: "Segnaposto Floreale Personalizzato",
    category: "Eventi",
    price: "2,50€ cad.",
    description:
      "Segnaposto personalizzato con fiore in cera profumata applicato su cartoncino con grafica e dedica coordinate all'evento.",
    variants: "Grafica e colori personalizzabili.",
    note: "Ordine minimo: 20 pezzi.",
    images: ["/assets/catalog/segnaposto-floreale.jpeg"],
    accent: "#bd8e46",
  },
  {
    id: "tart-botaniche-profumate",
    title: "Tart Botaniche Profumate",
    category: "Regali",
    price: "5€ cad.",
    description:
      "Tart profumate decorate con elementi botanici e floreali, pensate come piccolo pensiero, mini bomboniera o dettaglio profumato.",
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
    variants: "Personalizzabile nei dettagli decorativi.",
    note: "Idea regalo profumata.",
    images: ["/assets/catalog/aura.jpeg"],
    accent: "#8ab182",
  },
  {
    id: "lettera-floreale",
    title: "Lettera Floreale",
    category: "Personalizzati",
    price: "Piccola 15€ • Media 30€",
    description: "Iniziale decorativa personalizzata con fiori in cera profumata e dettagli floreali coordinati.",
    variants: "Lettera e palette personalizzabili.",
    note: "Adatta come regalo, decorazione o dettaglio evento.",
    images: ["/assets/catalog/lettera-floreale.jpeg"],
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

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory = activeCategory === "Tutti" || product.category === activeCategory;
      const searchable = [
        product.title,
        product.category,
        product.price,
        product.description,
        product.variants,
        product.note,
      ]
        .join(" ")
        .toLowerCase();
      const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, query]);

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
            <span>Prodotti per eventi e bomboniere</span>
          </div>
        </section>

        <section className="catalog-section" id="catalogo">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Portfolio prodotti</p>
              <h2>Un catalogo essenziale, pensato per scegliere e ordinare in chat.</h2>
            </div>
            <p>
              Una selezione curata di bouquet, candele e dettagli floreali pensata per eventi,
              bomboniere e regali personali.
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
                  {product.images.map((image) => (
                    <img src={image} alt={product.title} key={image} />
                  ))}
                  <span className="product-category">{product.category}</span>
                </div>

                <div className="product-info">
                  <div className="product-title-row">
                    <div>
                      <h3>{product.title}</h3>
                      <strong>{product.price}</strong>
                    </div>
                    <span className="swatch" style={{ backgroundColor: product.accent }} aria-hidden="true" />
                  </div>

                  <p className="product-description">{product.description}</p>

                  <dl className="product-details">
                    <div>
                      <dt>Varianti</dt>
                      <dd>{product.variants}</dd>
                    </div>
                    <div>
                      <dt>Note</dt>
                      <dd>{product.note}</dd>
                    </div>
                  </dl>

                  <a className="order-link" href={createWhatsAppLink(product)} target="_blank" rel="noreferrer">
                    <MessageCircle size={19} aria-hidden="true" />
                    Ordina ora
                  </a>
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
              Le linee del catalogo includono opzioni per eventi, bomboniere, segnaposto e regali
              personalizzati. La palette può essere costruita su toni neutri, salvia, azzurro o rosa,
              con dettagli botanici coordinati.
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
    </>
  );
}
