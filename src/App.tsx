import {
  ArrowRight,
  Check,
  ClipboardList,
  Clock,
  CreditCard,
  Eye,
  Gift,
  Leaf,
  Lock,
  LogOut,
  MessageCircle,
  Minus,
  PackageCheck,
  Palette,
  Play,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

const whatsappNumber = "393711883722";
const freeShippingThresholdCents = 8000;
const cartStorageKey = "adornabile-cart";
const localOrdersStorageKey = "adornabile-orders";
const lastOrderStorageKey = "adornabile-last-order";
const categories = ["Tutti", "Bouquet", "Personalizzati"] as const;

type Category = (typeof categories)[number];
type AppView = "shop" | "checkout" | "payment" | "success" | "admin";

type PaletteOption = {
  id: string;
  label: string;
  title: string;
  description: string;
  image: string;
  accent: string;
};

type ProductOption = {
  id: string;
  label: string;
  priceCents: number;
};

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
  imageFit?: "cover" | "contain";
  imagePosition?: string;
  accent: string;
  options: ProductOption[];
};

type CartItem = {
  productId: string;
  optionId: string;
  quantity: number;
};

type CartLine = CartItem & {
  product: Product;
  option: ProductOption;
  lineTotalCents: number;
};

type CheckoutForm = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  deliveryNotes: string;
  dedication: string;
  topperTheme: string;
  premiumPackaging: boolean;
};

type OrderItem = {
  productId: string;
  productTitle: string;
  optionId: string;
  optionLabel: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
};

type OrderRecord = {
  id: string;
  createdAt: string;
  items: OrderItem[];
  customer: CheckoutForm;
  subtotalCents: number;
  totalCents: number;
  status: string;
  paymentProvider: string;
  paymentUrl?: string;
  shippingNote: string;
};

type CheckoutResponse = {
  order: OrderRecord;
  checkoutUrl: string;
  provider: string;
  configured: boolean;
};

const emptyCheckoutForm: CheckoutForm = {
  fullName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  province: "",
  postalCode: "",
  country: "Italia",
  deliveryNotes: "",
  dedication: "",
  topperTheme: "",
  premiumPackaging: false,
};

const paletteOptions: PaletteOption[] = [
  {
    id: "neutra",
    label: "Neutra",
    title: "Palette neutra",
    description: "Avorio, cipria e botaniche naturali per una composizione luminosa e delicata.",
    image: "/assets/catalog/palette-neutra.jpeg",
    accent: "#d8c5ad",
  },
  {
    id: "rosa",
    label: "Rosa",
    title: "Palette rosa",
    description: "Toni romantici e morbidi, perfetti per cerimonie, regali e dettagli coordinati.",
    image: "/assets/catalog/palette-rosa.jpeg",
    accent: "#e7aab0",
  },
  {
    id: "salvia",
    label: "Verde salvia",
    title: "Palette verde salvia",
    description: "Una sfumatura botanica elegante, con fiori chiari e accenti salvia.",
    image: "/assets/catalog/palette-verde-salvia.jpeg",
    accent: "#9baa91",
  },
  {
    id: "azzurra",
    label: "Azzurra",
    title: "Palette azzurra",
    description: "Azzurro polvere e fiori chiari per una resa fresca, fine e personalizzabile.",
    image: "/assets/catalog/palette-azzurra.jpeg",
    accent: "#8eb9c5",
  },
];

const productOrderOptions = [
  "Spedizione gratuita da 80€",
  "Aggiungi confezione premium (scatola rigida con nastro)",
  "Aggiungi dedica personalizzata",
  "Aggiungi topper a tema",
];

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
    options: [
      { id: "media", label: "Media", priceCents: 4000 },
      { id: "grande", label: "Grande", priceCents: 7000 },
    ],
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
    images: ["/assets/catalog/palette-rosa.jpeg", "/assets/catalog/essenza-palette-salvia.jpeg", "/assets/catalog/essenza.jpeg"],
    imageFit: "contain",
    accent: "#e58ba2",
    options: [{ id: "unica", label: "Unica", priceCents: 4000 }],
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
    imageFit: "contain",
    imagePosition: "center center",
    accent: "#9baa91",
    options: [{ id: "unica", label: "Unica", priceCents: 2500 }],
  },
  {
    id: "lettera-floreale",
    title: "Lettera Floreale",
    category: "Personalizzati",
    price: "Piccola 15€ • Grande 40€",
    description: "Iniziale decorativa personalizzata con fiori in cera profumata e dettagli floreali coordinati.",
    detail:
      "Un'iniziale costruita su misura che racconta una persona o un'occasione attraverso fiori profumati, colori scelti e una forma da conservare nel tempo.",
    benefits: ["Iniziale su misura", "Fiori profumati in cera", "Due dimensioni disponibili"],
    variants: "Lettera, formato piccolo o grande e palette personalizzabili.",
    note: "Disponibile nei formati piccolo e grande.",
    images: ["/assets/catalog/lettera-floreale.jpeg"],
    video: "/assets/catalog/lettera-floreale-grande.mp4",
    accent: "#318498",
    options: [
      { id: "piccola", label: "Piccola", priceCents: 1500 },
      { id: "grande", label: "Grande", priceCents: 4000 },
    ],
  },
];

