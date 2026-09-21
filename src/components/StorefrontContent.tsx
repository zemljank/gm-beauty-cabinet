import { brands, products } from "../data/products";

import { careConcerns } from "../data/storefront";

export function ConcernSection({ onSelect }: { onSelect: (query: string) => void }) {
  return (
    <section className="section-card" id="concerns">
      <div className="section-heading">
        <div><p className="section-kicker">Потребности кожи</p><h2>Начните с вашего запроса</h2></div>
        <p>Откройте подборку, затем уточните бренд, формат и бюджет с помощью фильтров.</p>
      </div>
      <div className="concern-grid">
        {careConcerns.map((item, index) => (
          <button className="concern-card" type="button" key={item.query} onClick={() => onSelect(item.query)}>
            <span className="content-number">0{index + 1}</span>
            <h3>{item.title}</h3><p>{item.text}</p>
            <span className="content-link">Смотреть средства <span aria-hidden="true">↗</span></span>
          </button>
        ))}
      </div>
    </section>
  );
}

export function BrandSection({ onSelect }: { onSelect: (brand: string) => void }) {
  return (
    <section className="section-card brands-section">
      <div className="section-heading">
        <div><p className="section-kicker">Бренды каталога</p><h2>Ваш привычный уход</h2></div>
        <p>Найдите знакомое средство или познакомьтесь с другими линейками.</p>
      </div>
      <div className="brand-grid">
        {brands.filter((brand) => brand !== "Все бренды").map((brand) => (
          <button className="brand-tile" type="button" key={brand} onClick={() => onSelect(brand)}>
            <strong>{brand}</strong>
            <span>Позиций в каталоге: {products.filter((product) => product.brand === brand).length} <span aria-hidden="true">↗</span></span>
          </button>
        ))}
      </div>
    </section>
  );
}

const questions = [
  { title: "Как найти подходящее средство?", text: "Начните с категории или потребности кожи. В каталоге можно выбрать несколько фильтров, задать диапазон цены и отсортировать результаты. В карточке каждого средства указаны объём, описание и стоимость." },
  { title: "Как сохранить средства на потом?", text: "Нажмите на сердечко в карточке товара. Подборка появится в разделе «Избранное». Избранное и корзина сохраняются в этом браузере на вашем устройстве; на другом устройстве подборку нужно собрать заново." },
  { title: "Как передать список администратору?", text: "Добавьте средства в корзину и нажмите «Подготовить список». Скопируйте его и отправьте администратору клиники через привычный канал связи. Само добавление в корзину не оформляет заказ и не резервирует товары." },
  { title: "Как уточнить наличие, оплату и получение?", text: "Наличие, актуальную стоимость и условия получения подтвердит администратор перед заказом. Перейти на основной сайт клиники можно по ссылке ниже." }
];

export function ShoppingHelp({ compact = false }: { compact?: boolean }) {
  return (
    <section className="section-card shopping-help" id="help">
      <div className="section-heading">
        <div><p className="section-kicker">Помощь с выбором</p>{compact ? <h2>От выбора до заказа</h2> : <h1>Как пользоваться каталогом</h1>}</div>
        <p>Соберите свой список средств, сохраните его и уточните детали у администратора GM BEAUTY.</p>
      </div>
      <ol className="shopping-steps">
        <li><span className="content-number">01</span><h3>Выберите средства</h3><p>Используйте категории, поиск и фильтры каталога.</p></li>
        <li><span className="content-number">02</span><h3>Соберите список</h3><p>Сохраните понравившееся в избранное или добавьте в корзину.</p></li>
        <li><span className="content-number">03</span><h3>Уточните детали</h3><p>Передайте список администратору для подтверждения заказа.</p></li>
      </ol>
      <div className="help-questions">
        {questions.map((question) => <details key={question.title}><summary>{question.title}</summary><p>{question.text}</p></details>)}
      </div>
      <a className="button-secondary clinic-link" href="https://gm-beauty.ru/" target="_blank" rel="noreferrer">Связаться с клиникой <span aria-hidden="true">↗</span></a>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div><a className="footer-brand" href="#top">GM BEAUTY</a><p>Каталог домашнего ухода.<br />Ваши средства — в одном месте.</p></div>
      <nav aria-label="Навигация в подвале"><a href="#catalog">Каталог</a><a href="#favorites">Избранное</a><a href="#cart">Корзина</a><a href="#help">Помощь с заказом</a></nav>
      <div><a className="content-link" href="https://gm-beauty.ru/" target="_blank" rel="noreferrer">Сайт клиники ↗</a><p>Наличие, стоимость и условия получения уточняйте у администратора.</p></div>
    </footer>
  );
}
