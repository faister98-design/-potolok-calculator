import { useMemo, useState } from "react";
import bridge from "@vkontakte/vk-bridge";

type Unit = "пог. м" | "шт." | "м²";
type PriceItem = { id: string; name: string; price: number; unit: Unit; note?: string };

const PRICE_ITEMS: PriceItem[] = [
  { id: "shadow", name: "Потолок с теневым профилем", price: 2200, unit: "пог. м" },
  { id: "floating-lit", name: "Потолок с парящим профилем (с подсветкой)", price: 2700, unit: "пог. м" },
  { id: "floating", name: "Потолок с парящим профилем (без подсветки)", price: 2500, unit: "пог. м" },
  { id: "curtain-pk", name: "Скрытый карниз (ПК-14, ПК-15)", price: 5500, unit: "пог. м" },
  { id: "curtain-pk-lit", name: "Скрытый карниз с подсветкой (ПК-14, ПК-15)", price: 6000, unit: "пог. м" },
  { id: "curtain-niche", name: "Ниша под карниз", price: 3000, unit: "пог. м" },
  { id: "light-line", name: "Световая линия", price: 4500, unit: "пог. м" },
  { id: "track", name: "Трековое освещение (без материала)", price: 2500, unit: "пог. м" },
  { id: "chandelier", name: "Установка люстры", price: 1000, unit: "шт." },
  { id: "spot", name: "Установка точечного светильника без материала", price: 600, unit: "шт." },
  { id: "chandelier-assembly", name: "Сборка и установка люстры (от)", price: 2000, unit: "шт.", note: "Минимальная цена; зависит от сложности." },
  { id: "am1", name: "Монтаж скрытого карниза AM-1", price: 3000, unit: "пог. м" },
  { id: "bn", name: "Встраиваемый светильник ВН (точка с материалом)", price: 3500, unit: "шт." },
  { id: "fan", name: "Теневой вентилятор (с материалом)", price: 5000, unit: "шт." },
  { id: "diffuser", name: "Теневой диффузор (с материалом)", price: 3200, unit: "шт." },
  { id: "pvc", name: "ПВХ профиль", price: 1500, unit: "м²" }
];

const money = (value: number) =>
  new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(value) + " ₽";

export default function App() {
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [room, setRoom] = useState("");
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  const selected = useMemo(() => PRICE_ITEMS
    .map(item => ({ ...item, quantity: Math.max(0, Number(quantities[item.id]) || 0) }))
    .filter(item => item.quantity > 0)
    .map(item => ({ ...item, sum: item.quantity * item.price })), [quantities]);

  const total = selected.reduce((sum, item) => sum + item.sum, 0);

  const setQuantity = (id: string, value: string) => {
    if (value !== "" && (!/^\d*([.,]\d*)?$/.test(value) || Number(value.replace(",", ".")) < 0)) return;
    setQuantities(old => ({ ...old, [id]: value.replace(",", ".") }));
  };

  async function sendRequest() {
    if (!selected.length) {
      setMessage("Сначала выберите хотя бы одну услугу и укажите количество.");
      return;
    }
    setSending(true);
    setMessage("");
    const payload = {
      type: "ceiling_calculation_request",
      community_id: 240467668,
      room,
      comment,
      items: selected.map(({ id, name, price, unit, quantity, sum }) => ({ id, name, price, unit, quantity, sum })),
      total,
      currency: "RUB",
      created_at: new Date().toISOString()
    };
    try {
      await bridge.send("VKWebAppSendPayload", { payload: JSON.stringify(payload) });
      setMessage("Заявка передана в сообщество. Спасибо!");
    } catch {
      try {
        await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
        setMessage("Не удалось отправить заявку через VK. Данные расчёта скопированы — передайте их менеджеру сообщества.");
      } catch {
        setMessage("Не удалось отправить заявку. Пожалуйста, сделайте скриншот расчёта и напишите сообществу.");
      }
    } finally {
      setSending(false);
    }
  }

  return <main className="page">
    <header className="hero">
      <div className="eyebrow">РАСЧЁТ ОНЛАЙН</div>
      <h1>Натяжные потолки</h1>
      <p>Выберите нужные работы и узнайте предварительную стоимость</p>
    </header>

    <section className="panel">
      <div className="section-heading"><span>01</span><div><h2>Ваш заказ</h2><p>Укажите количество по каждой позиции</p></div></div>
      <div className="items">
        {PRICE_ITEMS.map((item, index) => <div className="item" key={item.id}>
          <div className="item-main">
            <div className="item-name"><span className="item-index">{String(index + 1).padStart(2, "0")}</span>{item.name}</div>
            <div className="item-price">{money(item.price)} / {item.unit}</div>
            {item.note && <div className="item-note">{item.note}</div>}
          </div>
          <label className="quantity">
            <span>Кол-во</span>
            <input inputMode="decimal" type="number" min="0" step="0.1" placeholder="0" value={quantities[item.id] ?? ""} onChange={e => setQuantity(item.id, e.target.value)} />
          </label>
        </div>)}
      </div>
    </section>

    <section className="panel">
      <div className="section-heading"><span>02</span><div><h2>Детали заявки</h2><p>Необязательно</p></div></div>
      <label className="field">Название помещения / адрес
        <input value={room} onChange={e => setRoom(e.target.value)} placeholder="Например: кухня, 12 м²" />
      </label>
      <label className="field">Комментарий
        <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Дополнительные пожелания..." rows={3} />
      </label>
    </section>

    <section className="total-card">
      <div className="total-top"><div><span>ПРЕДВАРИТЕЛЬНАЯ СТОИМОСТЬ</span><small>{selected.length} позиций выбрано</small></div><strong>{money(total)}</strong></div>
      {selected.length > 0 && <div className="breakdown">{selected.map(item => <div key={item.id}><span>{item.name} · {item.quantity} {item.unit}</span><b>{money(item.sum)}</b></div>)}</div>}
      <p className="disclaimer">Расчёт предварительный. Окончательная стоимость подтверждается после замера и согласования деталей.</p>
      <button className="primary" onClick={sendRequest} disabled={sending}>{sending ? "Отправляем..." : "Отправить заявку в ВКонтакте"}</button>
      <button className="reset" onClick={() => { setQuantities({}); setRoom(""); setComment(""); setMessage(""); }}>Очистить расчёт</button>
      {message && <div className="status" role="status">{message}</div>}
    </section>
    <footer>Прайс-лист · Все цены указаны в рублях</footer>
  </main>;
}
