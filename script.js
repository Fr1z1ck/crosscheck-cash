// Глобальные переменные для хранения данных
let orderData = null;  // Данные заказа МС
let kassaData = null;  // Данные из КАССЫ
let comparisonResults = null;  // Результаты сравнения
let orderFile = null;  // Файл заказа
let currentTheme = 'classic';  // Текущая тема
let currentSort = { field: 'name', direction: 'asc' }; // Текущая сортировка - меняем дефолтную сортировку на имя
let currentFontSize = 100;  // Текущий размер шрифта в процентах
let currentUIScale = 100;   // Текущий масштаб интерфейса в процентах
let hideUnmarkedItems = false; // Флаг для скрытия/показа немаркированных товаров
let currentTab = 'all'; // Текущая вкладка
let countByMentions = true; // Режим подсчёта количества: false - по значению, true - по упоминания

// Глобальный объект для хранения состояния проверки товаров
let checkedItems = new Map();

// DOM элементы
const fileInput = document.getElementById('fileInput');
const kassaTextarea = document.getElementById('kassaTextarea');
const analyzeBtn = document.getElementById('analyzeBtn');
const resetBtn = document.getElementById('resetBtn');
const clearTextBtn = document.getElementById('clearTextBtn');
const statsContainer = document.getElementById('statsContainer');
const filterInput = document.getElementById('filterInput');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const themeOptions = document.querySelectorAll('.theme-option');
const guideBtn = document.getElementById('guideBtn');
const guideModal = document.getElementById('guideModal');

// Элементы настроек
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const closeModalBtn = document.querySelector('.close-modal');

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    console.log('Приложение инициализировано');
    
    // Проверяем наличие сохраненной темы
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        setTheme(savedTheme);
    } else {
        setTheme('classic');
    }
    
    // Проверяем наличие сохраненного размера шрифта
    const savedFontSize = localStorage.getItem('fontSize');
    if (savedFontSize) {
        setFontSize(parseInt(savedFontSize));
    } else {
        setFontSize(100); // Устанавливаем 100% при первом запуске
    }

    // Проверяем наличие сохраненного масштаба интерфейса
    const savedUIScale = localStorage.getItem('uiScale');
    if (savedUIScale) {
        setUIScale(parseInt(savedUIScale));
    } else {
        setUIScale(100); // Устанавливаем 100% при первом запуске
    }

    // Привязываем обработчики событий
    fileInput.addEventListener('change', handleFileInput);
    kassaTextarea.addEventListener('input', handleKassaInput);
    clearTextBtn.addEventListener('click', clearKassaText);
    analyzeBtn.addEventListener('click', analyzeData);
    resetBtn.addEventListener('click', resetData);
    filterInput.addEventListener('input', applyFilterAndSort);
    guideBtn.addEventListener('click', openGuide);
    
    // Обработчики для модального окна настроек
    settingsBtn.addEventListener('click', openSettingsModal);
    closeModalBtn.addEventListener('click', closeSettingsModal);
    window.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            closeSettingsModal();
        }
    });

    // Обработчик для тем оформления
    themeOptions.forEach(option => {
        option.addEventListener('click', function() {
            const themeName = this.getAttribute('data-theme');
            setTheme(themeName);
        });
    });
    
    // Обработчик для изменения размера шрифта
    const fontSizeSlider = document.getElementById('fontSizeSlider');
    if (fontSizeSlider) {
        fontSizeSlider.addEventListener('input', function() {
            const fontSize = parseInt(this.value);
            setFontSize(fontSize);
        });
    }

    // Обработчик для изменения масштаба интерфейса
    const uiScaleSlider = document.getElementById('uiScaleSlider');
    if (uiScaleSlider) {
        uiScaleSlider.addEventListener('input', function() {
            const uiScale = parseInt(this.value);
            setUIScale(uiScale);
        });
    }

    // Настраиваем работу вкладок
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            
            // Снимаем активный класс со всех кнопок
            tabButtons.forEach(btn => {
                btn.classList.remove('active');
                btn.setAttribute('aria-selected', 'false');
            });
            
            // Добавляем активный класс на нажатую кнопку
            button.classList.add('active');
            button.setAttribute('aria-selected', 'true');
            
            // Скрываем все вкладки
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Показываем выбранную вкладку
            const activeTab = document.getElementById(tabName + 'Tab');
            activeTab.classList.add('active');
            
            // Сохраняем последнюю активную вкладку в localStorage
            localStorage.setItem('activeTab', tabName);
        });
    });
    
    // Добавляем поддержку drag-and-drop для загрузки файлов
    setupDragAndDrop();
    
    // Добавляем обработчик для кнопки Esc, чтобы закрыть модальное окно
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && settingsModal.style.display === 'flex') {
            closeSettingsModal();
        }
    });
    
    // Инициализация пасхалки
    setupEasterEgg();

    // Обработчик для кнопки выбора файлов
    const selectFilesBtn = document.querySelector('.select-files-btn');
    if (selectFilesBtn) {
        selectFilesBtn.addEventListener('click', function() {
            fileInput.click();
        });
    }

    // Настройка модальных окон
    setupModals();
    
    // Настройка руководства пользователя
    setupGuide();

    // Проверяем, нужно ли показать руководство при первом запуске
    checkFirstTimeVisit();

    // Загружаем сохраненные отметки
    loadCheckedItems();
    
    // Добавляем обработчик для кнопки сброса проверок
    const resetCheckedBtn = document.getElementById('resetCheckedBtn');
    if (resetCheckedBtn) {
        resetCheckedBtn.addEventListener('click', function() {
            resetAllChecks();
        });
    }

    // Обработчик для кнопки скрытия товаров без маркировки
    const toggleUnmarkedBtn = document.getElementById('toggleUnmarkedBtn');
    if (toggleUnmarkedBtn) {
        toggleUnmarkedBtn.addEventListener('click', function() {
            hideUnmarkedItems = !hideUnmarkedItems;
            this.classList.toggle('active');
            
            // Меняем текст кнопки в зависимости от состояния
            const btnText = this.querySelector('span');
            if (btnText) {
                btnText.textContent = hideUnmarkedItems ? 'Показать марки' : 'Без марки';
            }
            
            // Применяем фильтр
            applyFilterAndSort();
            
            // Показываем уведомление
            const message = hideUnmarkedItems 
                ? 'Товары без маркировки скрыты' 
                : 'Товары без маркировки отображаются';
            showNotification('Фильтр', message, 'info');
        });
    }

    // Обработчик переключения режима подсчёта количества
    const toggleCountModeBtn = document.getElementById('toggleCountModeBtn');
    if (toggleCountModeBtn) {
        toggleCountModeBtn.addEventListener('click', function() {
            countByMentions = !countByMentions;
            this.classList.toggle('counting-by-mentions');
            
            if (countByMentions) {
                this.title = 'Режим подсчёта по упоминания: считает количество товара по числу упоминаний в тексте';
                this.querySelector('span').textContent = 'Подсчёт по упоминания';
                showNotification('Режим подсчёта', 'Количество товаров считается по числу упоминаний в тексте КАССЫ', 'info');
            } else {
                this.title = 'Режим подсчёта по значению: использует количество, указанное в данных КАССЫ';
                this.querySelector('span').textContent = 'Подсчёт по значению';
                showNotification('Режим подсчёта', 'Количество товаров считается по значению из данных КАССЫ', 'info');
            }
            
            // Сохраняем режим подсчёта в localStorage
            localStorage.setItem('countByMentions', countByMentions);
            
            // Если данные уже загружены, выполняем повторный анализ
            const kassaText = kassaTextarea.value;
            if (orderData && kassaText && kassaText.trim() !== '') {
                kassaData = extractProductsFromKassa(kassaText);
                analyzeData();
            }
        });
        
        // Загружаем сохранённый режим при инициализации
        const savedCountMode = localStorage.getItem('countByMentions');
        if (savedCountMode !== null) {
            countByMentions = savedCountMode === 'true';
            if (countByMentions) {
                toggleCountModeBtn.classList.add('counting-by-mentions');
                toggleCountModeBtn.querySelector('span').textContent = 'Подсчёт по упоминания';
                toggleCountModeBtn.title = 'Режим подсчёта по упоминания: считает количество товара по числу упоминаний в тексте';
            } else {
                toggleCountModeBtn.classList.remove('counting-by-mentions');
                toggleCountModeBtn.querySelector('span').textContent = 'Подсчёт по значению';
                toggleCountModeBtn.title = 'Режим подсчёта по значению: использует количество, указанное в данных КАССЫ';
            }
        } else {
            // Устанавливаем режим по умолчанию - "По упоминания"
            toggleCountModeBtn.classList.add('counting-by-mentions');
            toggleCountModeBtn.querySelector('span').textContent = 'Подсчёт по упоминания';
            toggleCountModeBtn.title = 'Режим подсчёта по упоминания: считает количество товара по числу упоминаний в тексте';
        }
    }
});

