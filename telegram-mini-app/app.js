(function () {
  const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;

  const countries = [
    { id: "thailand", label: "Таиланд" },(function () {
  const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;

  const countries = [
    { id: "thailand", label: "Таиланд" },
    { id: "bali", label: "Бали" },
    { id: "dubai", label: "Дубай" },
    { id: "china", label: "Китай" }
  ];

  const directions = [
    { id: "th-1", country: "thailand", route: "RUB -> THB", rate: 1 / 2.6, eta: "7-15 мин" },
    { id: "th-2", country: "thailand", route: "USDT -> THB", rate: 33.82, eta: "5-12 мин" },
    { id: "ba-1", country: "bali", route: "RUB -> IDR", rate: 175.5, eta: "10-20 мин" },
    { id: "ba-2", country: "bali", route: "USDT -> IDR", rate: 16122, eta: "7-15 мин" },
    { id: "du-1", country: "dubai", route: "RUB -> AED", rate: 0.041, eta: "12-18 мин" },
    { id: "du-2", country: "dubai", route: "USDT -> AED", rate: 3.66, eta: "5-10 мин" },
    { id: "cn-1", country: "china", route: "RUB -> CNY", rate: 0.079, eta: "10-25 мин" },
    { id: "cn-2", country: "china", route: "USDT -> CNY", rate: 7.24, eta: "6-12 мин" }
  ];

  const deals = [];

  const chatMessages = [
    { role: "manager", text: "Здравствуйте. Я менеджер FXBridge, помогу оформить обмен и подтвержу детали.", time: "11:02" },
    { role: "user", text: "Здравствуйте. Хочу обменять рубли на баты сегодня.", time: "11:03" },
    { role: "manager", text: "Отлично, создайте заявку на экране обмена. Я сразу подхвачу её в работу.", time: "11:04" }
  ];

  const countryFilters = document.getElementById("countryFilters");
  const directionsList = document.getElementById("directionsList");
  const directionSelect = document.getElementById("directionSelect");
  const countryNote = document.getElementById("countryNote");
  const amountFrom = document.getElementById("amountFrom");
  const amountTo = document.getElementById("amountTo");
  const summaryRate = document.getElementById("summaryRate");
  const formStatus = document.getElementById("formStatus");
  const dealsList = document.getElementById("dealsList");
  const chatMessagesNode = document.getElementById("chatMessages");
  const chatInput = document.getElementById("chatInput");
  const sendChatBtn = document.getElementById("sendChatBtn");

  let activeCountry = "thailand";
  let activeDirectionId = "th-1";

  function formatNumber(value) {
    return new Intl.NumberFormat("ru-RU", {
      maximumFractionDigits: 2
    }).format(value);
  }

  function openScreen(screenName) {
    document.querySelectorAll(".screen").forEach(function (screen) {
      screen.classList.toggle("screen-active", screen.dataset.screen === screenName);
    });

    document.querySelectorAll(".nav-item").forEach(function (item) {
      item.classList.toggle("nav-item-active", item.dataset.openScreen === screenName);
    });
  }

  function filteredDirections() {
    return directions.filter(function (item) {
      return item.country === activeCountry;
    });
  }

  function selectedDirection() {
    return directions.find(function (item) {
      return item.id === activeDirectionId;
    }) || filteredDirections()[0];
  }

  function renderCountries() {
    countryFilters.innerHTML = countries.map(function (country) {
      const activeClass = country.id === activeCountry ? "chip chip-active" : "chip";
      return '<button class="' + activeClass + '" type="button" data-country="' + country.id + '">' + country.label + "</button>";
    }).join("");
  }

  function renderDirections() {
    const currentCountry = countries.find(function (item) {
      return item.id === activeCountry;
    });
    const items = filteredDirections();

    countryNote.textContent = currentCountry ? currentCountry.label : "";
    directionsList.innerHTML = items.map(function (item) {
      return [
        '<article class="direction-card">',
        '  <div class="direction-top">',
        '    <div>',
        '      <div class="direction-route">' + item.route + "</div>",
        '      <div class="direction-meta">' + item.eta + "</div>",
        "    </div>",
        '    <div class="direction-rate">' + directionRateLabel(item) + "</div>",
        "  </div>",
        '  <button type="button" data-direction="' + item.id + '">Выбрать</button>',
        "</article>"
      ].join("");
    }).join("");
  }

  function renderDirectionSelect() {
    directionSelect.innerHTML = directions.map(function (item) {
      const selected = item.id === activeDirectionId ? " selected" : "";
      return '<option value="' + item.id + '"' + selected + ">" + item.route + "</option>";
    }).join("");
  }

  function directionRateLabel(direction) {
    if (direction.route === "RUB -> THB") {
      return "1 THB = 2.6 RUB";
    }

    return formatNumber(direction.rate);
  }

  function updateCreateForm() {
    const direction = selectedDirection();
    const amount = Number(amountFrom.value) || 0;
    const result = amount * direction.rate;

    summaryRate.textContent = direction.route === "RUB -> THB"
      ? "1 THB = 2.6 RUB"
      : "1 " + direction.route.split(" -> ")[0] + " = " + formatNumber(direction.rate) + " " + direction.route.split(" -> ")[1];
    amountTo.value = formatNumber(result) + " " + direction.route.split(" -> ")[1];
  }

  function renderDeals() {
    if (!deals.length) {
      dealsList.innerHTML = [
        '<article class="deal-card">',
        '  <div class="deal-route">Пока нет сделок</div>',
        '  <div class="deal-meta">Когда клиент создаст первую заявку, она появится здесь.</div>',
        "</article>"
      ].join("");
      return;
    }

    dealsList.innerHTML = deals.map(function (deal) {
      const statusClass = deal.statusClass ? "deal-status " + deal.statusClass : "deal-status";
      return [
        '<article class="deal-card">',
        '  <div class="deal-top">',
        '    <div>',
        '      <div class="deal-route">' + deal.id + "</div>",
        '      <div class="deal-meta">' + deal.route + "</div>",
        "    </div>",
        '    <span class="' + statusClass + '">' + deal.status + "</span>",
        "  </div>",
        "  <strong>" + deal.amount + "</strong>",
        "</article>"
      ].join("");
    }).join("");
  }

  function renderChat() {
    chatMessagesNode.innerHTML = chatMessages.map(function (message) {
      const bubbleClass = message.role === "manager" ? "bubble bubble-manager" : "bubble bubble-user";
      return [
        '<article class="' + bubbleClass + '">',
        "  <p>" + message.text + "</p>",
        '  <span class="bubble-meta">' + message.time + "</span>",
        "</article>"
      ].join("");
    }).join("");
    chatMessagesNode.scrollTop = chatMessagesNode.scrollHeight;
  }

  function bindEvents() {
    document.addEventListener("click", function (event) {
      const screenTrigger = event.target.closest("[data-open-screen]");
      if (screenTrigger) {
        openScreen(screenTrigger.dataset.openScreen);
      }

      const countryButton = event.target.closest("[data-country]");
      if (countryButton) {
        activeCountry = countryButton.dataset.country;
        const fallbackDirection = filteredDirections()[0];
        activeDirectionId = fallbackDirection ? fallbackDirection.id : activeDirectionId;
        renderCountries();
        renderDirections();
        renderDirectionSelect();
        updateCreateForm();
      }

      const directionButton = event.target.closest("[data-direction]");
      if (directionButton) {
        activeDirectionId = directionButton.dataset.direction;
        renderDirectionSelect();
        updateCreateForm();
        openScreen("create");
      }
    });

    directionSelect.addEventListener("change", function () {
      activeDirectionId = directionSelect.value;
      updateCreateForm();
    });

    amountFrom.addEventListener("input", updateCreateForm);

    document.getElementById("createDealBtn").addEventListener("click", function () {
      const direction = selectedDirection();
      const newDeal = {
        id: "FX-" + String(2015 + deals.length),
        route: direction.route,
        amount: amountFrom.value + " " + direction.route.split(" -> ")[0] + " -> " + amountTo.value,
        status: "Новая",
        statusClass: ""
      };

      deals.unshift(newDeal);
      chatMessages.push({
        role: "manager",
        text: "Заявка " + newDeal.id + " создана. Вижу направление " + direction.route + ". Подтверждаю детали в чате.",
        time: "сейчас"
      });

      renderDeals();
      renderChat();

      formStatus.textContent = "Заявка " + newDeal.id + " создана. Переходим в чат с менеджером.";

      if (tg) {
        tg.HapticFeedback.notificationOccurred("success");
        tg.sendData(JSON.stringify({
          type: "deal_created",
          dealId: newDeal.id,
          route: direction.route,
          amountFrom: amountFrom.value,
          amountTo: amountTo.value
        }));
      }

      openScreen("chat");
    });

    sendChatBtn.addEventListener("click", function () {
      const text = chatInput.value.trim();
      if (!text) {
        return;
      }

      chatMessages.push({
        role: "user",
        text: text,
        time: "сейчас"
      });

      chatInput.value = "";
      renderChat();
    });
  }

  function initTelegram() {
    if (!tg) {
      return;
    }

    tg.ready();
    tg.expand();
    tg.MainButton.hide();
    document.documentElement.style.setProperty("color-scheme", "light");
  }

  function init() {
    renderCountries();
    renderDirections();
    renderDirectionSelect();
    renderDeals();
    renderChat();
    updateCreateForm();
    bindEvents();
    initTelegram();
  }

  init();
})();

    { id: "bali", label: "Бали" },
    { id: "dubai", label: "Дубай" },
    { id: "china", label: "Китай" }
  ];

  const directions = [
    { id: "th-1", country: "thailand", route: "RUB -> THB", rate: 0.384, eta: "7-15 мин", reserve: "1 250 000 THB" },
    { id: "th-2", country: "thailand", route: "USDT -> THB", rate: 33.82, eta: "5-12 мин", reserve: "820 000 THB" },
    { id: "ba-1", country: "bali", route: "RUB -> IDR", rate: 175.5, eta: "10-20 мин", reserve: "410 000 000 IDR" },
    { id: "ba-2", country: "bali", route: "USDT -> IDR", rate: 16122, eta: "7-15 мин", reserve: "590 000 000 IDR" },
    { id: "du-1", country: "dubai", route: "RUB -> AED", rate: 0.041, eta: "12-18 мин", reserve: "320 000 AED" },
    { id: "du-2", country: "dubai", route: "USDT -> AED", rate: 3.66, eta: "5-10 мин", reserve: "480 000 AED" },
    { id: "cn-1", country: "china", route: "RUB -> CNY", rate: 0.079, eta: "10-25 мин", reserve: "650 000 CNY" },
    { id: "cn-2", country: "china", route: "USDT -> CNY", rate: 7.24, eta: "6-12 мин", reserve: "920 000 CNY" }
  ];

  const deals = [
    { id: "FX-2014", route: "RUB -> THB", amount: "50 000 RUB -> 19 200 THB", status: "В работе", statusClass: "" },
    { id: "FX-2013", route: "USDT -> AED", amount: "1 200 USDT -> 4 392 AED", status: "Завершено", statusClass: "success" },
    { id: "FX-2012", route: "RUB -> CNY", amount: "95 000 RUB -> 7 505 CNY", status: "Завершено", statusClass: "success" }
  ];

  const chatMessages = [
    { role: "manager", text: "Здравствуйте. Я менеджер FXBridge, помогу оформить обмен и подтвержу детали.", time: "11:02" },
    { role: "user", text: "Здравствуйте. Хочу обменять рубли на баты сегодня.", time: "11:03" },
    { role: "manager", text: "Отлично, создайте заявку на экране обмена. Я сразу подхвачу её в работу.", time: "11:04" }
  ];

  const countryFilters = document.getElementById("countryFilters");
  const directionsList = document.getElementById("directionsList");
  const directionSelect = document.getElementById("directionSelect");
  const countryNote = document.getElementById("countryNote");
  const amountFrom = document.getElementById("amountFrom");
  const amountTo = document.getElementById("amountTo");
  const summaryRate = document.getElementById("summaryRate");
  const formStatus = document.getElementById("formStatus");
  const dealsList = document.getElementById("dealsList");
  const chatMessagesNode = document.getElementById("chatMessages");
  const chatInput = document.getElementById("chatInput");
  const sendChatBtn = document.getElementById("sendChatBtn");

  let activeCountry = "thailand";
  let activeDirectionId = "th-1";

  function formatNumber(value) {
    return new Intl.NumberFormat("ru-RU", {
      maximumFractionDigits: 2
    }).format(value);
  }

  function openScreen(screenName) {
    document.querySelectorAll(".screen").forEach(function (screen) {
      screen.classList.toggle("screen-active", screen.dataset.screen === screenName);
    });

    document.querySelectorAll(".nav-item").forEach(function (item) {
      item.classList.toggle("nav-item-active", item.dataset.openScreen === screenName);
    });
  }

  function filteredDirections() {
    return directions.filter(function (item) {
      return item.country === activeCountry;
    });
  }

  function selectedDirection() {
    return directions.find(function (item) {
      return item.id === activeDirectionId;
    }) || filteredDirections()[0];
  }

  function renderCountries() {
    countryFilters.innerHTML = countries.map(function (country) {
      const activeClass = country.id === activeCountry ? "chip chip-active" : "chip";
      return '<button class="' + activeClass + '" type="button" data-country="' + country.id + '">' + country.label + "</button>";
    }).join("");
  }

  function renderDirections() {
    const currentCountry = countries.find(function (item) {
      return item.id === activeCountry;
    });
    const items = filteredDirections();

    countryNote.textContent = currentCountry ? currentCountry.label : "";
    directionsList.innerHTML = items.map(function (item) {
      return [
        '<article class="direction-card">',
        '  <div class="direction-top">',
        '    <div>',
        '      <div class="direction-route">' + item.route + "</div>",
        '      <div class="direction-meta">Резерв: ' + item.reserve + " • " + item.eta + "</div>",
        "    </div>",
        '    <div class="direction-rate">' + formatNumber(item.rate) + "</div>",
        "  </div>",
        '  <button type="button" data-direction="' + item.id + '">Выбрать</button>',
        "</article>"
      ].join("");
    }).join("");
  }

  function renderDirectionSelect() {
    directionSelect.innerHTML = directions.map(function (item) {
      const selected = item.id === activeDirectionId ? " selected" : "";
      return '<option value="' + item.id + '"' + selected + ">" + item.route + " • " + item.reserve + "</option>";
    }).join("");
  }

  function updateCreateForm() {
    const direction = selectedDirection();
    const amount = Number(amountFrom.value) || 0;
    const result = amount * direction.rate;

    summaryRate.textContent = "1 " + direction.route.split(" -> ")[0] + " = " + formatNumber(direction.rate) + " " + direction.route.split(" -> ")[1];
    amountTo.value = formatNumber(result) + " " + direction.route.split(" -> ")[1];
  }

  function renderDeals() {
    dealsList.innerHTML = deals.map(function (deal) {
      const statusClass = deal.statusClass ? "deal-status " + deal.statusClass : "deal-status";
      return [
        '<article class="deal-card">',
        '  <div class="deal-top">',
        '    <div>',
        '      <div class="deal-route">' + deal.id + "</div>",
        '      <div class="deal-meta">' + deal.route + "</div>",
        "    </div>",
        '    <span class="' + statusClass + '">' + deal.status + "</span>",
        "  </div>",
        "  <strong>" + deal.amount + "</strong>",
        "</article>"
      ].join("");
    }).join("");
  }

  function renderChat() {
    chatMessagesNode.innerHTML = chatMessages.map(function (message) {
      const bubbleClass = message.role === "manager" ? "bubble bubble-manager" : "bubble bubble-user";
      return [
        '<article class="' + bubbleClass + '">',
        "  <p>" + message.text + "</p>",
        '  <span class="bubble-meta">' + message.time + "</span>",
        "</article>"
      ].join("");
    }).join("");
    chatMessagesNode.scrollTop = chatMessagesNode.scrollHeight;
  }

  function bindEvents() {
    document.addEventListener("click", function (event) {
      const screenTrigger = event.target.closest("[data-open-screen]");
      if (screenTrigger) {
        openScreen(screenTrigger.dataset.openScreen);
      }

      const countryButton = event.target.closest("[data-country]");
      if (countryButton) {
        activeCountry = countryButton.dataset.country;
        const fallbackDirection = filteredDirections()[0];
        activeDirectionId = fallbackDirection ? fallbackDirection.id : activeDirectionId;
        renderCountries();
        renderDirections();
        renderDirectionSelect();
        updateCreateForm();
      }

      const directionButton = event.target.closest("[data-direction]");
      if (directionButton) {
        activeDirectionId = directionButton.dataset.direction;
        renderDirectionSelect();
        updateCreateForm();
        openScreen("create");
      }
    });

    directionSelect.addEventListener("change", function () {
      activeDirectionId = directionSelect.value;
      updateCreateForm();
    });

    amountFrom.addEventListener("input", updateCreateForm);

    document.getElementById("createDealBtn").addEventListener("click", function () {
      const direction = selectedDirection();
      const newDeal = {
        id: "FX-" + String(2015 + deals.length),
        route: direction.route,
        amount: amountFrom.value + " " + direction.route.split(" -> ")[0] + " -> " + amountTo.value,
        status: "Новая",
        statusClass: ""
      };

      deals.unshift(newDeal);
      chatMessages.push({
        role: "manager",
        text: "Заявка " + newDeal.id + " создана. Вижу направление " + direction.route + ". Подтверждаю детали в чате.",
        time: "сейчас"
      });

      renderDeals();
      renderChat();

      formStatus.textContent = "Заявка " + newDeal.id + " создана. Переходим в чат с менеджером.";

      if (tg) {
        tg.HapticFeedback.notificationOccurred("success");
        tg.sendData(JSON.stringify({
          type: "deal_created",
          dealId: newDeal.id,
          route: direction.route,
          amountFrom: amountFrom.value,
          amountTo: amountTo.value
        }));
      }

      openScreen("chat");
    });

    sendChatBtn.addEventListener("click", function () {
      const text = chatInput.value.trim();
      if (!text) {
        return;
      }

      chatMessages.push({
        role: "user",
        text: text,
        time: "сейчас"
      });

      chatInput.value = "";
      renderChat();
    });
  }

  function initTelegram() {
    if (!tg) {
      return;
    }

    tg.ready();
    tg.expand();
    tg.MainButton.hide();
    document.documentElement.style.setProperty("color-scheme", "light");
  }

  function init() {
    renderCountries();
    renderDirections();
    renderDirectionSelect();
    renderDeals();
    renderChat();
    updateCreateForm();
    bindEvents();
    initTelegram();
  }

  init();
})();
