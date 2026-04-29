export const ru = {
  common: {
    save: 'Сохранить',
    cancel: 'Отмена',
    delete: 'Удалить',
    edit: 'Редактировать',
    view: 'Просмотр',
    search: 'Поиск...',
    all: 'Все',
    notFound: 'Не найдено',
    none: '— Нет —',
    ok: 'OK',
    yes: 'Да',
    no: 'Нет',
    required: 'Обязательно',
    loading: 'Загрузка...',
    actions: 'ДЕЙСТВИЯ',
    refresh: 'Обновить',
    confirm: 'Подтвердить',
    saveChanges: 'Сохранить изменения'
  },
  nav: {
    dashboard: 'Главная',
    families: 'Семьи',
    members: 'Члены семьи',
    preview: 'Древо',
    users: 'Пользователи',
    documents: 'Документы',
    settings: 'Настройки',
    profile: 'Профиль',
    password: 'Пароль',
    appearance: 'Внешний вид',
    boshqaruv: 'Панель управления'
  },
  topbar: {
    lightMode: 'Светлая тема',
    darkMode: 'Тёмная тема',
    signOut: 'Выйти',
    language: 'Язык'
  },
  auth: {
    signInTitle: 'Вход в систему',
    signInSubtitle: 'Введите свои данные для входа в аккаунт.',
    login: 'Логин',
    loginPlaceholder: 'Логин, email или телефон',
    password: 'Пароль',
    signIn: 'Войти',
    forgotPassword: 'Забыли пароль?',
    noAccount: 'Нет аккаунта?',
    signUp: 'Регистрация',
    loginRequired: 'Логин обязателен',
    passwordRequired: 'Пароль обязателен'
  },
  authShell: {
    taglineDefault: 'История вашей семьи — в одном месте.',
    captionDefault: 'Shajara System — современное и надёжное управление семейным древом.',
    feature1: 'Удобное управление членами и поколениями',
    feature2: 'Многоязычный интерфейс и темы',
    feature3: 'Конфиденциальное и безопасное хранение',
    signIn: {
      tagline: 'С возвращением! Войдите в свой аккаунт.',
      caption: 'Продолжайте управлять своим семейным древом.'
    },
    signUp: {
      tagline: 'Создайте новый аккаунт и начните.',
      caption: 'Зарегистрируйтесь за несколько шагов и начните строить древо.'
    },
    forgot: {
      tagline: 'Сбросить пароль — легко.',
      caption: 'Введите email — мы отправим код подтверждения.'
    },
    reset: {
      tagline: 'Установите новый пароль.',
      caption: 'Введите код из письма и выберите новый пароль.'
    }
  },
  signUp: {
    title: 'Создать аккаунт',
    subtitle: 'Регистрация за несколько шагов.',
    firstName: 'Имя',
    lastName: 'Фамилия',
    userName: 'Имя пользователя',
    email: 'Email',
    phone: 'Телефон',
    password: 'Пароль',
    confirmPassword: 'Подтверждение пароля',
    submit: 'Зарегистрироваться',
    haveAccount: 'Уже есть аккаунт?',
    firstNameRequired: 'Имя обязательно',
    lastNameRequired: 'Фамилия обязательна',
    emailRequired: 'Email обязателен',
    emailInvalid: 'Неверный формат email',
    phoneInvalid: 'Неверный формат телефона',
    passwordRequired: 'Пароль обязателен',
    passwordTooShort: 'Минимум 6 символов',
    confirmPasswordRequired: 'Подтвердите пароль'
  },
  forgotPassword: {
    title: 'Забыли пароль?',
    subtitle: 'Введите email — мы отправим код для сброса пароля.',
    calloutTitle: 'Проверьте также папку «Спам».',
    calloutBody: 'Письмо приходит в течение 1–2 минут. Если не пришло — можно отправить повторно.',
    email: 'Email',
    emailRequired: 'Email обязателен',
    emailInvalid: 'Неверный формат email',
    submit: 'Отправить код',
    back: 'Назад',
    rememberPassword: 'Вспомнили пароль?'
  },
  resetPassword: {
    title: 'Сброс пароля',
    subtitle: 'Введите код из письма и выберите новый пароль.',
    code: 'Код подтверждения',
    codeRequired: 'Код обязателен',
    codeInvalid: 'Неверный код',
    newPassword: 'Новый пароль',
    confirmPassword: 'Подтверждение пароля',
    passwordRequired: 'Пароль обязателен',
    passwordTooShort: 'Минимум 6 символов',
    confirmRequired: 'Подтвердите пароль',
    mismatch: 'Пароли не совпадают',
    submit: 'Обновить пароль'
  },
  dashboard: {
    title: 'Панель управления',
    subtitle: 'Общий обзор системы и быстрые действия.',
    statFamilies: 'СЕМЬИ',
    statMembers: 'ЧЛЕНЫ',
    statUsers: 'ПОЛЬЗОВАТЕЛИ',
    statActivity: 'АКТИВНОСТЬ',
    quickActions: 'Быстрые действия',
    actionManageFamilies: 'Управлять семьями',
    actionMembersList: 'Список членов',
    actionViewTree: 'Просмотр древа',
    actionUsers: 'Пользователи'
  },
  family: {
    title: 'Семьи',
    subtitle: 'Управление семейными группами в системе.',
    listTitle: 'Список семей',
    new: 'Новая семья',
    notFound: 'Семьи не найдены.',
    colName: 'НАЗВАНИЕ',
    colFamilyName: 'ФАМИЛИЯ',
    colDescription: 'ОПИСАНИЕ',
    colCreatedAt: 'СОЗДАНО'
  },
  member: {
    title: 'Члены семьи',
    subtitle: 'Список всех членов семьи и управление ими.',
    statTotal: 'ВСЕГО ЧЛЕНОВ',
    statGenerations: 'ПОКОЛЕНИЯ',
    statRecent: 'НЕДАВНО ДОБАВЛЕНЫ',
    statArchived: 'В АРХИВЕ',
    listTitle: 'Список членов',
    new: 'Новый член',
    family: 'Семья',
    notFound: 'Члены семьи не найдены.',
    colFio: 'Ф.И.О.',
    colRelation: 'РОДСТВО',
    colBirthYear: 'ГОД РОЖДЕНИЯ',
    colStatus: 'СТАТУС',
    son: 'Сын',
    daughter: 'Дочь',
    statusActive: 'АКТИВЕН',
    statusPending: 'ОЖИДАЕТСЯ',
    statusArchived: 'АРХИВ'
  },
  user: {
    title: 'Пользователи',
    subtitle: 'Пользователи системы (созданные через регистрацию).',
    listTitle: 'Список пользователей',
    family: 'Семья',
    notFound: 'Пользователи не найдены.',
    colFio: 'Ф.И.О.',
    colUserName: 'USERNAME',
    colEmail: 'EMAIL',
    colPhone: 'ТЕЛЕФОН',
    colFamily: 'СЕМЬЯ'
  },
  preview: {
    title: 'Семейное древо',
    zoomIn: 'Приблизить',
    zoomOut: 'Отдалить',
    selectFamily: 'Выберите семью',
    selectFamilyPlaceholder: '— Выберите семью —',
    emptyTitle: 'Выберите семью',
    emptySubtitle: 'Древо автоматически строится по связям отца, матери и супруга/и.',
    noMembersTitle: 'Нет членов',
    noMembersSubtitle: 'Добавьте новых членов на странице "Члены семьи".',
    head: 'Глава семьи',
    spouse: 'Супруг(а)',
    son: 'Сын',
    daughter: 'Дочь',
    commonChildren: 'ОБЩИЕ ДЕТИ',
    childrenSuffix: 'ДЕТИ'
  },
  documents: {
    title: 'Документы',
    subtitle: 'Документы и файлы, связанные с семьёй.',
    comingSoonTitle: 'Скоро',
    comingSoonBody: 'Раздел документов в разработке. Скоро здесь появится возможность хранить и управлять семейными документами.'
  },
  settings: {
    title: 'Настройки',
    subtitle: 'Управляйте аккаунтом, безопасностью и внешним видом.'
  },
  profile: {
    title: 'Профиль',
    subtitle: 'Обновите имя, контактные данные и аватар.',
    firstName: 'Имя',
    lastName: 'Фамилия',
    userName: 'Имя пользователя',
    email: 'Email',
    phone: 'Телефон',
    emailInvalid: 'Неверный email',
    uploadAvatar: 'Загрузить аватар',
    changeAvatar: 'Изменить аватар'
  },
  password: {
    title: 'Пароль',
    subtitle: 'Используйте сильный пароль, которого нет на других сайтах.',
    current: 'Текущий пароль',
    new: 'Новый пароль',
    confirm: 'Подтвердите новый пароль',
    hint: 'Минимум 6 символов.',
    tooShort: 'Слишком короткий',
    mismatch: 'Пароли не совпадают',
    update: 'Обновить пароль'
  },
  appearance: {
    title: 'Внешний вид',
    subtitle: 'Выберите внешний вид панели. Сохраняется на этом устройстве.',
    theme: 'Тема',
    currentMode: 'Текущий режим',
    light: 'Светлая',
    dark: 'Тёмная',
    system: 'Системная'
  },
  footer: {
    admin: 'Админ'
  }
};