// Настройка пасхалки
function setupEasterEgg() {
    const versionNumber = document.getElementById('versionNumber');
    const easterEgg = document.getElementById('easterEgg');
    const closeEasterEgg = document.getElementById('closeEasterEgg');
    const easterEggAudio = document.getElementById('easterEggAudio');
    const easterEggMessage = document.getElementById('easterEggMessage');
    const generateMessageBtn = document.getElementById('generateMessageBtn');
    
    if (!versionNumber || !easterEgg || !closeEasterEgg) return;
    
    let clickCount = 0;
    let clickTimer;
    
    // Список милых сообщений
    const sweetMessages = [
        "У меня жена самая лучшая",
        "Ты делаешь мой мир ярче",
        "Ты — моя любимая звездочка",
        "Твоя улыбка — мое счастье",
        "Наша любовь бесконечна",
        "Ты моя вторая половинка",
        "С тобой я чувствую себя счастливым",
        "Наша любовь — мое сокровище",
        "Ты делаешь каждый день особенным",
        "Жизнь с тобой — настоящее приключение"
    ];
    
    // Функция получения случайного сообщения
    function getRandomMessage() {
        const randomIndex = Math.floor(Math.random() * sweetMessages.length);
        return sweetMessages[randomIndex];
    }
    
    // Функция добавления анимации к сообщению
    function animateMessage() {
        easterEggMessage.style.animation = 'none';
        easterEggMessage.offsetHeight; // Триггер перерисовки
        easterEggMessage.style.animation = 'pulsate 2s infinite';
        
        // Добавляем эффект смены цвета
        const colors = ['#ff4081', '#9c27b0', '#e91e63', '#f44336', '#673ab7'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        easterEggMessage.style.color = randomColor;
    }
    
    versionNumber.addEventListener('click', () => {
        clickCount++;
        
        // Сбрасываем счетчик кликов через 2 секунды бездействия
        clearTimeout(clickTimer);
        clickTimer = setTimeout(() => {
            clickCount = 0;
        }, 2000);
        
        // После 5 кликов показываем пасхалку (сделали доступнее)
        if (clickCount >= 5) {
            // Показываем пасхалку
            easterEgg.classList.add('active');
            
            // Устанавливаем случайное сообщение
            easterEggMessage.textContent = getRandomMessage();
            animateMessage();
            
            // Запускаем музыку
            if (easterEggAudio) {
                easterEggAudio.volume = 0.5;
                easterEggAudio.play().catch(error => {
                    console.log('Ошибка воспроизведения аудио:', error);
                });
            }
            
            // Добавляем анимацию для цветочков
            const flowers = document.querySelectorAll('.flower');
            flowers.forEach((flower, index) => {
                flower.style.animationDuration = `${8 + Math.random() * 4}s`;
            });
            
            // Сбрасываем счетчик
            clickCount = 0;
        }
    });
    
    // Кнопка генерации сообщения
    if (generateMessageBtn) {
        generateMessageBtn.addEventListener('click', () => {
            easterEggMessage.textContent = getRandomMessage();
            animateMessage();
        });
    }
    
    // Закрытие пасхалки
    closeEasterEgg.addEventListener('click', () => {
        easterEgg.classList.remove('active');
        
        // Останавливаем музыку
        if (easterEggAudio) {
            easterEggAudio.pause();
            easterEggAudio.currentTime = 0;
        }
    });
    
    // Закрытие пасхалки по Esc
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && easterEgg.classList.contains('active')) {
            easterEgg.classList.remove('active');
            
            // Останавливаем музыку
            if (easterEggAudio) {
                easterEggAudio.pause();
                easterEggAudio.currentTime = 0;
            }
        }
    });
}

// Обработчики drag and drop
function setupDragAndDrop() {
    const dropZone = document.getElementById('fileDropZone');
    
    if (!dropZone) return;
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        dropZone.classList.add('drag-active');
    }
    
    function unhighlight() {
        dropZone.classList.remove('drag-active');
    }
    
    dropZone.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            fileInput.files = files;
            const event = new Event('change');
            fileInput.dispatchEvent(event);
        }
    }
}

// Функция установки темы
function setTheme(themeName) {
    // Удаляем все классы тем с body
    document.body.classList.remove('classic-theme', 'dark-theme');
    
    // Добавляем новый класс темы
    document.body.classList.add(themeName + '-theme');
    
    // Обновляем индикатор активной темы
    themeOptions.forEach(option => {
        option.classList.remove('active');
        option.setAttribute('aria-pressed', 'false');
        
        if (option.getAttribute('data-theme') === themeName) {
            option.classList.add('active');
            option.setAttribute('aria-pressed', 'true');
        }
    });
    
    // Сохраняем тему в localStorage
    localStorage.setItem('theme', themeName);
    currentTheme = themeName;
    
    console.log(`Установлена тема: ${themeName}`);
}

// Функция установки размера шрифта
function setFontSize(fontSize) {
    // Обновляем переменную размера шрифта
    document.documentElement.style.setProperty('--font-size-multiplier', `${fontSize / 100}`);
    
    // Обновляем значение на слайдере
    const fontSizeSlider = document.getElementById('fontSizeSlider');
    if (fontSizeSlider) {
        fontSizeSlider.value = fontSize;
    }
    
    // Обновляем отображение текущего размера шрифта
    const fontSizeValue = document.getElementById('fontSizeValue');
    if (fontSizeValue) {
        fontSizeValue.textContent = `${fontSize}%`;
    }
    
    // Сохраняем размер шрифта в localStorage
    localStorage.setItem('fontSize', fontSize);
    currentFontSize = fontSize;
    
    console.log(`Установлен размер шрифта: ${fontSize}%`);
}

// Функция установки масштаба интерфейса
function setUIScale(scale) {
    // Обновляем переменную масштаба интерфейса
    document.documentElement.style.setProperty('--ui-scale', `${scale / 100}`);
    
    // Добавляем или удаляем класс для масштабирования
    if (scale !== 100) {
        document.body.classList.add('scaled-ui');
    } else {
        document.body.classList.remove('scaled-ui');
    }
    
    // Обновляем значение на слайдере
    const uiScaleSlider = document.getElementById('uiScaleSlider');
    if (uiScaleSlider) {
        uiScaleSlider.value = scale;
    }
    
    // Обновляем отображение текущего масштаба
    const uiScaleValue = document.getElementById('uiScaleValue');
    if (uiScaleValue) {
        uiScaleValue.textContent = `${scale}%`;
    }
    
    // Сохраняем масштаб интерфейса в localStorage
    localStorage.setItem('uiScale', scale);
    currentUIScale = scale;
    
    console.log(`Установлен масштаб интерфейса: ${scale}%`);
}

// Функции для модального окна настроек
function openSettingsModal() {
    settingsModal.style.display = 'flex';
    document.body.classList.add('modal-open');
}

function closeSettingsModal() {
    settingsModal.style.display = 'none';
    document.body.classList.remove('modal-open');
}

// Обработчик выбора файлов
function handleFileInput(event) {
    const files = event.target.files;
    
    if (files.length === 0) {
        return;
    }
    
    // Берем первый выбранный файл (теперь обрабатываем только один файл)
    orderFile = files[0];
    
    // Обновляем отображение выбранных файлов
    updateSelectedFilesDisplay(files);
    
    // Проверяем, можно ли включить кнопку анализа
    checkAnalyzeButtonState();
}

// Обработчик ввода данных КАССЫ
function handleKassaInput(event) {
    // Проверяем, можно ли включить кнопку анализа
    checkAnalyzeButtonState();
}