function createWhatsAppLink(product?: Product, order?: OrderRecord) {
  const message = order
    ? `Ciao Adornabile, ho creato l'ordine ${order.id} dal sito e vorrei ricevere conferma.`
    : product
      ? `Ciao Adornabile, vorrei ordinare "${product.title}" dal catalogo online. Potete indicarmi disponibilità, colori e tempi di consegna?`
      : "Ciao Adornabile, vorrei effettuare un ordine dal catalogo online. Potete aiutarmi?";

  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(cents);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("it-IT", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function resolveViewFromHash(hash: string): AppView {
  const cleanHash = hash.replace("#", "").split("?")[0];

  if (cleanHash === "checkout") return "checkout";
  if (cleanHash === "pagamento") return "payment";
  if (cleanHash === "ordine-completato") return "success";
  if (cleanHash === "admin") return "admin";

  return "shop";
}

function readJsonStorage<T>(key: string, fallback: T): T {
  try {
    const rawValue = window.localStorage.getItem(key);
    return rawValue ? (JSON.parse(rawValue) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJsonStorage<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function findProduct(productId: string) {
  return products.find((product) => product.id === productId);
}

function findOption(product: Product, optionId: string) {
  return product.options.find((option) => option.id === optionId) ?? product.options[0];
}

function buildCartLines(cartItems: CartItem[]): CartLine[] {
  return cartItems.flatMap((item) => {
    const product = findProduct(item.productId);
    if (!product) return [];

    const option = findOption(product, item.optionId);
    const quantity = Math.max(1, item.quantity);

    return [
      {
        ...item,
        quantity,
        product,
        option,
        lineTotalCents: option.priceCents * quantity,
      },
    ];
  });
}

function getShippingNote(subtotalCents: number) {
  return subtotalCents >= freeShippingThresholdCents
    ? "Spedizione gratuita applicata"
    : "Spedizione da confermare dopo l'ordine";
}

function buildOrderItems(cartItems: CartItem[]): OrderItem[] {
  return buildCartLines(cartItems).map((line) => ({
    productId: line.product.id,
    productTitle: line.product.title,
    optionId: line.option.id,
    optionLabel: line.option.label,
    unitPriceCents: line.option.priceCents,
    quantity: line.quantity,
    lineTotalCents: line.lineTotalCents,
  }));
}

function createLocalOrder(cartItems: CartItem[], customer: CheckoutForm): OrderRecord {
  const orderItems = buildOrderItems(cartItems);
  const subtotalCents = orderItems.reduce((total, item) => total + item.lineTotalCents, 0);
  const orderId = `AD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  return {
    id: orderId,
    createdAt: new Date().toISOString(),
    items: orderItems,
    customer,
    subtotalCents,
    totalCents: subtotalCents,
    status: "Ordine salvato - pagamento da configurare",
    paymentProvider: "Pagamento locale",
    shippingNote: getShippingNote(subtotalCents),
  };
}

function saveOrderLocally(order: OrderRecord) {
  const orders = readJsonStorage<OrderRecord[]>(localOrdersStorageKey, []);
  const nextOrders = [order, ...orders.filter((savedOrder) => savedOrder.id !== order.id)].slice(0, 100);
  writeJsonStorage(localOrdersStorageKey, nextOrders);
  writeJsonStorage(lastOrderStorageKey, order);
}

function findOrderFromHash() {
  const [, queryString] = window.location.hash.split("?");
  const orderId = new URLSearchParams(queryString ?? "").get("order");
  if (!orderId) return null;

  return readJsonStorage<OrderRecord[]>(localOrdersStorageKey, []).find((order) => order.id === orderId) ?? null;
}

export default function App() {
  const [view, setView] = useState<AppView>(() => resolveViewFromHash(window.location.hash));
  const [activeCategory, setActiveCategory] = useState<Category>("Tutti");
  const [query, setQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string>("");
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [selectedPaletteId, setSelectedPaletteId] = useState(paletteOptions[0].id);
  const [cartItems, setCartItems] = useState<CartItem[]>(() => readJsonStorage<CartItem[]>(cartStorageKey, []));
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState<CheckoutForm>(emptyCheckoutForm);
  const [checkoutError, setCheckoutError] = useState("");
  const [isSubmittingCheckout, setIsSubmittingCheckout] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<OrderRecord | null>(() =>
    readJsonStorage<OrderRecord | null>(lastOrderStorageKey, null),
  );
  const [adminLogin, setAdminLogin] = useState({ username: "", password: "" });
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminOrders, setAdminOrders] = useState<OrderRecord[]>([]);
  const [adminError, setAdminError] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);

  const cartLines = useMemo(() => buildCartLines(cartItems), [cartItems]);
  const cartSubtotalCents = useMemo(
    () => cartLines.reduce((total, line) => total + line.lineTotalCents, 0),
    [cartLines],
  );
  const cartCount = useMemo(() => cartLines.reduce((total, line) => total + line.quantity, 0), [cartLines]);

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
        ...product.options.map((option) => option.label),
      ]
        .join(" ")
        .toLowerCase();
      const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, query]);

  const selectedPalette = paletteOptions.find((palette) => palette.id === selectedPaletteId) ?? paletteOptions[0];
  const selectedOption = selectedProduct ? findOption(selectedProduct, selectedOptionId) : null;
  const visibleOrder = currentOrder ?? findOrderFromHash();

  useEffect(() => {
    const syncView = () => setView(resolveViewFromHash(window.location.hash));
    window.addEventListener("hashchange", syncView);

    return () => window.removeEventListener("hashchange", syncView);
  }, []);

  useEffect(() => {
    writeJsonStorage(cartStorageKey, cartItems);
  }, [cartItems]);

  useEffect(() => {
    if (view !== "shop") window.scrollTo({ top: 0, behavior: "smooth" });
  }, [view]);

  useEffect(() => {
    if (!selectedProduct && !isCartOpen) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedProduct(null);
        setIsCartOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [selectedProduct, isCartOpen]);

  function navigateTo(nextView: AppView) {
    const hashByView: Record<AppView, string> = {
      shop: "catalogo",
      checkout: "checkout",
      payment: "pagamento",
      success: "ordine-completato",
      admin: "admin",
    };

    window.location.hash = hashByView[nextView];
    setView(nextView);
  }

  function openProduct(product: Product) {
    setSelectedMediaIndex(0);
    setSelectedOptionId(product.options[0].id);
    setSelectedProduct(product);
  }

  function addToCart(product: Product, optionId: string, quantity = 1) {
    setCartItems((items) => {
      const itemExists = items.some((item) => item.productId === product.id && item.optionId === optionId);

      if (itemExists) {
        return items.map((item) =>
          item.productId === product.id && item.optionId === optionId
            ? { ...item, quantity: Math.min(99, item.quantity + quantity) }
            : item,
        );
      }

      return [...items, { productId: product.id, optionId, quantity }];
    });
    setIsCartOpen(true);
  }

  function changeCartQuantity(productId: string, optionId: string, delta: number) {
    setCartItems((items) =>
      items
        .map((item) =>
          item.productId === productId && item.optionId === optionId
            ? { ...item, quantity: Math.max(1, Math.min(99, item.quantity + delta)) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  function removeCartItem(productId: string, optionId: string) {
    setCartItems((items) => items.filter((item) => item.productId !== productId || item.optionId !== optionId));
  }

  function updateCheckoutField<Key extends keyof CheckoutForm>(key: Key, value: CheckoutForm[Key]) {
    setCheckoutForm((form) => ({ ...form, [key]: value }));
  }

  async function handleCheckoutSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cartLines.length) return;

    setCheckoutError("");
    setIsSubmittingCheckout(true);

    const payload = {
      items: cartItems,
      customer: checkoutForm,
    };

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error((await response.text()).slice(0, 180) || "Checkout non disponibile.");
      }

      const data = (await response.json()) as CheckoutResponse;
      saveOrderLocally(data.order);
      setCurrentOrder(data.order);
      setCartItems([]);
      setIsCartOpen(false);

      if (data.checkoutUrl.startsWith("http")) {
        window.location.href = data.checkoutUrl;
      } else {
        window.location.href = data.checkoutUrl;
      }
    } catch {
      const localOrder = createLocalOrder(cartItems, checkoutForm);
      saveOrderLocally(localOrder);
      setCurrentOrder(localOrder);
      setCartItems([]);
      setIsCartOpen(false);
      setCheckoutError("");
      navigateTo("payment");
    } finally {
      setIsSubmittingCheckout(false);
    }
  }

  async function loadAdminOrders(credentials = adminLogin) {
    setAdminLoading(true);
    setAdminError("");

    try {
      const response = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) throw new Error("Credenziali non valide o server non disponibile.");

      const data = (await response.json()) as { orders: OrderRecord[] };
      setAdminOrders(data.orders);
      setIsAdminAuthenticated(true);
    } catch {
      setAdminError("Accesso non riuscito. Controlla credenziali e server ecommerce.");
    } finally {
      setAdminLoading(false);
    }
  }

  function handleAdminSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadAdminOrders();
  }

  function logoutAdmin() {
    setIsAdminAuthenticated(false);
    setAdminOrders([]);
    setAdminLogin({ username: "", password: "" });
  }

  function renderShop() {
    return (
      <main id="top">
        <section className="hero" aria-label="Catalogo Adornabile">
          <img className="hero-image" src="/assets/catalog/essenza-pura-1.jpeg" alt="Bouquet profumato Essenza Pura" />
          <div className="hero-shade" />
          <div className="hero-content">
            <p className="eyebrow">Catalogo online</p>
            <h1>Adornabile Handmade</h1>
            <p>Bouquet in cera profumata per impreziosire la tua casa o il tuo evento</p>
            <div className="hero-actions">
              <a className="primary-link" href="#catalogo">
                <Sparkles size={19} aria-hidden="true" />
                Sfoglia i prodotti
              </a>
              <button className="secondary-link" type="button" onClick={() => setIsCartOpen(true)}>
                <ShoppingCart size={19} aria-hidden="true" />
                Apri carrello
              </button>
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
            <span>Checkout e ordine tracciato</span>
          </div>
        </section>

        <section className="catalog-section" id="catalogo">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Portfolio prodotti</p>
              <h2>Scegli il prodotto, aggiungilo al carrello e completa l'ordine online.</h2>
            </div>
            <p>
              Il checkout raccoglie i dati di spedizione e prepara il pagamento. Per dettagli su colori,
              quantità o richieste speciali puoi sempre scrivere ad Adornabile.
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
                <div className="product-media">
                  <img
                    src={product.images[0]}
                    alt={product.title}
                    style={{ objectFit: product.imageFit, objectPosition: product.imagePosition }}
                  />
                  <span className="product-category">{product.category}</span>
                  <span className="product-availability">
                    <Clock size={14} aria-hidden="true" />
                    Pochi pezzi disponibili
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
                    <button
                      className="order-link"
                      type="button"
                      onClick={() => addToCart(product, product.options[0].id)}
                    >
                      <ShoppingBag size={18} aria-hidden="true" />
                      Aggiungi
                    </button>
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

        <section className="palette-section" id="palette" aria-labelledby="palette-heading">
          <div className="palette-shell">
            <div className="palette-heading">
              <div>
                <p className="eyebrow">Palette</p>
                <h2 id="palette-heading">Quattro palette per immaginare subito la tua composizione.</h2>
              </div>
              <p>
                Ogni linea può essere coordinata nei colori della collezione, mantenendo lo stesso stile
                floreale artigianale.
              </p>
            </div>

            <div className="palette-card">
              <div className="palette-preview">
                <img src={selectedPalette.image} alt={`${selectedPalette.title} Adornabile`} />
                <span className="palette-preview-label">{selectedPalette.label}</span>
              </div>

              <div className="palette-panel">
                <Palette size={28} aria-hidden="true" />
                <h3>{selectedPalette.title}</h3>
                <p>{selectedPalette.description}</p>

                <div className="palette-buttons" aria-label="Palette disponibili">
                  {paletteOptions.map((palette) => (
                    <button
                      className={selectedPalette.id === palette.id ? "active" : ""}
                      type="button"
                      aria-pressed={selectedPalette.id === palette.id}
                      onClick={() => setSelectedPaletteId(palette.id)}
                      key={palette.id}
                    >
                      <span className="palette-dot" style={{ backgroundColor: palette.accent }} aria-hidden="true" />
                      <span>{palette.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="atelier-section" id="atelier">
          <div>
            <p className="eyebrow">Su misura</p>
            <h2>Colori, grafica e dettagli possono seguire la tua occasione.</h2>
          </div>
          <div className="atelier-copy">
            <p>
              Le linee del catalogo includono bouquet e creazioni personalizzate. La palette può essere
              costruita su toni neutri, salvia, azzurro o rosa, con dettagli botanici coordinati.
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
                <strong>{cartCount}</strong>
                nel carrello
              </span>
            </div>
          </div>
        </section>

        <section className="order-section" id="ordini">
          <img src="/assets/catalog/essenza-pura-3.jpeg" alt="Bouquet profumato Essenza Pura" />
          <div>
            <p className="eyebrow">Checkout</p>
            <h2>Dati di spedizione raccolti prima del pagamento.</h2>
            <p>
              Ogni ordine include riepilogo prodotti, contatti, indirizzo e richieste speciali. Gli ordini
              restano consultabili dall'area admin.
            </p>
            <button className="primary-link" type="button" onClick={() => setIsCartOpen(true)}>
              <ShoppingCart size={19} aria-hidden="true" />
              Vai al carrello
              <ArrowRight size={19} aria-hidden="true" />
            </button>
          </div>
        </section>
      </main>
    );
  }

  function renderCheckout() {
    return (
      <main className="commerce-page">
        <section className="commerce-shell">
          <button className="back-link" type="button" onClick={() => navigateTo("shop")}>
            <ArrowRight size={17} aria-hidden="true" />
            Torna al catalogo
          </button>

          <div className="commerce-heading">
            <p className="eyebrow">Checkout</p>
            <h1>Completa i dati di spedizione</h1>
            <p>Il pagamento viene aperto dopo la conferma dell'ordine.</p>
          </div>

          {cartLines.length > 0 ? (
            <div className="checkout-layout">
              <form className="checkout-form" onSubmit={handleCheckoutSubmit}>
                <div className="form-section">
                  <h2>Contatti</h2>
                  <div className="form-grid">
                    <label>
                      Nome e cognome
                      <input
                        required
                        value={checkoutForm.fullName}
                        onChange={(event) => updateCheckoutField("fullName", event.target.value)}
                        autoComplete="name"
                      />
                    </label>
                    <label>
                      Email
                      <input
                        required
                        type="email"
                        value={checkoutForm.email}
                        onChange={(event) => updateCheckoutField("email", event.target.value)}
                        autoComplete="email"
                      />
                    </label>
                    <label>
                      Telefono
                      <input
                        required
                        type="tel"
                        value={checkoutForm.phone}
                        onChange={(event) => updateCheckoutField("phone", event.target.value)}
                        autoComplete="tel"
                      />
                    </label>
                  </div>
                </div>

                <div className="form-section">
                  <h2>Spedizione</h2>
                  <div className="form-grid">
                    <label className="span-2">
                      Indirizzo
                      <input
                        required
                        value={checkoutForm.address}
                        onChange={(event) => updateCheckoutField("address", event.target.value)}
                        autoComplete="street-address"
                      />
                    </label>
                    <label>
                      Città
                      <input
                        required
                        value={checkoutForm.city}
                        onChange={(event) => updateCheckoutField("city", event.target.value)}
                        autoComplete="address-level2"
                      />
                    </label>
                    <label>
                      Provincia
                      <input
                        required
                        value={checkoutForm.province}
                        onChange={(event) => updateCheckoutField("province", event.target.value)}
                        autoComplete="address-level1"
                      />
                    </label>
                    <label>
                      CAP
                      <input
                        required
                        value={checkoutForm.postalCode}
                        onChange={(event) => updateCheckoutField("postalCode", event.target.value)}
                        autoComplete="postal-code"
                      />
                    </label>
                    <label>
                      Paese
                      <input
                        required
                        value={checkoutForm.country}
                        onChange={(event) => updateCheckoutField("country", event.target.value)}
                        autoComplete="country-name"
                      />
                    </label>
                  </div>
                  <label>
                    Note per consegna o disponibilità
                    <textarea
                      value={checkoutForm.deliveryNotes}
                      onChange={(event) => updateCheckoutField("deliveryNotes", event.target.value)}
                      rows={3}
                    />
                  </label>
                </div>

                <div className="form-section">
                  <h2>Extra</h2>
                  <label className="checkbox-field">
                    <input
                      type="checkbox"
                      checked={checkoutForm.premiumPackaging}
                      onChange={(event) => updateCheckoutField("premiumPackaging", event.target.checked)}
                    />
                    <span>Confezione premium con scatola rigida e nastro</span>
                  </label>
                  <label>
                    Dedica personalizzata
                    <textarea
                      value={checkoutForm.dedication}
                      onChange={(event) => updateCheckoutField("dedication", event.target.value)}
                      rows={3}
                    />
                  </label>
                  <label>
                    Topper a tema
                    <input
                      value={checkoutForm.topperTheme}
                      onChange={(event) => updateCheckoutField("topperTheme", event.target.value)}
                      placeholder="Es. battesimo, laurea, compleanno"
                    />
                  </label>
                </div>

                {checkoutError && <p className="form-error">{checkoutError}</p>}

                <button className="checkout-button" type="submit" disabled={isSubmittingCheckout}>
                  <CreditCard size={19} aria-hidden="true" />
                  {isSubmittingCheckout ? "Preparazione pagamento..." : "Vai al pagamento"}
                </button>
              </form>

              <aside className="summary-panel" aria-label="Riepilogo ordine">
                <h2>Riepilogo</h2>
                <div className="summary-items">
                  {cartLines.map((line) => (
                    <div className="summary-item" key={`${line.product.id}-${line.option.id}`}>
                      <img src={line.product.images[0]} alt="" />
                      <div>
                        <strong>{line.product.title}</strong>
                        <span>
                          {line.option.label} • Quantità {line.quantity}
                        </span>
                      </div>
                      <b>{formatCurrency(line.lineTotalCents)}</b>
                    </div>
                  ))}
                </div>
                <div className="summary-totals">
                  <span>
                    Subtotale <strong>{formatCurrency(cartSubtotalCents)}</strong>
                  </span>
                  <span>
                    Spedizione <strong>{getShippingNote(cartSubtotalCents)}</strong>
                  </span>
                  <span className="grand-total">
                    Totale prodotti <strong>{formatCurrency(cartSubtotalCents)}</strong>
                  </span>
                </div>
              </aside>
            </div>
          ) : (
            <div className="empty-commerce">
              <ShoppingCart size={30} aria-hidden="true" />
              <h2>Il carrello è vuoto</h2>
              <button className="primary-link" type="button" onClick={() => navigateTo("shop")}>
                Sfoglia catalogo
              </button>
            </div>
          )}
        </section>
      </main>
    );
  }

  function renderPayment() {
    return (
      <main className="commerce-page">
        <section className="payment-card">
          <CreditCard size={36} aria-hidden="true" />
          <p className="eyebrow">Pagamento</p>
          <h1>Ordine ricevuto</h1>
          <p>
            {visibleOrder
              ? `Abbiamo salvato l'ordine ${visibleOrder.id}. Il pagamento online sarà aperto appena Stripe sarà configurato sul server.`
              : "Il modulo di pagamento è pronto per Stripe Checkout e verrà attivato con la chiave del conto Stripe."}
          </p>

          {visibleOrder && (
            <div className="payment-summary">
              <span>
                Totale prodotti <strong>{formatCurrency(visibleOrder.totalCents)}</strong>
              </span>
              <span>
                Stato <strong>{visibleOrder.status}</strong>
              </span>
              <span>
                Spedizione <strong>{visibleOrder.shippingNote}</strong>
              </span>
            </div>
          )}

          <div className="payment-actions">
            <a className="primary-link" href={createWhatsAppLink(undefined, visibleOrder ?? undefined)} target="_blank" rel="noreferrer">
              <MessageCircle size={19} aria-hidden="true" />
              Conferma su WhatsApp
            </a>
            <button className="secondary-action" type="button" onClick={() => navigateTo("shop")}>
              Torna al catalogo
            </button>
          </div>
        </section>
      </main>
    );
  }

  function renderSuccess() {
    const order = visibleOrder;

    return (
      <main className="commerce-page">
        <section className="payment-card success">
          <ShieldCheck size={38} aria-hidden="true" />
          <p className="eyebrow">Ordine completato</p>
          <h1>Grazie per il tuo ordine</h1>
          <p>
            {order
              ? `Ordine ${order.id} registrato correttamente. Riceverai conferma sui dettagli di spedizione.`
              : "Il pagamento è stato completato e l'ordine è stato registrato."}
          </p>
          <button className="primary-link" type="button" onClick={() => navigateTo("shop")}>
            Torna al catalogo
          </button>
        </section>
      </main>
    );
  }

  function renderAdmin() {
    if (!isAdminAuthenticated) {
      return (
        <main className="commerce-page">
          <section className="admin-page narrow">
            <div className="commerce-heading">
              <p className="eyebrow">Area admin</p>
              <h1>Accesso ordini</h1>
              <p>Inserisci le credenziali per consultare gli ordini ricevuti.</p>
            </div>

            <form className="admin-login" onSubmit={handleAdminSubmit}>
              <label>
                Username
                <input
                  required
                  value={adminLogin.username}
                  onChange={(event) => setAdminLogin((login) => ({ ...login, username: event.target.value }))}
                  autoComplete="username"
                />
              </label>
              <label>
                Password
                <input
                  required
                  type="password"
                  value={adminLogin.password}
                  onChange={(event) => setAdminLogin((login) => ({ ...login, password: event.target.value }))}
                  autoComplete="current-password"
                />
              </label>
              {adminError && <p className="form-error">{adminError}</p>}
              <button className="checkout-button" type="submit" disabled={adminLoading}>
                <Lock size={18} aria-hidden="true" />
                {adminLoading ? "Accesso..." : "Entra"}
              </button>
            </form>
          </section>
        </main>
      );
    }

    return (
      <main className="commerce-page">
        <section className="admin-page">
          <div className="admin-toolbar">
            <div className="commerce-heading">
              <p className="eyebrow">Area admin</p>
              <h1>Ordini ricevuti</h1>
              <p>{adminOrders.length} ordini salvati.</p>
            </div>
            <div>
              <button className="secondary-action" type="button" onClick={() => void loadAdminOrders()}>
                <ClipboardList size={18} aria-hidden="true" />
                Aggiorna
              </button>
              <button className="secondary-action" type="button" onClick={logoutAdmin}>
                <LogOut size={18} aria-hidden="true" />
                Esci
              </button>
            </div>
          </div>

          {adminOrders.length > 0 ? (
            <div className="orders-list">
              {adminOrders.map((order) => (
                <article className="order-card" key={order.id}>
                  <div className="order-card-head">
                    <div>
                      <strong>{order.id}</strong>
                      <span>{formatDate(order.createdAt)}</span>
                    </div>
                    <span className="status-pill">{order.status}</span>
                  </div>

                  <div className="order-columns">
                    <div>
                      <h2>Cliente</h2>
                      <p>{order.customer.fullName}</p>
                      <p>{order.customer.email}</p>
                      <p>{order.customer.phone}</p>
                    </div>
                    <div>
                      <h2>Spedizione</h2>
                      <p>{order.customer.address}</p>
                      <p>
                        {order.customer.postalCode} {order.customer.city} ({order.customer.province})
                      </p>
                      <p>{order.customer.country}</p>
                    </div>
                    <div>
                      <h2>Pagamento</h2>
                      <p>{order.paymentProvider}</p>
                      <p>{order.shippingNote}</p>
                      <p>
                        <strong>{formatCurrency(order.totalCents)}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="order-lines">
                    {order.items.map((item) => (
                      <span key={`${order.id}-${item.productId}-${item.optionId}`}>
                        {item.productTitle} • {item.optionLabel} • x{item.quantity} •{" "}
                        {formatCurrency(item.lineTotalCents)}
                      </span>
                    ))}
                  </div>

                  {(order.customer.premiumPackaging || order.customer.dedication || order.customer.topperTheme || order.customer.deliveryNotes) && (
                    <div className="order-notes">
                      {order.customer.premiumPackaging && <span>Confezione premium richiesta</span>}
                      {order.customer.dedication && <span>Dedica: {order.customer.dedication}</span>}
                      {order.customer.topperTheme && <span>Topper: {order.customer.topperTheme}</span>}
                      {order.customer.deliveryNotes && <span>Note: {order.customer.deliveryNotes}</span>}
                    </div>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-commerce">
              <ClipboardList size={30} aria-hidden="true" />
              <h2>Nessun ordine ancora registrato</h2>
            </div>
          )}
        </section>
      </main>
    );
  }

  return (
    <>
      <div className="announcement-bar">
        <span>Spedizione gratuita da 80€</span>
      </div>

      <header className="site-header">
        <a className="brand" href="#top" aria-label="Adornabile home" onClick={() => setView("shop")}>
          <span className="brand-mark">A</span>
          <span>
            <strong>Adornabile</strong>
            <small>Catalogo</small>
          </span>
        </a>

        <nav className="main-nav" aria-label="Navigazione principale">
          <a href="#catalogo">Catalogo</a>
          <a href="#palette">Palette</a>
          <a href="#atelier">Personalizzazioni</a>
          <a href="#ordini">Ordini</a>
        </nav>

        <button className="header-order cart-button" type="button" onClick={() => setIsCartOpen(true)}>
          <ShoppingCart size={19} aria-hidden="true" />
          Carrello
          <span className="cart-count">{cartCount}</span>
        </button>
      </header>

      {view === "shop" && renderShop()}
      {view === "checkout" && renderCheckout()}
      {view === "payment" && renderPayment()}
      {view === "success" && renderSuccess()}
      {view === "admin" && renderAdmin()}

      <footer className="footer">
        <strong>Adornabile Handmade</strong>
        <span>Catalogo online di prodotti artigianali profumati.</span>
        <a href={createWhatsAppLink()} target="_blank" rel="noreferrer">
          <Gift size={18} aria-hidden="true" />
          Richiedi informazioni
        </a>
      </footer>

      {isCartOpen && (
        <div className="cart-backdrop" onClick={() => setIsCartOpen(false)}>
          <aside className="cart-drawer" aria-label="Carrello" onClick={(event) => event.stopPropagation()}>
            <div className="cart-header">
              <div>
                <span>Carrello</span>
                <strong>{cartCount} prodotti</strong>
              </div>
              <button type="button" onClick={() => setIsCartOpen(false)} aria-label="Chiudi carrello" title="Chiudi">
                <X size={21} aria-hidden="true" />
              </button>
            </div>

            {cartLines.length > 0 ? (
              <>
                <div className="cart-items">
                  {cartLines.map((line) => (
                    <article className="cart-item" key={`${line.product.id}-${line.option.id}`}>
                      <img src={line.product.images[0]} alt="" />
                      <div>
                        <h3>{line.product.title}</h3>
                        <p>{line.option.label}</p>
                        <strong>{formatCurrency(line.lineTotalCents)}</strong>
                        <div className="quantity-control">
                          <button type="button" onClick={() => changeCartQuantity(line.product.id, line.option.id, -1)}>
                            <Minus size={15} aria-hidden="true" />
                          </button>
                          <span>{line.quantity}</span>
                          <button type="button" onClick={() => changeCartQuantity(line.product.id, line.option.id, 1)}>
                            <Plus size={15} aria-hidden="true" />
                          </button>
                          <button
                            className="remove-item"
                            type="button"
                            onClick={() => removeCartItem(line.product.id, line.option.id)}
                            aria-label={`Rimuovi ${line.product.title}`}
                            title="Rimuovi"
                          >
                            <Trash2 size={15} aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="cart-summary">
                  <span>
                    Subtotale <strong>{formatCurrency(cartSubtotalCents)}</strong>
                  </span>
                  <span>
                    <Truck size={17} aria-hidden="true" />
                    {getShippingNote(cartSubtotalCents)}
                  </span>
                  <button
                    className="checkout-button"
                    type="button"
                    onClick={() => {
                      setIsCartOpen(false);
                      navigateTo("checkout");
                    }}
                  >
                    <CreditCard size={18} aria-hidden="true" />
                    Procedi al checkout
                  </button>
                </div>
              </>
            ) : (
              <div className="empty-cart">
                <ShoppingBag size={30} aria-hidden="true" />
                <p>Il carrello è vuoto.</p>
                <button type="button" onClick={() => setIsCartOpen(false)}>
                  Continua lo shopping
                </button>
              </div>
            )}
          </aside>
        </div>
      )}

      {selectedProduct && selectedOption && (
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
                  className={selectedProduct.imageFit === "contain" ? "modal-main-image contain" : "modal-main-image"}
                  src={selectedProduct.images[selectedMediaIndex]}
                  alt={selectedProduct.title}
                  style={{ objectPosition: selectedProduct.imagePosition }}
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
                  <strong>{formatCurrency(selectedOption.priceCents)}</strong>
                </div>
                <div>
                  <span>Disponibilità</span>
                  <strong>
                    <Clock size={17} aria-hidden="true" />
                    Pochi pezzi disponibili
                  </strong>
                </div>
              </div>

              {selectedProduct.options.length > 1 && (
                <div className="variant-options" aria-label="Varianti prodotto">
                  <span>Formato</span>
                  <div>
                    {selectedProduct.options.map((option) => (
                      <button
                        className={selectedOption.id === option.id ? "active" : ""}
                        type="button"
                        key={option.id}
                        onClick={() => setSelectedOptionId(option.id)}
                      >
                        {option.label}
                        <strong>{formatCurrency(option.priceCents)}</strong>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="modal-addons" aria-label="Servizi aggiuntivi disponibili">
                <span>Extra disponibili</span>
                <ul>
                  {productOrderOptions.map((option) => (
                    <li key={option}>
                      <Check size={16} aria-hidden="true" />
                      {option}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                className="modal-order-link"
                type="button"
                onClick={() => {
                  addToCart(selectedProduct, selectedOption.id);
                  setSelectedProduct(null);
                }}
              >
                <ShoppingCart size={20} aria-hidden="true" />
                Aggiungi al carrello
              </button>

              <a className="modal-whatsapp-link" href={createWhatsAppLink(selectedProduct)} target="_blank" rel="noreferrer">
                <MessageCircle size={18} aria-hidden="true" />
                Domanda su WhatsApp
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
