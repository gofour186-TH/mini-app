(function () {
  const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
  const supabaseUrl = "https://yzwkyomcnpcdhsvltchc.supabase.co";
  const supabaseKey = "sb_publishable_xGvyWWlMJnP47EGrrFe5Ww_b6CplC5u";
  const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

  const countries = [
    { id: "thailand", label: "Таиланд" },
    { id: "russia", label: "Россия" }
  ];

  const directions = [
    { id: "th-1", country: "thailand", route: "RUB -> THB", rate: 0.384, eta: "7-15 мин", reserve: "1 250 000 THB" },
    { id: "th-2", country: "thailand", route: "USDT -> THB", rate: 33.82, eta: "5-12 мин", reserve: "820 000 THB" },
    { id: "ru-1", country: "russia", route: "RUB -> USDT", rate: 80.5, eta: "Наличный расчет в Москве", reserve: "от 4000 USDT" },
    { id: "ru-2", country: "russia", route: "RUB -> USD", rate: 80.5, eta: "Наличный расчет в Москве", reserve: "от 4000 USD" }
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
  const clientName = document.getElementById("clientName");
  const clientHandle = document.getElementById("clientHandle");
  const commentText = document.getElementById("commentText");

  let activeCountry = "thailand";
  let activeDirectionId = "th-1";
  let currentUser = {
    id: "guest-demo-user",
    username: "guest",
    fullName: "Гость"
  };

  function formatNumber(value) {
    return new Intl.NumberFormat("ru-RU", {
      maximumFractionDigits: 2
    }).format(value);
  }

  function getTelegramUser() {
    const user = tg && tg.initDataUnsafe ? tg.initDataUnsafe.user : null;
    if (!user) {
      return {
        id: "guest-demo-user",
        username: "guest",
        fullName: clientName.value.trim() || "Гость"
      };
    }

    return {
      id: String(user.id),
      username: user.username || "",
      fullName: [user.first_name, user.last_name].filter(Boolean).join(" ") || "Клиент"
    };
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
      return '<option value="' + item.id + '"' + selected + ">" + item.route + " • " + item.reserve + "</option>";
    }).join("");
  }

  function directionRateLabel(direction) {
    if (direction.route === "RUB -> THB") {
      return "1 THB = 2.6 RUB";
    }

    if (direction.id === "ru-1") {
      return "80.5 RUB / USDT";
    }

    if (direction.id === "ru-2") {
      return "80.5 RUB / USD";
    }

    return formatNumber(direction.rate);
  }

  function updateCreateForm() {
    const direction = selectedDirection();
    const amount = Number(amountFrom.value) || 0;
    const result = direction.id === "ru-1" || direction.id === "ru-2"
      ? amount / direction.rate
      : amount * direction.rate;

    summaryRate.textContent = direction.route === "RUB -> THB"
      ? "1 THB = 2.6 RUB"
      : direction.id === "ru-1"
        ? "Покупка USDT за наличный расчет в Москве: 80.5 RUB"
        : direction.id === "ru-2"
          ? "Покупка USD за наличный расчет в Москве: 80.5 RUB"
          : "1 " + direction.route.split(" -> ")[0] + " = " + formatNumber(direction.rate) + " " + direction.route.split(" -> ")[1];
    amountTo.value = formatNumber(result) + " " + direction.route.split(" -> ")[1];
  }

  function renderDeals() {
    if (!deals.length) {
      dealsList.innerHTML = [
        '<article class="deal-card">',
        '  <div class="deal-route">Пока нет сделок</div>',
        '  <div class="deal-meta">Новые заявки будут появляться здесь автоматически.</div>',
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

  async function loadDeals() {
    currentUser = getTelegramUser();

    const { data, error } = await supabase
      .from("deals")
      .select("*")
      .eq("telegram_id", currentUser.id)
      .order("created_at", { ascending: false });

    if (error) {
      formStatus.textContent = "Не удалось загрузить сделки.";
      renderDeals();
      return;
    }

    deals.length = 0;
    data.forEach(function (deal) {
      deals.push({
        id: deal.id.slice(0, 8).toUpperCase(),
        route: deal.direction,
        amount: deal.amount_from + " -> " + deal.amount_to,
        status: deal.status || "Новая",
        statusClass: deal.status === "Завершено" ? "success" : ""
      });
    });

    renderDeals();
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

  async function notifyTelegram(deal) {
    try {
      const response = await fetch("/.netlify/functions/send-deal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          dealId: deal.id,
          fullName: clientName.value.trim() || currentUser.fullName,
          username: clientHandle.value.trim() || currentUser.username || "",
          telegramId: currentUser.id,
          direction: deal.route,
          amountFrom: deal.amount.split(" -> ")[0],
          amountTo: deal.amount.split(" -> ")[1],
          comment: commentText.value.trim()
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(function () {
          return {};
        });
        formStatus.textContent = "Заявка сохранена, но не отправлена в Telegram: " + (errorData.error || response.status);
      }
    } catch (error) {
      formStatus.textContent = "Заявка сохранена, но Telegram недоступен: " + error.message;
    }
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

    document.getElementById("createDealBtn").addEventListener("click", async function () {
      const direction = selectedDirection();
      const payload = {
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        telegram_id: currentUser.id,
        username: clientHandle.value.trim() || currentUser.username || "",
        full_name: clientName.value.trim() || currentUser.fullName,
        direction: direction.route,
        amount_from: amountFrom.value + " " + direction.route.split(" -> ")[0],
        amount_to: amountTo.value,
        status: "Новая"
      };

      const { data, error } = await supabase
        .from("deals")
        .insert(payload)
        .select()
        .single();

      if (error) {
        formStatus.textContent = "Не удалось создать заявку: " + error.message;
        return;
      }

      const newDeal = {
        id: data.id.slice(0, 8).toUpperCase(),
        route: direction.route,
        amount: payload.amount_from + " -> " + payload.amount_to,
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
          amountTo: amountTo.value,
          comment: commentText.value.trim()
        }));
      }

      await notifyTelegram(newDeal);
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
    currentUser = getTelegramUser();
    clientName.value = currentUser.fullName;
    clientHandle.value = currentUser.username ? "@" + currentUser.username : clientHandle.value;
    renderCountries();
    renderDirections();
    renderDirectionSelect();
    renderDeals();
    renderChat();
    updateCreateForm();
    bindEvents();
    initTelegram();
    loadDeals();
  }

  init();
})();