// Функция для очистки текстового поля КАССЫ
function clearKassaText() {
    kassaTextarea.value = '';
    checkAnalyzeButtonState();
    showNotification('Очищено', 'Данные КАССЫ очищены', 'info');
}

// Проверка возможности включения кнопки анализа
function checkAnalyzeButtonState() {
    const hasOrderFile = orderFile !== null;
    const hasKassaData = kassaTextarea.value.trim() !== '';
    
    // Включаем кнопку, если есть и файл заказа, и данные КАССЫ
    analyzeBtn.disabled = !(hasOrderFile && hasKassaData);
}

// Обновление отображения выбранных файлов
function updateSelectedFilesDisplay(files) {
    const selectedFilesContainer = document.getElementById('selectedFiles');
    
    if (!selectedFilesContainer) return;
    
    selectedFilesContainer.innerHTML = '';
    
    if (files.length === 0) {
        return;
    }
    
    const fileItem = document.createElement('div');
    fileItem.className = 'selected-file';
    
    const fileIcon = document.createElement('i');
    fileIcon.className = 'fas fa-file-excel';
    
    const fileName = document.createElement('span');
    fileName.innerText = files[0].name;
    
    const fileSize = document.createElement('span');
    fileSize.className = 'file-size';
    fileSize.innerText = formatFileSize(files[0].size);
    
    fileItem.appendChild(fileIcon);
    fileItem.appendChild(fileName);
    fileItem.appendChild(fileSize);
    
    selectedFilesContainer.appendChild(fileItem);
}

// Функция обновления отображения выбранных файлов
function updateSelectedFilesDisplay(files) {
    const selectedFilesContainer = document.getElementById('selectedFiles');
    if (!selectedFilesContainer) return;
    
    // Очищаем контейнер
    selectedFilesContainer.innerHTML = '';
    
    if (files.length === 0) return;
    
    // Добавляем каждый выбранный файл
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileElement = document.createElement('div');
        fileElement.className = 'selected-file';
        
        // Определяем иконку в зависимости от типа файла
        let iconClass = 'fa-file';
        if (file.name.toLowerCase().endsWith('.xls')) {
            iconClass = 'fa-file-excel';
        } else if (file.name.toLowerCase().endsWith('.xlsx')) {
            iconClass = 'fa-file-excel';
        }
        
        // Определяем, какой это файл (заказ или сканирование)
        let fileType = '';
        if (file.name.toLowerCase().includes('мс') || file.name.toLowerCase().includes('ms') || file.name.toLowerCase().endsWith('.xls')) {
            fileType = 'Заказ';
        } else if (file.name.toLowerCase().includes('сбис') || file.name.toLowerCase().includes('sbis') || file.name.toLowerCase().endsWith('.xlsx')) {
            fileType = 'СБИС';
        }
        
        fileElement.innerHTML = `
            <i class="far ${iconClass}"></i>
            <span class="file-name" title="${file.name}">${fileType ? fileType + ': ' : ''}${file.name}</span>
        `;
        
        selectedFilesContainer.appendChild(fileElement);
    }
}

// Функция отображения уведомлений
function showNotification(title, message, type = 'info') {
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = `notification ${type}-notification`;
    
    // Иконка в зависимости от типа уведомления
    let icon = 'info-circle';
    if (type === 'error') icon = 'exclamation-circle';
    else if (type === 'success') icon = 'check-circle';
    else if (type === 'warning') icon = 'exclamation-triangle';
    
    notification.innerHTML = `
        <div class="notification-icon">
            <i class="fas fa-${icon}"></i>
        </div>
        <div class="notification-content">
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        </div>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Добавляем на страницу
    if (!document.querySelector('.notifications-container')) {
        const container = document.createElement('div');
        container.className = 'notifications-container';
        document.body.appendChild(container);
    }
    
    const container = document.querySelector('.notifications-container');
    container.appendChild(notification);
    
    // Обработчик для закрытия уведомления
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.classList.add('notification-hiding');
        setTimeout(() => {
            notification.remove();
            
            // Если это последнее уведомление, удаляем контейнер
            if (container.children.length === 0) {
                container.remove();
            }
        }, 300);
    });
    
    // Автоматически скрываем через 2 секунды (изменено с 5 секунд)
    setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.add('notification-hiding');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                    
                    // Если это последнее уведомление, удаляем контейнер
                    if (container.children.length === 0) {
                        container.remove();
                    }
                }
            }, 300);
        }
    }, 2000);
}

// Функция анализа данных
async function analyzeData() {
    // Проверяем наличие данных
    if (!orderFile || kassaTextarea.value.trim() === '') {
        showNotification('Ошибка', 'Необходимо выбрать файл заказа МС и ввести данные КАССЫ', 'error');
        return;
    }
    
    // Устанавливаем состояние загрузки
    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Анализ...';
    
    try {
        // Читаем файл заказа
        console.log('Чтение файла заказа...');
        orderData = await readExcelFile(orderFile);
        
        // Обрабатываем данные заказа
        console.log('Обработка данных заказа...');
        const orderProducts = extractProductsFromMS(orderData);
        
        // Обрабатываем данные КАССЫ
        console.log('Обработка данных КАССЫ...');
        const kassaProducts = extractProductsFromKassa(kassaTextarea.value);
        
        // Сравниваем продукты
        console.log('Сравнение продуктов...');
        comparisonResults = compareProducts(orderProducts, kassaProducts);
        
        // Отображаем результаты
        displayResults(comparisonResults);
        
        // Показываем статистику
        console.log('Отображение статистики...');
        displayStats(comparisonResults);
        
        // Добавляем сортировку для заголовков таблиц
        console.log('Добавление сортировки для таблиц...');
        addTableHeaderSorting();
        
        // Показываем секцию результатов
        document.getElementById('results').scrollIntoView({ behavior: 'smooth' });
        
        // Применяем фильтрацию и сортировку
        applyFilterAndSort();
        
        console.log('Анализ данных завершен успешно');
        
        // Показываем уведомление об успешном завершении
        showNotification('Готово', 'Анализ данных успешно завершен', 'success');
    } catch (error) {
        console.error('Ошибка при анализе данных:', error);
        showNotification('Ошибка', 'Произошла ошибка при анализе данных: ' + error.message, 'error');
    } finally {
        // Разблокируем кнопку анализа
        analyzeBtn.disabled = false;
        analyzeBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Сравнить данные';
    }
}

// Функция чтения Excel файла
async function readExcelFile(file) {
    return new Promise((resolve, reject) => {
        // Проверяем доступность библиотеки XLSX
        if (typeof XLSX === 'undefined') {
            console.error('Ошибка: Библиотека XLSX не загружена');
            showNotification('Ошибка', 'Библиотека XLSX для работы с Excel не загружена. Попробуйте обновить страницу.', 'error');
            reject(new Error('Библиотека XLSX не определена. Проверьте подключение к интернету и обновите страницу.'));
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                console.log(`Чтение файла ${file.name} (${file.size} байт, тип: ${file.type})`);
                
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                
                // Берем первый лист
                const firstSheetName = workbook.SheetNames[0];
                console.log(`Имя первого листа: ${firstSheetName}`);
                
                const worksheet = workbook.Sheets[firstSheetName];
                
                // Определяем максимальное количество строк и столбцов в файле
                    const range = XLSX.utils.decode_range(worksheet['!ref']);
                    console.log('Обнаружено строк:', range.e.r + 1, 'столбцов:', range.e.c + 1);
                    
                // Увеличиваем диапазон до максимально возможного значения для обоих типов файлов
                    const extendedRange = {
                        s: { r: 0, c: 0 },  // Начало с первой строки и столбца
                    e: { 
                        r: Math.max(range.e.r + 100, 10000), // Гарантированно берем все строки
                        c: Math.max(range.e.c, 2)  // Убеждаемся, что захватываем все 3 столбца
                    }
                };
                
                console.log('Расширенный диапазон для чтения:', 
                    `с строки 0 до ${extendedRange.e.r}, столбцы 0-${extendedRange.e.c}`);
                
                let jsonData;
                // Для обоих форматов файлов используем одинаковый подход чтения
                    jsonData = XLSX.utils.sheet_to_json(worksheet, { 
                    header: 1,      // Нумерованные столбцы (без заголовков)
                    defval: '',     // Значение по умолчанию для пустых ячеек
                    raw: true,      // Получаем сырые значения
                        range: extendedRange // Используем расширенный диапазон
                    });
                    
                // Фильтруем строки, которые полностью пусты (все ячейки пустые)
                    jsonData = jsonData.filter(row => 
                    row && Array.isArray(row) && row.some(cell => cell !== '')
                );
                
                console.log(`Прочитано строк из ${file.name}: ${jsonData.length}`);
                console.log('Пример первых 5 строк:', jsonData.slice(0, 5));
                
                resolve(jsonData);
            } catch (error) {
                console.error(`Ошибка при чтении файла ${file.name}:`, error);
                reject(error);
            }
        };
        
        reader.onerror = function(error) {
            console.error(`Ошибка доступа к файлу ${file.name}:`, error);
            reject(error);
        };
        
        reader.readAsArrayBuffer(file);
    });
}

// Функция извлечения товаров из файла МС
function extractProductsFromMS(data) {
    // Начинаем чтение со второй строки
    // Первая строка (индекс 0) - это заголовок таблицы
    if (data.length < 2) {
        throw new Error('Файл МС не содержит достаточно строк');
    }
    
    console.log('Первая строка (заголовок):', data[0]);
    
    // Определяем индексы колонок из первой строки (заголовка)
    const headerRow = data[0];
    let codeIndex = -1;
    let nameIndex = -1;
    let quantityIndex = -1;
    
    // Ищем индексы нужных колонок в заголовке
    for (let i = 0; i < headerRow.length; i++) {
        if (!headerRow[i]) continue;
        
        const cell = String(headerRow[i]).toLowerCase();
        if (cell.includes('код')) {
            codeIndex = i;
        } else if (cell.includes('наименование')) {
            nameIndex = i;
        } else if (cell.includes('кол-во') || cell.includes('кол-')) {
            quantityIndex = i;
        }
    }
    
    // Если какие-то колонки не найдены, используем стандартные индексы
    if (codeIndex === -1 || nameIndex === -1 || quantityIndex === -1) {
        console.warn('Не удалось определить все колонки в файле МС, используем стандартные позиции.');
        codeIndex = codeIndex === -1 ? 0 : codeIndex;
        nameIndex = nameIndex === -1 ? 1 : nameIndex;
        quantityIndex = quantityIndex === -1 ? 2 : quantityIndex;
    }
    
    console.log(`Определены индексы колонок: Код=${codeIndex}, Наименование=${nameIndex}, Количество=${quantityIndex}`);
    
    // Извлекаем товары, начиная со второй строки (индекс 1)
    const products = [];
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        
        // Пропускаем пустые строки
        if (!row || !Array.isArray(row)) {
            continue;
        }
        
        // Получаем код товара, если он есть
        const code = row[codeIndex] !== undefined ? String(row[codeIndex]).trim() : '';
        
        // Пропускаем строки без кода товара
        if (!code) {
            continue;
        }
        
        // Извлекаем имя и количество
        const name = row[nameIndex] !== undefined ? String(row[nameIndex]).trim() : '';
        let quantity = 0;
        
        // Преобразуем количество
        if (row[quantityIndex] !== undefined) {
            if (typeof row[quantityIndex] === 'number') {
                quantity = row[quantityIndex];
            } else {
                const parsedQuantity = parseInt(String(row[quantityIndex]).trim(), 10);
                quantity = isNaN(parsedQuantity) ? 0 : parsedQuantity;
            }
        }
        
        // Добавляем товар в список
                products.push({
                    code,
                    name,
                    quantity
                });
        
        // Для отладки выводим первые несколько товаров
        if (products.length <= 5) {
            console.log(`Обработан товар МС #${products.length} (строка ${i}):`, {code, name, quantity});
        }
    }
    
    console.log(`Всего обработано товаров из МС: ${products.length} из ${data.length - 1} строк данных`);
    return products;
}

// Новая функция для извлечения товаров из текста КАССЫ
function extractProductsFromKassa(kassaText) {
    console.log('Извлечение товаров из данных КАССЫ...');
    console.log(`Режим подсчёта: ${countByMentions ? 'по упоминания' : 'по значению'}`);
    
    // Строки текста
    const lines = kassaText.split('\n');
    console.log(`Получено ${lines.length} строк текста КАССЫ`);
    
    // Используем Map для хранения товаров по имени
    const productsMap = new Map();
    let currentProduct = null;
    let emptyCodeCounter = 1;
    
    // Регулярное выражение для поиска числа с "x" и числа (например, "139.00x1")
    const quantityRegex = /(\d+(?:\.\d+)?)x(\d+)/;
    
    // Создаем новую Map для подсчета упоминаний
    const mentionsCountMap = new Map();
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Пропускаем пустые строки и служебные строки в начале (ХР, Продажа, и т.д.)
        if (!line || line === 'ХР' || line === 'Продажа' || line === 'Новый прайс для хореки' || 
            line === 'Найти' || line === 'Клиент' || line === 'Скидка' || line === 'Наличные' || 
            line.endsWith('К оплате')) {
            continue;
        }
        
        // Проверяем, если строка содержит название товара (начинается с цифры, которая является порядковым номером)
        if (/^\d+/.test(line) && line.includes(',')) {
            // Это название нового товара
            const nameMatch = line.match(/^\d+(.*)/);
            if (nameMatch) {
                const name = nameMatch[1].trim();
                
                // Подсчитываем упоминания для режима countByMentions
                if (countByMentions) {
                    const currentCount = mentionsCountMap.get(name) || 0;
                    mentionsCountMap.set(name, currentCount + 1);
                }
                
                // Проверяем, есть ли уже такой товар в Map
                if (productsMap.has(name)) {
                    // Если товар уже есть, используем его
                    currentProduct = productsMap.get(name);
                } else {
                    // Если товара еще нет, создаем новый
                    currentProduct = {
                        code: 'PRODUCT_' + emptyCodeCounter++,
                        name: name,
                        quantity: 0
                    };
                    productsMap.set(name, currentProduct);
                }
            }
        } 
        // Проверяем, является ли строка информацией о количестве (только для режима подсчёта по значению)
        else if (!countByMentions && currentProduct && quantityRegex.test(line)) {
            const matches = line.match(quantityRegex);
            if (matches && matches.length >= 3) {
                const price = parseFloat(matches[1]);
                const quantity = parseInt(matches[2], 10);
                
                // Добавляем количество к текущему товару
                // Но учитываем только одну запись о количестве для каждого блока товара
                // (так как в формате КАССЫ каждый блок содержит две одинаковые записи о цене и количестве)
                
                // Увеличиваем количество только если следующая строка содержит "шт"
                if (i + 1 < lines.length && lines[i + 1].trim() === 'шт') {
                    currentProduct.quantity += quantity;
                    
                    // Пропускаем следующие две строки (шт и сумма)
                    i += 2;
                    
                    // Пропускаем дублирующуюся информацию о цене и количестве
                    if (i + 2 < lines.length && 
                        quantityRegex.test(lines[i + 1].trim()) && 
                        lines[i + 2].trim() === 'шт') {
                        i += 3; // Пропускаем второй блок (цена x количество, шт, сумма)
                    }
                }
            }
        }
    }
    
    // Если используется режим подсчёта по упоминания, обновляем количество товаров
    if (countByMentions) {
        for (const [name, product] of productsMap.entries()) {
            const mentions = mentionsCountMap.get(name) || 0;
            product.quantity = mentions;
        }
    }
    
    // Преобразуем Map в массив товаров
    const products = Array.from(productsMap.values());
    
    console.log(`Всего обработано товаров из КАССЫ: ${products.length}`);
    
    // Выводим первые несколько товаров для проверки
    if (products.length > 0) {
        console.log('Примеры товаров из КАССЫ:');
        products.slice(0, 5).forEach((product, index) => {
            console.log(`Товар ${index + 1}:`, product);
        });
    }
    
    return products;
}

// Функция для сравнения продуктов из заказа и скана - модифицируем для сравнения по имени
function compareProducts(orderProducts, kassaProducts) {
    console.log('Сравниваем продукты...');
    const results = {
        missing: [],    // Товары, которые есть в МС, но отсутствуют в КАССЕ
        extra: [],      // Товары, которые есть в КАССЕ, но отсутствуют в МС
        mismatch: [],   // Товары с несовпадающим количеством
        matched: [],    // Товары, которые совпадают
        all: [],        // Все товары для отображения
        scan: [],       // Все товары из КАССЫ для отдельной вкладки
        errors: [],     // Все проблемные товары
        incomplete: []  // Товары без штрих-кода или без количества
    };

    // Создаем карты для быстрого поиска товаров по имени
    const orderMap = new Map();
    orderProducts.forEach(item => {
        // Используем имя товара как ключ
        orderMap.set(item.name.toLowerCase(), item);
    });

    const kassaMap = new Map();
    kassaProducts.forEach(item => {
        // Используем имя товара как ключ
        kassaMap.set(item.name.toLowerCase(), item);
    });

    // Находим товары, которые есть только в заказе или только в кассе
    const orderOnly = orderProducts.filter(item => !kassaMap.has(item.name.toLowerCase()));
    const kassaOnly = kassaProducts.filter(item => !orderMap.has(item.name.toLowerCase()));
    const commonNames = orderProducts
        .filter(item => kassaMap.has(item.name.toLowerCase()))
        .map(item => item.name.toLowerCase());

    console.log(`Товаров только в заказе: ${orderOnly.length}`);
    console.log(`Товаров только в кассе: ${kassaOnly.length}`);
    console.log(`Общих товаров: ${commonNames.length}`);

    // Обрабатываем товары из заказа, которых нет в кассе
    orderOnly.forEach(orderItem => {
        let item = {
            code: orderItem.code,
            name: orderItem.name,
            orderQuantity: orderItem.quantity,
            scanQuantity: 0,
            status: 'missing'
        };
        
        results.missing.push(item);
        results.errors.push(item); // Добавляем в общий список ошибок
        results.all.push(item);
    });

    // Проверяем наличие некорректных товаров в КАССЕ (без штрих-кода или количества)
    kassaProducts.forEach(kassaItem => {
        // Проверяем является ли товар некорректным (нулевое количество)
        const isZeroQuantity = kassaItem.quantity === 0 || kassaItem.quantity === null || kassaItem.quantity === undefined;
        
        if (isZeroQuantity) {
            const issue = 'Отсутствует количество';
            
            let item = {
                code: kassaItem.code,
                displayCode: kassaItem.code, // Для отображения
                name: kassaItem.name,
                orderQuantity: 0,
                scanQuantity: kassaItem.quantity,
                status: 'incomplete',
                issue: issue
            };
            
            results.incomplete.push(item);
            results.errors.push(item); // Также добавляем в общий список ошибок
            results.all.push(item);
            
            // Добавляем все некорректные товары из КАССЫ в отдельную категорию
            results.scan.push({
                code: kassaItem.code,
                displayCode: kassaItem.code,
                name: kassaItem.name,
                scanQuantity: kassaItem.quantity,
                status: 'incomplete',
                issue: issue
            });
        }
    });

    // Обрабатываем товары из кассы, которых нет в заказе
    kassaOnly.forEach(kassaItem => {
        // Пропускаем уже обработанные некорректные товары
        const isZeroQuantity = kassaItem.quantity === 0 || kassaItem.quantity === null || kassaItem.quantity === undefined;
        
        if (isZeroQuantity) {
            return; // Уже обработан в предыдущем блоке
        }
        
        let item = {
            code: kassaItem.code,
            name: kassaItem.name,
            orderQuantity: 0,
            scanQuantity: kassaItem.quantity,
            status: 'extra'
        };
        
        results.extra.push(item);
        results.errors.push(item); // Добавляем в общий список ошибок
        results.all.push(item);

        // Добавляем все товары из КАССЫ в отдельную категорию
        results.scan.push({
            code: kassaItem.code,
            name: kassaItem.name,
            scanQuantity: kassaItem.quantity,
            status: 'extra'
        });
    });

    // Обрабатываем товары, которые есть и в заказе, и в кассе
    commonNames.forEach(name => {
        const orderItem = orderMap.get(name);
        const kassaItem = kassaMap.get(name);
        
        let status = 'ok';
        if (orderItem.quantity !== kassaItem.quantity) {
            status = 'mismatch';
        }
        
        let item = {
            code: orderItem.code,
            name: orderItem.name,
            orderQuantity: orderItem.quantity,
            scanQuantity: kassaItem.quantity,
            status: status
        };
        
        if (status === 'mismatch') {
            item.difference = kassaItem.quantity - orderItem.quantity;
            results.mismatch.push(item);
            results.errors.push(item); // Добавляем в общий список ошибок
        } else {
            results.matched.push(item);
        }
        
        results.all.push(item);

        // Добавляем товар в список КАССЫ с соответствующим статусом
        results.scan.push({
            code: kassaItem.code,
            name: kassaItem.name,
            orderQuantity: orderItem.quantity,
            scanQuantity: kassaItem.quantity,
            status: status
        });
    });

    // Сортируем все массивы результатов по наименованию товара для удобства
    const sortByName = (a, b) => a.name.localeCompare(b.name);
    results.missing.sort(sortByName);
    results.extra.sort(sortByName);
    results.mismatch.sort(sortByName);
    results.matched.sort(sortByName);
    results.all.sort(sortByName);
    results.scan.sort(sortByName);
    results.errors.sort(sortByName);
    results.incomplete.sort(sortByName);

    console.log(`Результаты сравнения:
        Всего товаров: ${results.all.length}
        Отсутствуют в КАССЕ: ${results.missing.length}
        Лишние в КАССЕ: ${results.extra.length}
        Несоответствие количества: ${results.mismatch.length}
        Некорректные позиции: ${results.incomplete.length}
        Совпадающие товары: ${results.matched.length}
        Всего ошибок: ${results.errors.length}`);

    return results;
}

// Отображение результатов сравнения
function displayResults(results) {
    // Добавляем класс к таблице ошибок для управления видимостью немаркированных товаров
    const errorsTab = document.getElementById('errorsTab');
    if (errorsTab) {
        errorsTab.classList.toggle('hide-unmarked', hideUnmarkedItems);
    }
    
    // Заполняем таблицу всех товаров
    fillTable('allTable', results.all, ['code', 'name', 'orderQuantity', 'scanQuantity', 'status']);
    
    // Заполняем таблицу товаров из СБИС
    fillTable('scanTable', results.scan, ['code', 'name', 'scanQuantity', 'status']);
    
    // Заполняем таблицу ошибок (общую)
    const errors = results.errors || [];
    fillTable('errorsTable', errors, ['code', 'name', 'orderQuantity', 'scanQuantity', 'status']);
    
    // Заполняем таблицу отсутствующих товаров
    fillTable('missingTable', results.missing, ['code', 'name', 'orderQuantity'], 'missing-row');
    
    // Заполняем таблицу лишних товаров
    fillTable('extraTable', results.extra, ['code', 'name', 'scanQuantity'], 'extra-row');
    
    // Заполняем таблицу с расхождениями
    const mismatchColumns = ['code', 'name', 'orderQuantity', 'scanQuantity', 'difference'];
    fillTable('mismatchTable', results.mismatch, mismatchColumns, 'mismatch-row');
    
    // Заполняем таблицу некорректных позиций
    fillTable('incompleteTable', results.incomplete, ['code', 'name', 'scanQuantity', 'issue'], 'incomplete-row');
    
    // Отображаем статистику
    displayStats(results);
    
    // Показываем блок результатов
    document.querySelector('.results-section').style.display = 'block';
    
    // Обновляем счетчики в заголовках вкладок
    updateTabCounters(results);
    
    // Добавляем сортировку для заголовков таблиц
    addTableHeaderSorting();

    // Восстанавливаем последнюю активную вкладку
    const savedTab = localStorage.getItem('activeTab');
    if (savedTab) {
        const tabButton = document.querySelector(`.tab-btn[data-tab="${savedTab}"]`);
        if (tabButton) {
            tabButton.click();
        }
    }
}

// Обновленная функция заполнения таблицы
function fillTable(tableId, items, columns, rowClass = '') {
    const tbody = document.getElementById(tableId);
    tbody.innerHTML = '';
    
    if (items.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = columns.length + 1; // +1 для колонки с чекбоксом
        cell.textContent = 'Нет данных';
        cell.style.textAlign = 'center';
        cell.style.padding = '20px';
        row.appendChild(cell);
        tbody.appendChild(row);
        return;
    }
    
    // Создаем заголовок таблицы, если его нет
    const table = tbody.closest('table');
    const thead = table.querySelector('thead');
    
    if (!thead.querySelector('.sortable')) {
        const headerRow = thead.querySelector('tr');
        const headers = headerRow.querySelectorAll('th');
        
        // Делаем первую колонку с чекбоксами также сортируемой
        if (headers[0]) {
            headers[0].classList.add('sortable', 'check-column');
            headers[0].setAttribute('data-field', 'checked');
            headers[0].innerHTML = `${headers[0].textContent} <i class="fas fa-sort"></i>`;
        }
        
        // Добавляем классы для сортировки для остальных колонок
        headers.forEach((header, index) => {
            if (index > 0 && index <= columns.length) {
                header.classList.add('sortable');
                header.setAttribute('data-field', columns[index - 1]);
                header.innerHTML = `${header.textContent} <i class="fas fa-sort"></i>`;
            }
        });
    }
    
    items.forEach(item => {
        const row = document.createElement('tr');
        
        // Проверяем, отмечен ли товар
        const isChecked = checkedItems.has(item.code);
        if (isChecked) {
            row.classList.add('checked-row');
        }
        
        if (rowClass) {
            row.classList.add(rowClass);
        } else if (item.status) {
            row.classList.add(item.status + '-row');
        }
        
        // Проверяем, не является ли товар немаркированным
        const isUnmarked = isProductUnmarked(item);
        if (isUnmarked) {
            row.classList.add('unmarked-item');
        }
        
        // Добавляем ячейку с чекбоксом
        const checkboxCell = document.createElement('td');
        
        const checkbox = document.createElement('div');
        checkbox.className = `item-checkbox${isChecked ? ' checked' : ''}`;
        checkbox.setAttribute('data-code', item.code);
        checkbox.setAttribute('title', isChecked ? 'Отменить проверку' : 'Отметить как проверенное');
        
        checkboxCell.appendChild(checkbox);
        
        row.appendChild(checkboxCell);
        
        // Добавляем остальные ячейки
        columns.forEach(column => {
            const cell = document.createElement('td');
            
            if (column === 'status') {
                const statusSpan = document.createElement('span');
                statusSpan.className = 'status-indicator status-' + item.status;
                
                // Добавляем иконку в зависимости от статуса
                let icon = '';
                if (item.status === 'ok') icon = 'fa-check-circle';
                else if (item.status === 'missing') icon = 'fa-times-circle';
                else if (item.status === 'extra') icon = 'fa-plus-circle';
                else if (item.status === 'mismatch') icon = 'fa-exclamation-circle';
                else if (item.status === 'incomplete') icon = 'fa-exclamation-circle';
                
                if (icon) {
                    statusSpan.innerHTML = `<i class="fas ${icon}"></i>${getStatusText(item.status)}`;
                } else {
                    statusSpan.textContent = getStatusText(item.status);
                }
                
                cell.appendChild(statusSpan);
            } else if (column === 'code') {
                // Используем displayCode, если он есть, иначе используем code
                const displayValue = item.displayCode !== undefined ? item.displayCode : item[column];
                cell.textContent = displayValue || '';
            } else if (column === 'name') {
                // Добавляем значок немаркированного товара в начало названия
                const nameContainer = document.createElement('div');
                nameContainer.style.display = 'flex';
                nameContainer.style.alignItems = 'center';
                
                if (isUnmarked) {
                    const markingSpan = document.createElement('span');
                    markingSpan.className = 'marking-indicator';
                    markingSpan.title = 'Товар без маркировки';
                    markingSpan.innerHTML = '<i class="fas fa-tag" style="color: #ff9800; margin-right: 5px;"></i>';
                    nameContainer.appendChild(markingSpan);
                }
                
                const nameText = document.createElement('span');
                nameText.textContent = item[column] || '';
                nameContainer.appendChild(nameText);
                
                cell.appendChild(nameContainer);
            } else if (column === 'difference') {
                const diff = item.difference || 0;
                cell.textContent = diff > 0 ? '+' + diff : diff;
                cell.classList.add('quantity-diff');
                cell.classList.add(diff > 0 ? 'positive' : 'negative');
            } else if (column === 'issue') {
                // Добавляем информацию о проблеме с товаром
                const issueSpan = document.createElement('span');
                issueSpan.className = 'status-indicator status-incomplete';
                issueSpan.innerHTML = `<i class="fas fa-exclamation-circle"></i>${item.issue || 'Неизвестная проблема'}`;
                cell.appendChild(issueSpan);
            } else {
                cell.textContent = item[column] || '';
            }
            
            row.appendChild(cell);
        });
        
        tbody.appendChild(row);
        
        // Добавляем обработчик событий для чекбокса
        const checkboxElement = row.querySelector('.item-checkbox');
        if (checkboxElement) {
            checkboxElement.addEventListener('click', toggleItemChecked);
        }
    });
}

// Функция для обработки клика по чекбоксу
function toggleItemChecked(event) {
    const checkbox = event.currentTarget;
    const code = checkbox.getAttribute('data-code');
    const row = checkbox.closest('tr');
    
    // Переключаем состояние
    if (checkedItems.has(code)) {
        checkbox.classList.remove('checked');
        row.classList.remove('checked-row');
        checkedItems.delete(code);
    } else {
        checkbox.classList.add('checked');
        row.classList.add('checked-row');
        checkedItems.set(code, true);
    }
    
    // Обновляем все представления одной и той же позиции в разных таблицах
    updateCheckedStatusAcrossTables(code);
    
    // Сохраняем состояние проверки в localStorage
    saveCheckedItems();
}

// Обновляем статус проверки позиции во всех таблицах
function updateCheckedStatusAcrossTables(code) {
    const allCheckboxes = document.querySelectorAll(`.item-checkbox[data-code="${code}"]`);
    const isChecked = checkedItems.has(code);
    
    allCheckboxes.forEach(checkbox => {
        const row = checkbox.closest('tr');
        
        if (isChecked) {
            checkbox.classList.add('checked');
            row.classList.add('checked-row');
                    } else {
            checkbox.classList.remove('checked');
            row.classList.remove('checked-row');
        }
    });
}

// Функция для сброса всех проверок
function resetAllChecks() {
    // Очищаем Map с отмеченными позициями
    checkedItems.clear();
    
    // Сбрасываем все чекбоксы и строки
    const allCheckboxes = document.querySelectorAll('.item-checkbox');
    allCheckboxes.forEach(checkbox => {
        checkbox.classList.remove('checked');
        const row = checkbox.closest('tr');
        if (row) {
            row.classList.remove('checked-row');
        }
    });
    
    // Сохраняем состояние проверки в localStorage
    saveCheckedItems();
    
    // Показываем уведомление
    showNotification('Сброс проверок', 'Все отметки о проверке сброшены', 'info');
}

// Сохранение отмеченных позиций в localStorage
function saveCheckedItems() {
    try {
        const checkedArray = Array.from(checkedItems.keys());
        localStorage.setItem('checkedItems', JSON.stringify(checkedArray));
    } catch (error) {
        console.error('Ошибка при сохранении проверенных позиций:', error);
    }
}

// Загрузка отмеченных позиций из localStorage
function loadCheckedItems() {
    try {
        const savedItems = localStorage.getItem('checkedItems');
        if (savedItems) {
            const checkedArray = JSON.parse(savedItems);
            checkedItems = new Map();
            checkedArray.forEach(code => {
                checkedItems.set(code, true);
            });
        }
    } catch (error) {
        console.error('Ошибка при загрузке проверенных позиций:', error);
        checkedItems = new Map();
    }
}

// Функция фильтрации и сортировки результатов
function applyFilterAndSort() {
    if (!comparisonResults) return;
    
    const filterText = filterInput.value.toLowerCase();
    
    // Фильтрация
    const filterResults = (items) => {
        if (!items) return [];
        
        // Сначала фильтруем по тексту поиска
        let filtered = items;
        if (filterText) {
            filtered = items.filter(item => 
            item.code.toLowerCase().includes(filterText) || 
            item.name.toLowerCase().includes(filterText)
        );
        }
        
        // Затем применяем фильтр по маркировке, если он активен
        if (hideUnmarkedItems) {
            filtered = filtered.filter(item => !isProductUnmarked(item));
        }
        
        return filtered;
    };
    
    // Сортировка
    const sortResults = (items, tabName) => {
        if (!items || items.length === 0) return [];
        
        // Копируем массив для сортировки
        let sortedItems = [...items];
        
        // Если это вкладка ошибок, то немаркированные товары всегда в конце
        if (tabName === 'errors') {
            // Разделяем товары на маркированные и немаркированные
            const unmarked = sortedItems.filter(item => isProductUnmarked(item));
            const marked = sortedItems.filter(item => !isProductUnmarked(item));
            
            // Сортируем маркированные товары по выбранному полю
        const { field, direction } = currentSort;
        const multiplier = direction === 'asc' ? 1 : -1;
        
            marked.sort((a, b) => {
                return compareItems(a, b, field, multiplier);
            });
            
            // Сортируем немаркированные товары по выбранному полю (кроме первичной сортировки)
            unmarked.sort((a, b) => {
                return compareItems(a, b, field, multiplier);
            });
            
            // Соединяем массивы: сначала маркированные, затем немаркированные
            return [...marked, ...unmarked];
        } else {
            // Для остальных вкладок используем обычную сортировку
            const { field, direction } = currentSort;
            const multiplier = direction === 'asc' ? 1 : -1;
            
            return sortedItems.sort((a, b) => {
                return compareItems(a, b, field, multiplier);
            });
        }
    };
    
    // Функция сравнения двух элементов для сортировки
    const compareItems = (a, b, field, multiplier) => {
            let valueA, valueB;
            
        if (field === 'checked') {
            // Сортировка по статусу проверки (чекбоксы)
            valueA = checkedItems.has(a.code) ? 1 : 0;
            valueB = checkedItems.has(b.code) ? 1 : 0;
            return (valueA - valueB) * multiplier;
        } else if (field === 'code') {
                valueA = a.code;
                valueB = b.code;
            } else if (field === 'name') {
                valueA = a.name;
                valueB = b.name;
            } else if (field === 'orderQuantity') {
            valueA = a.orderQuantity || 0;
            valueB = b.orderQuantity || 0;
                return (valueA - valueB) * multiplier;
            } else if (field === 'scanQuantity') {
            valueA = a.scanQuantity || 0;
            valueB = b.scanQuantity || 0;
                return (valueA - valueB) * multiplier;
            } else if (field === 'difference') {
                valueA = a.difference || 0;
                valueB = b.difference || 0;
                return (valueA - valueB) * multiplier;
            } else if (field === 'status') {
                valueA = getStatusText(a.status);
                valueB = getStatusText(b.status);
        } else if (field === 'issue') {
            valueA = a.issue || '';
            valueB = b.issue || '';
            } else {
                return 0;
            }
            
            if (typeof valueA === 'number' && typeof valueB === 'number') {
                return (valueA - valueB) * multiplier;
            }
            
            return String(valueA).localeCompare(String(valueB)) * multiplier;
    };
    
    // Применяем фильтрацию и сортировку к каждой категории
    const filteredAll = filterResults(comparisonResults.all);
    const sortedAll = sortResults(filteredAll, 'all');
    fillTable('allTable', sortedAll, ['code', 'name', 'orderQuantity', 'scanQuantity', 'status']);
    
    const filteredScan = filterResults(comparisonResults.scan);
    const sortedScan = sortResults(filteredScan, 'scan');
    fillTable('scanTable', sortedScan, ['code', 'name', 'scanQuantity', 'status']);
    
    // Проверяем наличие свойства errors
    const errors = comparisonResults.errors || [];
    const filteredErrors = filterResults(errors);
    const sortedErrors = sortResults(filteredErrors, 'errors');
    fillTable('errorsTable', sortedErrors, ['code', 'name', 'orderQuantity', 'scanQuantity', 'status']);
    
    const filteredMissing = filterResults(comparisonResults.missing);
    const sortedMissing = sortResults(filteredMissing, 'missing');
    fillTable('missingTable', sortedMissing, ['code', 'name', 'orderQuantity'], 'missing-row');
    
    const filteredExtra = filterResults(comparisonResults.extra);
    const sortedExtra = sortResults(filteredExtra, 'extra');
    fillTable('extraTable', sortedExtra, ['code', 'name', 'scanQuantity'], 'extra-row');
    
    const filteredMismatch = filterResults(comparisonResults.mismatch);
    const sortedMismatch = sortResults(filteredMismatch, 'mismatch');
    fillTable('mismatchTable', sortedMismatch, ['code', 'name', 'orderQuantity', 'scanQuantity', 'difference'], 'mismatch-row');
    
    // Добавляем фильтрацию и сортировку для некорректных товаров
    const filteredIncomplete = filterResults(comparisonResults.incomplete);
    const sortedIncomplete = sortResults(filteredIncomplete, 'incomplete');
    fillTable('incompleteTable', sortedIncomplete, ['code', 'name', 'issue'], 'incomplete-row');
    
    // Восстанавливаем иконки сортировки
    document.querySelectorAll('.sortable').forEach(header => {
        const field = header.getAttribute('data-field');
        const icon = header.querySelector('i');
        
        if (field === currentSort.field) {
            icon.className = currentSort.direction === 'asc' ? 
                'fas fa-sort-up' : 'fas fa-sort-down';
        } else {
            icon.className = 'fas fa-sort';
        }
    });
}

// Отображение сводной статистики
function displayStats(results) {
    // Количество товаров в заказе МС
    document.getElementById('orderItems').textContent = results.all.filter(item => item.orderQuantity > 0).length;
    
    // Количество уникальных товаров в КАССЕ
    document.getElementById('scanItems').textContent = results.scan.length;
    
    // Количество отсутствующих товаров
    document.getElementById('missingItems').textContent = results.missing.length;
    
    // Количество избыточных товаров
    document.getElementById('extraItems').textContent = results.extra.length;
    
    // Количество несоответствий по количеству
    document.getElementById('quantityMismatches').textContent = results.mismatch.length;
    
    // Количество некорректных позиций
    document.getElementById('incompleteItems').textContent = results.incomplete.length;
    
    // Показываем блок статистики
    statsContainer.style.display = 'block';
    
    // Обновляем счетчики на вкладках
    updateTabCounters(results);
    
    // Анимируем числа в статистике
    animateCounters();
}

// Анимация счетчиков в статистике
function animateCounters() {
    const counters = document.querySelectorAll('.stat-value');
    
    counters.forEach(counter => {
        const finalValue = parseInt(counter.textContent);
        const duration = 1000; // Длительность анимации в мс
        const stepTime = 10; // Интервал между шагами анимации
        
        let currentValue = 0;
        const steps = duration / stepTime;
        const increment = finalValue / steps;
        
        const timer = setInterval(() => {
            currentValue += increment;
            
            if (currentValue >= finalValue) {
                counter.textContent = finalValue;
                clearInterval(timer);
            } else {
                counter.textContent = Math.floor(currentValue);
            }
        }, stepTime);
    });
}

// Получение текстового представления статуса
function getStatusText(status) {
    switch (status) {
        case 'ok': return 'Соответствует';
        case 'missing': return 'Отсутствует';
        case 'extra': return 'Избыточный';
        case 'mismatch': return 'Не соответствует';
        case 'incomplete': return 'Некорректный';
        default: return status;
    }
}

// Добавляем счетчики в заголовки вкладок
function updateTabCounters(results) {
    // Получаем все вкладки
    const allTab = document.querySelector('.tab-btn[data-tab="all"]');
    const scanTab = document.querySelector('.tab-btn[data-tab="scan"]');
    const errorsTab = document.querySelector('.tab-btn[data-tab="errors"]');
    const missingTab = document.querySelector('.tab-btn[data-tab="missing"]');
    const extraTab = document.querySelector('.tab-btn[data-tab="extra"]');
    const mismatchTab = document.querySelector('.tab-btn[data-tab="mismatch"]');
    const incompleteTab = document.querySelector('.tab-btn[data-tab="incomplete"]');
    
    // Проверяем наличие свойства errors перед использованием
    const errorsCount = results.errors ? results.errors.length : 0;
    const incompleteCount = results.incomplete ? results.incomplete.length : 0;
    
    // Обновляем текст вкладок с учетом количества элементов
    allTab.innerHTML = `<i class="fas fa-list"></i> Все товары <span class="tab-counter">${results.all.length}</span>`;
    scanTab.innerHTML = `<i class="fas fa-barcode"></i> Товары в КАССЕ <span class="tab-counter">${results.scan.length}</span>`;
    errorsTab.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Ошибки <span class="tab-counter">${errorsCount}</span>`;
    missingTab.innerHTML = `<i class="fas fa-times-circle"></i> Отсутствующие <span class="tab-counter">${results.missing.length}</span>`;
    extraTab.innerHTML = `<i class="fas fa-plus-circle"></i> Избыточные <span class="tab-counter">${results.extra.length}</span>`;
    mismatchTab.innerHTML = `<i class="fas fa-exchange-alt"></i> Несоответствия <span class="tab-counter">${results.mismatch.length}</span>`;
    incompleteTab.innerHTML = `<i class="fas fa-exclamation-circle"></i> Некорректные <span class="tab-counter">${incompleteCount}</span>`;
}

// Функция для проверки, содержит ли строка маркировку
function hasMarking(name) {
    // Проверяем наличие (М) в различных вариантах регистра и с пробелами
    const markingRegex = /\(\s*[мМmM]\s*\)/i;
    
    if (markingRegex.test(name)) {
        return true;
    }
    
    // Также проверяем окончания: "м" на конце строки
    const nameLower = name.toLowerCase();
    if (nameLower.endsWith(" м") || 
        nameLower.endsWith(" м.") || 
        nameLower.endsWith(" m") || 
        nameLower.endsWith(" m.")) {
        return true;
    }
    
    return false;
}

// Функция для проверки, является ли товар немаркированным
function isProductUnmarked(product) {
    return !hasMarking(product.name);
}

// Функция сброса загруженных файлов
function resetData() {
    // Очищаем данные
    orderData = null;
    kassaData = null;
    comparisonResults = null;
    orderFile = null;
    
    // Очищаем файловые инпуты и текстовое поле КАССЫ
    fileInput.value = '';
    kassaTextarea.value = '';
    
    // Очищаем контейнер выбранных файлов
    const selectedFilesContainer = document.getElementById('selectedFiles');
    if (selectedFilesContainer) {
        selectedFilesContainer.innerHTML = '';
    }
    
    // Отключаем кнопку анализа
    analyzeBtn.disabled = true;
    
    // Скрываем статистику
    statsContainer.style.display = 'none';
    
    // Очищаем все таблицы
    const tables = ['allTable', 'scanTable', 'errorsTable', 'missingTable', 'extraTable', 'mismatchTable', 'incompleteTable'];
    tables.forEach(tableId => {
        const tableBody = document.getElementById(tableId);
        if (tableBody) {
            tableBody.innerHTML = '';
        }
    });
    
    // Сбрасываем фильтр
    filterInput.value = '';
    
    // Очищаем проверки
    resetAllChecks();
    
    // Показываем уведомление
    showNotification('Сброс', 'Все данные сброшены', 'info');
}

// Функция получения текстового заголовка вкладки
function getTabTitle(tabName) {
    switch(tabName) {
        case 'all': return 'Все товары';
        case 'scan': return 'Товары в КАССЕ';
        case 'errors': return 'Ошибки';
        case 'missing': return 'Отсутствующие';
        case 'extra': return 'Избыточные';
        case 'mismatch': return 'Несоответствия';
        case 'incomplete': return 'Некорректные';
        default: return tabName;
    }
}

// Функция настройки модальных окон
function setupModals() {
    // Настройка модального окна настроек
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettingsModal = settingsModal.querySelector('.close-modal');
    
    settingsBtn.addEventListener('click', () => {
        settingsModal.style.display = 'flex';
        requestAnimationFrame(() => {
            settingsModal.classList.add('open');
            document.body.classList.add('modal-open');
        });
    });
    
    closeSettingsModal.addEventListener('click', () => {
        settingsModal.classList.remove('open');
        document.body.classList.remove('modal-open');
        setTimeout(() => {
            settingsModal.style.display = 'none';
        }, 150); // Уменьшаем время до 150мс
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.classList.remove('open');
            document.body.classList.remove('modal-open');
            setTimeout(() => {
                settingsModal.style.display = 'none';
            }, 150); // Уменьшаем время до 150мс
        }
    });
}

// Функция настройки руководства пользователя
function setupGuide() {
    // Получаем элементы руководства
    const closeBtn = document.querySelector('#closeGuide');
    const dontShowBtn = document.querySelector('#showNextTimeGuide');
    const guideTabs = document.querySelectorAll('.guide-tab');
    const guideSections = document.querySelectorAll('.guide-section');
    const faqItems = document.querySelectorAll('.faq-item');
    const closeModalBtn = guideModal.querySelector('.close-modal');
    
    // Закрытие руководства
    closeBtn.addEventListener('click', closeGuide);
    closeModalBtn.addEventListener('click', closeGuide);
    
    // Кнопка "Больше не показывать"
    dontShowBtn.addEventListener('click', () => {
        localStorage.setItem('dontShowGuide', 'true');
        closeGuide();
    });
    
    // Переключение вкладок руководства
    guideTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const sectionId = tab.getAttribute('data-guide-section');
            
            // Убираем активный класс у всех вкладок
            guideTabs.forEach(t => t.classList.remove('active'));
            // Добавляем активный класс текущей вкладке
            tab.classList.add('active');
            
            // Скрываем все секции
            guideSections.forEach(section => {
                section.classList.remove('active');
            });
            
            // Показываем выбранную секцию
            const activeSection = document.getElementById(`guide-${sectionId}`);
            if (activeSection) {
                activeSection.classList.add('active');
            }
        });
    });
    
    // Настройка FAQ (раскрывающиеся вопросы)
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', () => {
            item.classList.toggle('active');
        });
    });
    
    // Закрытие руководства при клике вне его
    window.addEventListener('click', (e) => {
        if (e.target === guideModal) {
            closeGuide();
        }
    });
}

// Функция открытия руководства
function openGuide() {
    guideModal.style.display = 'flex';
    setTimeout(() => {
        guideModal.classList.add('open');
        document.body.classList.add('modal-open');
    }, 10);
    
    // Сбрасываем на первую вкладку
    document.querySelector('.guide-tab').click();
}

// Функция закрытия руководства
function closeGuide() {
    guideModal.classList.remove('open');
    document.body.classList.remove('modal-open');
    setTimeout(() => {
        guideModal.style.display = 'none';
    }, 150); // Уменьшаем время до 150мс
}

// Функция проверки первого посещения
function checkFirstTimeVisit() {
    const isFirstVisit = localStorage.getItem('firstVisit') !== 'false';
    const dontShowGuide = localStorage.getItem('dontShowGuide') === 'true';
    
    if (isFirstVisit && !dontShowGuide) {
        // Устанавливаем флаг первого посещения
        localStorage.setItem('firstVisit', 'false');
        
        // Показываем руководство с небольшой задержкой
        setTimeout(openGuide, 1000);
    }
}

// Добавляем обработчики сортировки для заголовков таблиц
function addTableHeaderSorting() {
    const headers = document.querySelectorAll('.sortable');
    
    headers.forEach(header => {
        // Удаляем старые обработчики
        const newHeader = header.cloneNode(true);
        header.parentNode.replaceChild(newHeader, header);
        
        // Добавляем новый обработчик
        newHeader.addEventListener('click', () => {
            const field = newHeader.getAttribute('data-field');
            
            // Меняем направление сортировки, если поле уже выбрано
            if (currentSort.field === field) {
                currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                currentSort.field = field;
                currentSort.direction = 'asc';
            }
            
            // Обновляем иконки сортировки
            headers.forEach(h => {
                const icon = h.querySelector('i');
                
                // Сбрасываем все иконки и атрибуты
                h.removeAttribute('aria-sort');
                
                if (h.getAttribute('data-field') === currentSort.field) {
                    if (currentSort.direction === 'asc') {
                        icon.className = 'fas fa-sort-up';
                        h.setAttribute('aria-sort', 'ascending');
                    } else {
                        icon.className = 'fas fa-sort-down';
                        h.setAttribute('aria-sort', 'descending');
                    }
                } else {
                    icon.className = 'fas fa-sort';
                }
            });
            
            // Применяем сортировку
            applyFilterAndSort();
        });
    });
}