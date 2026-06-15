# ROADMAP: Воспитание.PRO

## Update: Stage 17.7.7 Demo Mode as a Live School

- [x] Demo Mode now loads a realistic urban school from Kaluga region for the 2025/2026 academic year.
- [x] Demo data includes 824 students, 33 classes, 36 events, 16 upbringing modules, 10 associations, 7 infrastructure objects, 12 partner records and 7 extracurricular programs.
- [x] KPVR, activity plans, activity reports, event execution and work program use the same generated demo state instead of separate hand-written demo documents.
- [x] The `/demo` page shows clear empty states before demo loading and avoids zero KPI blocks.
- [x] Work Mode remains isolated from Demo Mode and continues to use independent work-state storage.

Next steps:

- [ ] Restart the local Next.js dev server before a live presentation if an old process still serves stale 500 responses.
- [ ] Add e2e smoke tests for `/demo`, `/educational-system`, `/kpvr`, `/work-program` and `/activity-reports`.
- [ ] Prepare the public Vercel demonstration flow.

## Update: Stage 18.1 Built-In Methodologist for School Data Entry

- [x] Added a shared guidance system for data-entry UX: section guides, field hints, document impact chips, readiness indicators and next-step hints.
- [x] Added section-level and field-level methodical guidance to the core new-user path: school passport, educational system, events and extracurricular activities.
- [x] Added readiness indicators for school passport, educational system, event card and extracurricular program card.
- [x] Added next-step prompts after meaningful data is present: passport to educational system, educational system to events, events to KPVR, extracurricular activities to work program.
- [x] Business logic, AppState, Demo Mode, Work Mode and document generators were not changed.

Next steps:

- [ ] Extend the same guidance pattern to import documents, normative documents and document-processing forms.
- [ ] Add context-aware examples that adapt to the user's region and existing school data.
- [ ] Add a visual first-run checklist that points users to incomplete guided sections.

Документ фиксирует ход разработки MVP. После каждого крупного изменения сюда нужно вносить:

- выполненные задачи;
- текущий этап;
- следующие шаги;
- важные архитектурные решения.

## Текущий Этап

**Этап 10 завершен: Подготовка к Supabase**

Проект подготовлен к будущему подключению Supabase без фактического подключения Supabase: localStorage вынесен в `data-access`, добавлены предметные интерфейсы репозиториев, типы разнесены по файлам, схема таблиц описана в `docs/database-schema.md`.

## Выполнено

### Этап 1: Базовый Каркас MVP

- [x] Создан проект на Next.js, TypeScript и TailwindCSS.
- [x] Добавлена структура каталогов: `app`, `components`, `components/ui`, `data`, `lib`, `types`.
- [x] Добавлен App Router layout.
- [x] Реализовано левое меню.
- [x] Реализована главная панель.
- [x] Созданы базовые разделы:
  - «Паспорт школы»
  - «Мероприятия»
  - «КПВР»
  - «Внеурочная деятельность»
  - «Экспорт документов»
- [x] Добавлены локальные UI-компоненты в стиле shadcn/ui.
- [x] Добавлены mock-data.
- [x] Добавлен repository-слой для работы с данными.
- [x] Реализовано сохранение состояния через `localStorage`.
- [x] Проверена production-сборка через `npm.cmd run build`.

### Этап 2: Паспорт Школы

- [x] Расширена модель `SchoolPassport`.
- [x] Добавлены общие данные школы.
- [x] Добавлен блок инфраструктуры.
- [x] Добавлен блок социальных партнеров.
- [x] Реализовано добавление нескольких социальных партнеров.
- [x] Реализовано редактирование социальных партнеров.
- [x] Реализовано удаление социальных партнеров.
- [x] Добавлена валидация обязательных полей.
- [x] Добавлена миграция старого формата данных из `localStorage`.
- [x] Добавлен компонент `Textarea`.
- [x] Проверена сборка после изменений.

### Этап 2.1: Модули Воспитания

- [x] Создан раздел «Модули воспитания».
- [x] Добавлен справочник из 16 стандартных модулей:
  - Урочная деятельность
  - Внеурочная деятельность
  - Классное руководство
  - Основные школьные дела
  - Внешкольные мероприятия
  - Трудовая деятельность
  - Организация предметно-пространственной среды
  - Взаимодействие с родителями
  - Самоуправление
  - Профилактика и безопасность
  - Социальное партнерство
  - Профориентация
  - Детские общественные объединения
  - Школьные медиа
  - Школьный музей
  - Адаптация детей-мигрантов
- [x] У каждого модуля есть `id`, `title`, `description`, `active`.
- [x] Модули хранятся как часть данных приложения в `AppState`.
- [x] Реализовано включение и выключение модулей.
- [x] Реализовано добавление пользовательского модуля.
- [x] Добавлена миграция старого состояния `localStorage` для модулей и мероприятий.
- [x] Мероприятия связаны со справочником через `moduleId`.
- [x] В карточке мероприятия отображается модуль из справочника и его активность.
- [x] Раздел добавлен в левое меню.
- [x] В разделе «Мероприятия» добавлена форма создания мероприятия с выбором активного модуля.
- [x] КПВР переведен на связь с модулями через `moduleId`.
- [x] Исправлена битая кириллица в интерфейсных файлах.
- [x] Общие поля форм вынесены в `components/app/form-field.tsx`.
- [x] Добавлен UI-компонент `Select`.
- [x] Удален неиспользуемый `Separator`.
- [x] Lint переведен с deprecated `next lint` на ESLint CLI.
- [x] Закрыт `npm audit` риск по PostCSS через npm `overrides`.
- [x] Проведено пользовательское тестирование по ролям: заместитель директора по ВР, советник директора, классный руководитель, директор.
- [x] На главную добавлены ролевые сценарии входа.
- [x] В разделе «Мероприятия» добавлены фильтры по модулю и статусу.
- [x] Добавлены понятные пустые состояния.
- [x] В «Паспорте школы» добавлена сводка актуальности данных и подтверждение сброса.
- [x] В «Модулях воспитания» добавлена защита от дублей и предупреждение при отключении всех модулей.
- [x] Перед этапом 4 проведена проверка готовности: заглушки и технические формулировки убраны из пользовательского интерфейса.

## Следующие Шаги

### Этап 4: Реестр Мероприятий

- [x] Доработать раздел «Мероприятия» до полноценного реестра:
  - добавление мероприятия;
  - редактирование мероприятия;
  - удаление мероприятия;
  - фильтр по модулю воспитания;
  - фильтр по уровню образования;
  - фильтр по месяцу;
  - фильтр по статусу;
  - автоматическое определение месяца по дате начала;
  - попадание мероприятия в планы НОО, ООО, СОО по выбранным уровням;
  - удобная таблица мероприятий с действиями.
- [x] Расширена модель `SchoolEvent` под карточку мероприятия.
- [x] Добавлена миграция старых мероприятий из `localStorage`.
- [x] Статусы мероприятий отделены от статусов задач КПВР.
- [x] Перед этапом 5 справочные подписи мероприятий вынесены в `lib/domain/events.ts`, чтобы быстрое добавление конкурса не дублировало доменную логику.

Следующие задачи после реестра:

### Этап 5: Быстрое Добавление Конкурса

- [x] Добавить быстрый сценарий создания конкурса.
- [x] Предзаполнять карточку мероприятия типовыми полями конкурса.
- [x] Сохранять конкурс как обычное мероприятие в реестре.
- [x] Обеспечить попадание конкурса в планы НОО, ООО, СОО по выбранным уровням.
- [x] Автоматически ставить модуль «Основные школьные дела».
- [x] Автоматически определять месяц по дате начала.
- [x] Устанавливать статус «Планируется».
- [x] Добавить экран подтверждения перед сохранением конкурса.

Следующие задачи после этапа 5:

- [x] Этап 6: добавлен генератор КПВР:
  - выбор уровня образования: НОО, ООО, СОО;
  - отдельные вкладки «КПВР НОО», «КПВР ООО», «КПВР СОО»;
  - вывод учебного года из паспорта школы;
  - группировка документа сначала по модулю, внутри модуля по дате;
  - таблица предпросмотра с колонками: №, дела/события/мероприятия, классы, сроки, ответственные;
  - отображение федеральных периодов 2018–2027 и 2022–2031.
- [ ] Добавить отдельную карточку просмотра мероприятия.
- [ ] Добавить связь мероприятий с конкретными задачами КПВР после появления модели задач.
- [x] Этап 7: доработан раздел «Внеурочная деятельность»:
  - карточка программы;
  - тип программы: внеурочная деятельность / дополнительное образование;
  - направление;
  - уровни образования;
  - классы;
  - количество часов в неделю;
  - педагог;
  - кабинет;
  - количество обучающихся;
  - статус: активна / неактивна;
  - добавление, редактирование и удаление программ;
  - фильтры по уровню образования, классу и педагогу;
  - расчет часов по уровням НОО, ООО, СОО;
  - расчет охвата обучающихся;
  - предпросмотр таблицы плана внеурочной деятельности.
- [x] Перед этапом 7 расширена модель `ExtraActivity`:
  - уровни образования;
  - классы;
  - недельные часы;
  - годовые часы.
- [x] Перед этапом 7 добавлена миграция старых записей `extraActivities` из `localStorage`.
- [x] Перед этапом 7 текущий экран «Внеурочная деятельность» переведен с карточек на табличную основу будущего плана.
- [x] Перед этапом 8 доработан раздел «Экспорт документов»:
  - добавлены DOCX-источники данных для паспорта школы, мероприятий, КПВР и плана внеурочной деятельности;
  - удалена диагностическая `draft`-выгрузка;
  - добавлена миграция `exportDocuments` для старого localStorage.
- [x] Этап 8: реализована генерация DOCX-файлов:
  - КПВР НОО, ООО, СОО;
  - план внеурочной деятельности НОО, ООО, СОО;
  - генерация работает в браузере через библиотеку `docx`;
  - КПВР содержит заголовок, учебный год, уровень образования, строки про десятилетия, группировку по модулям и таблицу мероприятий;
  - план внеурочной деятельности содержит заголовок, уровень образования и таблицу программ.
- [x] Перед этапом 9 устранен мелкий DRY-риск в `/exports`: количество DOCX-документов рассчитывается от списка уровней образования, а не хранится как литерал.
- [x] В ходе ревизии шага 9 устранено дублирование порядка уровней образования: общий список `educationLevels` вынесен в `lib/domain/events.ts`.
- [x] В ходе ревизии шага 9 улучшена надежность DOCX-экспорта: добавлено сообщение об ошибке генерации и отложенное освобождение blob URL после запуска скачивания.
- [x] Перед этапом 10 localStorage-реализация перенесена в `lib/data-access/app-repository.ts`.
- [x] Перед этапом 10 старый путь `lib/repositories/app-repository.ts` оставлен как совместимый реэкспорт.
- [x] В ходе предрелизного аудита добавлено поле `venue` для мероприятий и миграция старых записей.
- [x] В ходе предрелизного аудита генерация новых локальных id переведена на `createId()` с `crypto.randomUUID`.
- [x] В ходе предрелизного аудита `AppProvider` защищен от обновления состояния после размонтирования.
- [x] В ходе предрелизного аудита ESLint flat config явно подключает `@next/next`, предупреждение Next.js build устранено.
- [x] Перед демонстрацией добавлен сценарий показа на главную страницу.
- [x] Перед демонстрацией добавлена явная обратная связь после сохранения мероприятий, конкурсов и программ внеурочной деятельности.
- [x] Перед демонстрацией в разделе экспорта добавлена проверка наполненности DOCX по каждому уровню образования.
- [ ] Добавить базовые smoke-тесты или e2e-проверки ключевых маршрутов.
- [ ] Добавить отдельный слой генерации документов для КПВР и рабочей программы воспитания.

## Архитектурные Решения

- Приложение строится на Next.js App Router.
- Backend на этапе MVP не подключается.
- Все данные пока хранятся локально:
  - начальное состояние лежит в `data/mock-data.ts`;
  - текущее состояние сохраняется в `localStorage`;
  - доступ к данным идет через repository-слой в `lib/repositories`.
- Data-access слой оставлен намеренно, чтобы позже заменить `LocalStorageAppRepository` на Supabase-реализацию без переписывания страниц.
- Типы предметной области разнесены по файлам `types/common.ts`, `types/school.ts`, `types/events.ts`, `types/modules.ts`, `types/kpvr.ts`, `types/extra-activities.ts`, `types/exports.ts`, `types/app-state.ts`; `types/domain.ts` оставлен как фасад совместимости.
- UI-компоненты хранятся локально в `components/ui` и совместимы по подходу с shadcn/ui.
- Справочник модулей воспитания хранится в `AppState.educationModules`, а мероприятия ссылаются на него через `SchoolEvent.moduleId`.
- КПВР больше не должен дублировать отдельный список мероприятий: строки плана строятся из `SchoolEvent` через `lib/domain/kpvr.ts`, чтобы быстрые конкурсы и обычные мероприятия сразу попадали в нужные планы НОО, ООО и СОО.
- Генератор КПВР выделен в `lib/domain/kpvr.ts`: UI страницы `/kpvr` только выбирает уровень и отображает готовую структуру документа.
- Раздел `/kpvr` использует вкладки уровней образования без отдельной зависимости: это локальный UI-сценарий поверх доменной функции генерации.
- Модель внеурочной деятельности расширена до структуры, пригодной для будущего плана: `ExtraActivity.educationLevels`, `classes`, `weeklyHours`, `totalHours`.
- Для обратной совместимости localStorage записи внеурочной деятельности нормализуются в `lib/data-access/app-repository.ts`.
- Расчеты, фильтрация и строки плана внеурочной деятельности вынесены в `lib/domain/extra-activities.ts`, чтобы экран и будущий экспорт использовали одну доменную логику.
- DOCX-документы собираются в `lib/domain/docx-export.ts`, чтобы UI страницы экспорта только запускал скачивание и не содержал правил форматирования документов.
- Библиотека `docx` используется только на странице `/exports`, поэтому основной пользовательский интерфейс не получает лишний вес бандла.
- Быстро добавленный конкурс сохраняется как обычный `SchoolEvent`, чтобы таблица, фильтры, экспорт и будущая генерация КПВР работали с единой моделью.
- Порядок уровней образования НОО/ООО/СОО хранится в одном доменном источнике `educationLevels`, чтобы формы, КПВР и DOCX-экспорт не расходились.
- Новые локальные сущности получают id через `createId()`, чтобы снизить риск коллизий перед переносом на UUID в Supabase.
- Карточка мероприятия содержит место проведения; поле мигрируется для старых localStorage-записей и учитывается в будущей Supabase-схеме.
- Для обратной совместимости localStorage используется миграция в `lib/data-access/app-repository.ts`.
- Перед этапом 10 текущая localStorage-реализация перенесена в `lib/data-access/app-repository.ts`; старый путь `lib/repositories/app-repository.ts` оставлен как совместимый реэкспорт.
- На этапе 10 добавлены контракты `SchoolRepository`, `EventRepository`, `ModuleRepository`, `ExtracurricularRepository` в `lib/data-access/repository-contracts.ts`.
- На этапе 10 добавлена localStorage-реализация предметных репозиториев в `lib/data-access/local-storage-repositories.ts`.
- На этапе 10 описана предполагаемая структура таблиц Supabase в `docs/database-schema.md`.
- Для зависимостей используется npm `overrides`, чтобы фиксировать безопасные версии транзитивных пакетов без `npm audit fix --force`.
- Авторизация, ИИ, отчеты и аналитика намеренно не реализуются на текущем этапе MVP.
- Для Windows-команд используется `npm.cmd`, потому что запуск `npm.ps1` может блокироваться политикой выполнения PowerShell.

## Проверки

Последняя проверка:

- [x] `npm.cmd run lint` - без ошибок.
- [x] `npm.cmd run build` - успешно.
- [x] `npm.cmd audit --audit-level=moderate` - 0 уязвимостей.
- [x] Основные маршруты проверялись через HTTP.
- [x] `/education-modules` - HTTP 200.
- [x] `/events` - HTTP 200.
- [x] `/school-passport` - HTTP 200.
- [x] `/kpvr` - HTTP 200.
- [x] `/extra-activities` - HTTP 200.
- [x] `/exports` - HTTP 200.
- [x] `/kpvr` содержит вкладки НОО/ООО/СОО и ключевые строки предпросмотра документа.
- [x] `/extra-activities` содержит табличную основу плана внеурочной деятельности.
- [x] `/extra-activities` содержит форму программы, фильтры, реестр и предпросмотр плана внеурочной деятельности.
- [x] `/exports` содержит кнопки скачивания DOCX для КПВР НОО/ООО/СОО и плана внеурочной деятельности НОО/ООО/СОО.
- [x] Перед этапом 9 все основные маршруты повторно проверены через HTTP.
- [x] Перед этапом 10 все основные маршруты повторно проверены через HTTP.

## Известные Замечания

- Нет открытых npm audit уязвимостей уровня moderate и выше.
- Редактирование и удаление мероприятий реализованы в разделе «Мероприятия».
- Экспорт паспорта школы и общего реестра мероприятий в DOCX пока не реализован.
# Supabase Migration

Текущий этап: подключение Supabase вместо `localStorage`.

Выполнено:

- [x] Добавлена зависимость `@supabase/supabase-js`.
- [x] Основной `AppProvider` переключен на `createSupabaseDataAccess()`.
- [x] Добавлен Supabase browser client в `lib/supabase/client.ts`.
- [x] Добавлена реализация CRUD-репозиториев Supabase в `lib/data-access/supabase-repositories.ts`.
- [x] Добавлена SQL-схема `supabase/schema.sql` для таблиц `schools`, `modules`, `events`, `extracurricular_programs`, `partners`, `staff`.
- [x] Добавлен пример переменных окружения `.env.example`.
- [x] Добавлены глобальные индикаторы загрузки, сохранения и ошибок Supabase.
- [x] Обновлена документация `docs/database-schema.md`.

Архитектурные решения:

- Компоненты не обращаются к Supabase напрямую; они продолжают работать через `AppProvider` и repository/data-access слой.
- `localStorage` оставлен в кодовой базе как прежняя реализация, но больше не используется основным провайдером.
- Таблицы используют `text` id, чтобы сохранить текущие стабильные идентификаторы модулей и существующие связи мероприятий.
- `staff` пока синхронизируется автоматически из паспорта школы, мероприятий и программ внеурочной деятельности, потому что отдельного UI для сотрудников еще нет.
- При отсутствии `NEXT_PUBLIC_SUPABASE_URL` и `NEXT_PUBLIC_SUPABASE_ANON_KEY` приложение показывает контролируемую ошибку, а не падает белым экраном.

Следующие шаги:

- [ ] Создать реальный Supabase-проект и выполнить `supabase/schema.sql`.
- [ ] Заполнить `.env.local`.
- [ ] Проверить CRUD на реальной базе.
- [ ] Добавить авторизацию и RLS-политики перед передачей нескольким школам.
## Acceptance Audit

Текущий статус приемки: кодовые сценарии переведены на Supabase, но полный пользовательский CRUD-тест на живой базе заблокирован, потому что в рабочей папке нет `.env.local` с `NEXT_PUBLIC_SUPABASE_URL` и `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

Выполнено в рамках приемочного аудита:

- [x] Проверены `npm.cmd run lint`, `npm.cmd run build`, `npm.cmd audit --audit-level=moderate`.
- [x] Проверено наличие SQL-схемы `supabase/schema.sql` для `schools`, `modules`, `events`, `extracurricular_programs`, `partners`, `staff`.
- [x] Исправлена ложная индикация успешного сохранения: формы теперь ждут завершения `updateState()` и не показывают успех при ошибке Supabase.
- [x] Добавлен откат оптимистичного состояния в `AppProvider`, если сохранение в Supabase завершилось ошибкой.
- [x] CRUD-кнопки на основных формах блокируются во время сохранения.

Блокеры перед реальным тестированием в школе:

- [ ] Создать Supabase-проект.
- [ ] Выполнить `supabase/schema.sql`.
- [ ] Создать `.env.local`.
- [ ] Повторить end-to-end CRUD-проверку на реальной базе.
## Educational System Section

Текущий этап: добавлен раздел «Воспитательная система школы» как база для будущего ИИ-конструктора КПВР.

Выполнено:

- [x] Добавлены типы воспитательных объединений, инфраструктуры и партнеров.
- [x] Добавлена страница `/educational-system`.
- [x] Добавлен пункт меню «Воспитательная система».
- [x] Мероприятия расширены связями с объединением, инфраструктурой и партнером.
- [x] Добавлена аналитика объединений: количество мероприятий, участники, уровень активности.
- [x] Supabase SQL-схема расширена таблицами `educational_associations`, `school_infrastructure_objects`, `educational_system_partners`.

Архитектурные решения:

- Новые данные хранятся в `AppState.educationalSystem`, чтобы UI и будущий ИИ-конструктор работали с единым доменным объектом.
- Связи мероприятия хранятся в `SchoolEvent.associationId`, `SchoolEvent.infrastructureObjectId`, `SchoolEvent.systemPartnerId`.
- При удалении ресурса связи в мероприятиях очищаются, чтобы не оставлять битые ссылки.
## Import Documents Section

Текущий этап: добавлен раздел «Импорт документов».

Выполнено:

- [x] Добавлен пункт меню «Импорт документов».
- [x] Добавлена страница `/import-documents`.
- [x] Пользователь может выбрать DOCX, PDF и XLSX.
- [x] После выбора файл появляется в списке.
- [x] Для файла отображаются название, тип, дата загрузки, размер и статус обработки.
- [x] Содержимое документов пока не анализируется и не сохраняется; хранится только metadata.
- [x] Supabase SQL-схема расширена таблицей `imported_documents`.

Архитектурные решения:

- Импортированные документы хранятся в `AppState.importedDocuments`.
- Статус по умолчанию `uploaded`, чтобы позже добавить очередь обработки без изменения UI-контракта.
- Таблица `imported_documents` хранит только метаданные; файловое хранилище Supabase Storage можно подключить отдельным этапом.

## Document Event Extraction

Текущий этап: добавлено mock-извлечение мероприятий из импортированных документов без OpenAI API.

Выполнено:

- [x] Добавлена сущность `ExtractedEvent`.
- [x] Добавлен сервисный контракт `DocumentEventExtractor`.
- [x] Добавлена mock-реализация `MockDocumentEventExtractor`.
- [x] На странице импорта добавлена кнопка «Извлечь мероприятия».
- [x] Добавлен экран «Найденные мероприятия».
- [x] Добавлены фильтры по уровням НОО/ООО/СОО/Все уровни.
- [x] Добавлен поиск по найденным мероприятиям.
- [x] Добавлен множественный выбор найденных мероприятий.
- [x] Импорт найденных мероприятий в основной реестр намеренно не реализован.
- [x] Supabase SQL-схема расширена таблицей `extracted_events`.

Архитектурные решения:

- UI зависит от интерфейса `DocumentEventExtractor`, а не от конкретной mock-реализации.
- На следующем этапе mock-анализатор можно заменить на OpenAI-реализацию с тем же методом `extract(document)`.
- Найденные мероприятия хранятся отдельно в `AppState.extractedEvents`, чтобы не смешивать черновые результаты распознавания с утвержденными мероприятиями.

## Import Selected Extracted Events

Текущий этап: добавлен импорт выбранных мероприятий из раздела «Импорт документов» в основной реестр мероприятий.

Выполнено:

- [x] Создан доменный сервис `ExtractedEventImporter`.
- [x] Добавлен расчет плана импорта: количество выбранных мероприятий, уровни образования, предполагаемые модули и возможные дубли.
- [x] Добавлен экран подтверждения перед импортом.
- [x] Добавлены варианты обработки совпадений: пропустить, создать новое, заменить существующее.
- [x] При импорте создаются полноценные карточки `SchoolEvent` в основном реестре `events`.
- [x] Заполняются название, описание, даты, месяц, уровень образования, модуль, ответственный и источник документа.
- [x] После импорта показывается отчет: импортировано, пропущено, дубли, заменено.
- [x] Импортированные мероприятия автоматически попадают в КПВР НОО/ООО/СОО через существующий механизм построения планов из `state.events`.
- [x] Статус извлеченного мероприятия меняется на `selected` или `ignored` после импорта.

Архитектурные решения:

- Правила импорта и поиска дублей вынесены из React-страницы в `lib/domain/extracted-event-importer.ts`.
- UI зависит от интерфейса `ExtractedEventImporter`, а не от конкретной реализации.
- Источник документа сохраняется внутри карточки мероприятия в описании, кратком отчете и поле `partner`, чтобы пользователь видел происхождение импортированных данных.
- Дубли определяются по схожести названия, совпадению даты и уровня образования; это временная доменная эвристика, которую позже можно заменить более строгим matcher-сервисом.

Следующие шаги:

- [ ] Добавить ручное редактирование извлеченного мероприятия перед импортом.
- [ ] Добавить просмотр источника документа в карточке мероприятия и быстрый переход к исходному документу.
- [ ] Заменить mock-извлечение на OpenAI/API-анализатор без изменения UI-контракта `DocumentEventExtractor`.

## School Event Relevance Analysis

Текущий этап: добавлена rule-based оценка релевантности найденных мероприятий для конкретной школы.

Выполнено:

- [x] Создан сервисный контракт `SchoolEventRelevanceAnalyzer`.
- [x] Добавлена rule-based реализация без OpenAI API.
- [x] Анализатор принимает `ExtractedEvent` и `AppState`.
- [x] Анализатор возвращает `relevanceLevel`, `relevanceScore`, `reasons`, `warnings`.
- [x] В правилах используются паспорт школы, воспитательные объединения, инфраструктура, социальные партнеры, внеурочные программы и существующие мероприятия.
- [x] Для волонтерского отряда, школьного музея, ЮИД, «Орлят России» и «Движения Первых» добавлены отдельные правила.
- [x] В таблицу найденных мероприятий добавлены релевантность, балл, причина рекомендации и предупреждения.
- [x] Добавлен фильтр по высокой, средней и низкой релевантности.
- [x] Высокорелевантные мероприятия автоматически отмечаются после извлечения.
- [x] Предупреждения по релевантности показываются перед импортом.

Архитектурные решения:

- Оценка релевантности не сохраняется в `ExtractedEvent`; она вычисляется из текущего `AppState`, чтобы рекомендации менялись при изменении паспорта школы, объединений, инфраструктуры и программ.
- UI зависит от интерфейса `SchoolEventRelevanceAnalyzer`, поэтому rule-based реализацию можно заменить или дополнить AI-анализатором без переписывания страницы импорта.
- Дубли существующих мероприятий считаются фактором низкой релевантности и дополнительно остаются в механизме подтверждения импорта.

Следующие шаги:

- [ ] Добавить ручную корректировку оценки релевантности пользователем.
- [ ] Добавить сохранение принятого решения по каждому найденному мероприятию.
- [ ] Расширить правила на муниципальные и региональные приоритеты после появления справочника приоритетов школы.

## User Scenario Audit: School To KPVR

Текущий этап: проведен аудит полного пользовательского сценария заместителя директора по воспитательной работе и реализованы быстрые UX-улучшения.

Выполнено:

- [x] Проверен путь: паспорт школы -> воспитательная система -> объединения -> музей -> партнеры -> загрузка плана -> извлечение -> релевантность -> импорт -> КПВР.
- [x] Добавлен компонент `ScenarioReadiness` с контрольным списком готовности сценария.
- [x] Чеклист готовности добавлен на страницы `/import-documents` и `/kpvr`.
- [x] В импорте добавлены массовые действия: выбрать рекомендуемые, выбрать рекомендуемые и возможные, снять нерекомендуемые.
- [x] После импорта добавлены быстрые переходы в реестр мероприятий и КПВР.
- [x] В подтверждении импорта сохранены предупреждения по релевантности и дублированию.

Архитектурные решения:

- Сценарная готовность вынесена в отдельный компонент, чтобы не смешивать навигационную помощь с доменной логикой импорта.
- Компонент готовности читает только `AppState` и не меняет данные, поэтому безопасен для Supabase/localStorage-слоя.
- Массовый выбор использует уже вычисленную релевантность, не создает отдельного состояния рекомендаций и не требует миграции данных.

Следующие шаги:

- [ ] Исправить битую кириллицу в старых UI-файлах единым проходом.
- [ ] Добавить мастер первичной настройки школы на 5-7 минут.
- [ ] Добавить предпросмотр импортируемой карточки мероприятия до сохранения.
- [ ] Добавить тестовые сценарии Playwright после восстановления browser runtime.

## Stage 13.1: Work Program Engine

Текущий этап: создана архитектурная основа модуля «Рабочая программа воспитания» и первый рабочий раздел «Уклад школы».

Выполнено:

- [x] Добавлен пункт меню «Рабочая программа воспитания».
- [x] Создана предметная область `work-program`, отделенная от КПВР, мероприятий и экспорта.
- [x] Добавлены типы `WorkProgram`, `WorkProgramSection`, `SchoolCultureSection`, `GeneratedParagraph`, `GenerationSource`, `WorkProgramVersion`.
- [x] Добавлены сервисы `SchoolCultureGenerator`, `SchoolTraditionsGenerator`, `SchoolPartnershipGenerator`, `WorkProgramAssembler`.
- [x] Раздел «Уклад школы» автоматически собирается из паспорта школы, воспитательной системы, объединений, инфраструктуры, партнеров, мероприятий, КПВР и внеурочной деятельности.
- [x] Реализованы подразделы: общая характеристика, воспитательная среда, объединения, традиции, социальное партнерство, контингент обучающихся.
- [x] Добавлен алгоритм определения традиций по событиям, приоритету, школьным делам и КПВР.
- [x] Добавлен редактор абзацев: редактирование, удаление, добавление, восстановление автоматически сформированного текста.
- [x] Добавлена прозрачность источников для каждого абзаца.
- [x] Добавлена пересборка раздела с созданием новой версии.
- [x] Добавлен просмотр и восстановление предыдущих версий.
- [x] Добавлен экспорт DOCX и печать/сохранение PDF через браузер.
- [x] Добавлено хранение `WorkProgram` в `AppState` и Supabase-таблице `work_programs`.

Архитектурные решения:

- Текст не является первичным источником: базовая версия всегда пересобирается из данных системы.
- Пользовательские правки хранятся на уровне `GeneratedParagraph` со статусами `edited`, `added`, `removed`.
- Источники генерации представлены структурой `GenerationSource`, поэтому можно показывать происхождение каждого абзаца и позже использовать это для AI-пояснений.
- Генераторы реализованы через интерфейсы, чтобы rule-based генерацию можно было заменить OpenAI, YandexGPT или GigaChat без изменения UI.
- `WorkProgramAssembler` отвечает за сборку полной программы и уже содержит каркас будущих разделов: целевой, содержательный, организационный, КПВР и приложения.

Следующие шаги:

- [ ] Добавить целевой раздел рабочей программы.
- [ ] Добавить содержательный раздел с модульной структурой.
- [ ] Добавить организационный раздел.
- [ ] Добавить полноценный PDF-экспорт без диалога печати.
- [ ] Добавить diff-просмотр изменений между версиями.
## Stage 13.2: Full Work Program

Current stage: full work program model has been expanded from the first "School culture" engine into the central document architecture.

Done:

- [x] Added full domain entities: `WorkProgramSource`, `WorkProgramSubsection`, `WorkProgramProgress`, `GeneratedContent`, section-level versions.
- [x] Added full program structure: target, content, organizational, KPVR and appendices sections.
- [x] Added target section scaffolding for NОО, ООО and СОО goals and target orientations.
- [x] Added dynamic content generation by active education modules, events, KPVR, extracurricular activities, associations and partners.
- [x] Added organizational section scaffolding: staffing, normative-methodical support, work conditions, encouragement, analysis.
- [x] Preserved editable "School culture" section and connected it to the full program source map.
- [x] Added readiness progress for the whole program, sections and subsections.
- [x] Added per-paragraph source map for transparency and future AI explanations.
- [x] Added section-level version history and restore path.
- [x] Reworked DOCX export to export the full work program, not only school culture.
- [x] Kept PDF as print/export architecture path.
- [x] Added localStorage and Supabase normalization for older saved `WorkProgram` data.

Architectural decisions:

- Text remains generated from `AppState`; manual text edits are supported only as paragraph-level overrides.
- The UI depends on `WorkProgramAssembler`, not on a concrete AI provider.
- Rule-based generators implement the current behavior and can later be replaced by OpenAI, GigaChat or YandexGPT adapters without changing the page contract.
- Section progress is computed from data availability and review requirements, so the document can show honest readiness instead of pretending to be complete.

Next steps:

- [ ] Add real target-orientation catalogs by education level and direction of upbringing.
- [ ] Add a visual diff between section versions.
- [ ] Add native PDF generation instead of browser print.
- [ ] Add review workflow: "accepted by deputy", "requires methodist review", "ready for approval".
- [ ] Add AI generator adapters behind the existing `SectionGenerator` and `WorkProgramAssembler` contracts.
## Stage 14: Normative Center

Current stage: added the rule-based Normative Center for tracking regulatory documents and checking the work program against selected sources.

Done:

- [x] Added page `/normative-documents`.
- [x] Added menu item "Нормативные документы".
- [x] Added domain types: `NormativeDocument`, `NormativeRequirement`, `NormativeDocumentComparison`, `WorkProgramComplianceResult`, `WorkProgramDiscrepancy`, `NormativeRecommendation`.
- [x] Added rule-based service `NormativeDocumentAnalyzer`.
- [x] Added upload metadata flow for federal, regional, municipal and local documents.
- [x] Added actuality statuses: current, needs review, outdated.
- [x] Added document comparison mode: added, removed, changed.
- [x] Added work program check against the work program, KPVR and educational system.
- [x] Added recommendation architecture with source document and target section.
- [x] Added `normativeDocuments` to `AppState`, localStorage migration and Supabase repository sync.
- [x] Added Supabase table `normative_documents` with JSONB requirements.

Architectural decisions:

- The current analyzer is rule-based and works through the `NormativeDocumentAnalyzer` interface.
- File contents are not parsed yet; requirements are inferred from document category and can later be replaced by AI extraction.
- Normalized requirements are stored separately from uploaded file metadata so future OpenAI, GigaChat or YandexGPT analyzers can add richer structures without rewriting the UI.
- The check result is computed from current `AppState`, so recommendations react to changes in work program, KPVR, events and educational system.

Next steps:

- [ ] Add text extraction from DOCX/PDF/XLSX.
- [ ] Add manual editing of extracted normative requirements.
- [ ] Add version diff with exact paragraph-level changes.
- [ ] Add AI analyzer adapter behind `NormativeDocumentAnalyzer`.
- [ ] Feed accepted normative requirements into the work program generator.
## Stage 15: Production-Ready Document Engine

Current stage: created the `document-processing` domain as the foundation for AI-ready document workflows without using external LLMs.

Done:

- [x] Added page `/document-processing`.
- [x] Added menu item "Документный движок".
- [x] Added unified model `NormalizedDocument`.
- [x] Added processing records and logs to `AppState`.
- [x] Added `DocumentStorageLayer` with browser storage and IndexedDB persistence path.
- [x] Added `DocumentTextExtractor` implementations for DOCX, PDF and XLSX.
- [x] Added `DocumentStructureExtractor` for sections, tables, lists and appendices.
- [x] Added `DocumentNormalizer`.
- [x] Added `DocumentValidator` with `Excellent`, `Good`, `Needs Review`, `Invalid`, `Requires OCR`.
- [x] Added `DocumentAnalysisPreparation` for future AI payloads.
- [x] Added interfaces: `DocumentAIAnalyzer`, `NormativeAIAnalyzer`, `WorkProgramAIAnalyzer`, `EventAIAnalyzer`.
- [x] Added processing log visible to the user.
- [x] Added manual confirmation: processed data does not update KPVR, work program or normative center automatically.
- [x] Added security checks for extension, MIME type and 50 MB size limit.
- [x] Added Supabase `document_processing_state` table for processing index/logs.
- [x] Added QA scenarios in `docs/document-processing-test-scenarios.md`.

Architectural decisions:

- File storage, text extraction, structure extraction, normalization, validation and AI preparation are separate services.
- Business logic is outside UI; the page calls only the pipeline.
- Scanned PDFs are detected and marked `requires_ocr`; the system does not fake text analysis.
- Heavy file content is not mixed into normative documents, KPVR or work-program models.
- AI contracts are defined but not implemented; no OpenAI, GigaChat, YandexGPT or external LLM is called.

Next steps:

- [ ] Add real OCR adapter behind a separate OCR interface.
- [ ] Persist full normalized documents in object storage or a dedicated Supabase table with size controls.
- [ ] Add worker-based processing for very large files to improve UI responsiveness further.
- [ ] Add manual mapping from confirmed normalized sections to KPVR, normative requirements and work-program sections.
- [ ] Add AI adapters after user confirmation and policy review.
## Stage 16.1: Federal Knowledge Base

Current stage: created the read-only `federal-knowledge` domain as the basis for checking the work program against federal requirements.

Done:

- [x] Added domain folder `lib/domain/federal-knowledge`.
- [x] Added types: `FederalDirection`, `FederalProgramSection`, `FederalRequirement`, `FederalTargetResult`, `FederalKnowledgeBase`.
- [x] Added federal directions of upbringing.
- [x] Added mandatory work-program section reference with presence and completeness criteria.
- [x] Added target-result reference for НОО, ООО and СОО.
- [x] Added page `/federal-knowledge`.
- [x] Added filters by education level and search by target results.
- [x] Added menu item "Федеральная база знаний".

Architectural decisions:

- Federal knowledge is static reference data and is not stored in `AppState`.
- The domain does not duplicate user-defined education modules or work-program sections.
- `work-program` is not rewritten; future checks can consume this knowledge base through imports.
- No OpenAI, GigaChat, YandexGPT or other LLM is used.

Next steps:

- [ ] Add a checker that maps `FederalProgramSection` criteria to generated `WorkProgram` sections.
- [ ] Add target-result coverage report by education level and direction.
- [ ] Connect confirmed normative requirements from the Normative Center to the federal knowledge checks.

## Stage 16.2: Work Program Compliance Checker

Current stage: added a rule-based checker that validates the existing `work-program` domain against the federal knowledge base.

Done:

- [x] Added `WorkProgramComplianceChecker` service in `lib/domain/federal-knowledge`.
- [x] Added compliance types: `ComplianceCheck`, `ComplianceIssue`, `ComplianceRecommendation`, `ComplianceSeverity`, `ComplianceStatus`.
- [x] Added section, direction and target-result coverage models.
- [x] Implemented checks for mandatory sections, section completeness, eight upbringing directions, target results, KPVR linkage and educational-system linkage.
- [x] Checker works with empty, partial and missing input data without UI dependencies.
- [x] `npm.cmd run lint` passes.
- [x] `npm.cmd run build` passes.

Architectural decisions:

- The checker consumes the existing `WorkProgram`; no duplicate work-program module is introduced.
- Federal knowledge remains a read-only reference domain.
- Every issue carries severity, location, rationale, source requirement and recommendation.
- The checker is rule-based and can later be wrapped by AI-assisted analyzers without changing UI contracts.

Next steps:

- [ ] Add a UI report for compliance results in the work-program or federal-knowledge section.
- [ ] Add unit tests for empty, partial and complete work-program scenarios.
- [ ] Connect the checker to Normative Center recommendations.

## Stage 16.3: Compliance Check Screen

Current stage: added a user-facing compliance-check screen that consumes `WorkProgramComplianceChecker` without duplicating rule logic in UI.

Done:

- [x] Added page `/compliance-check`.
- [x] Added menu item "Проверка соответствия".
- [x] Displayed overall compliance percent and human-readable status.
- [x] Added check blocks for mandatory sections, upbringing directions, target results, KPVR linkage and educational-system reflection.
- [x] Added issue list with severity, location, source requirement and recommendation.
- [x] Added filters for all, high, medium and low severity issues.
- [x] Added actions: recheck, open work program, open KPVR, copy recommendations.
- [x] `npm.cmd run lint` passes.
- [x] `npm.cmd run build` passes.
- [x] Smoke check of `/compliance-check` returns HTTP 200 without application error.

Architectural decisions:

- UI does not perform compliance rules; it only renders `ComplianceCheck`.
- Recommendations are copied from checker output, not regenerated on the client.
- Navigation actions use existing routes `/work-program` and `/kpvr`.
- The screen is ready to receive future AI-assisted checker output through the same `ComplianceCheck` contract.

Next steps:

- [ ] Add persistent check history.
- [ ] Add deep links from issues to exact work-program subsections.
- [ ] Add automated tests for filters and recommendation copying.

## Stage 16.4: Production Compliance Check Hardening

Current stage: hardened the federal compliance-check module for first user demos and internal QA.

Done:

- [x] Added unit tests for `WorkProgramComplianceChecker`.
- [x] Covered empty, partial and complete work-program scenarios.
- [x] Covered missing upbringing directions, KPVR linkage, educational-system reflection, target results and appendices.
- [x] Added `ComplianceCheckHistory` and saved check snapshots in `AppState`.
- [x] Added check history block with score, issue counts and score delta.
- [x] Added deep-link target fields to every compliance issue.
- [x] Added "Go to fix" actions for issues and priority actions.
- [x] Added appendices checks: KPVR, extracurricular plan, modules, partners and educational system.
- [x] Added normative actuality checks for federal work program, federal calendar plan, outdated documents and documents needing review.
- [x] Added priority actions and short fix plan with copy action.
- [x] `npm.cmd run test` passes.
- [x] `npm.cmd run lint` passes.
- [x] `npm.cmd run build` passes.
- [x] Smoke checks for `/compliance-check`, `/work-program` and `/kpvr` return HTTP 200 without application error.

Architectural decisions:

- UI still renders checker output only; compliance rules remain inside `WorkProgramComplianceChecker`.
- Compliance history is stored in the common state and persisted with the work-program JSON payload in the Supabase data layer.
- Deep links are part of `ComplianceIssue`, so future AI checkers can provide the same navigation contract.
- Tests use the built-in TypeScript compiler and Node runtime to avoid adding test dependencies.

Next steps:

- [ ] Add browser-level tests for filters, copy actions and deep-link navigation.
- [ ] Add exact subsection anchors inside `/work-program`.
- [ ] Add AI-assisted explanation layer after policy and provider selection.

## Stage 16.5: Pilot Readiness

Current stage: prepared the product for a first real-school pilot without adding new large modules, AI analyzers, chats or generators.

Done:

- [x] Added `SchoolReadinessChecker`.
- [x] Added page `/launch-readiness`.
- [x] Added menu item "Подготовка к запуску".
- [x] Added readiness checks for school passport, educational system, KPVR, work program and normative base.
- [x] Added filled/not-filled lists and blockers that prevent document generation.
- [x] Fixed main navigation labels so pilot users do not see broken Cyrillic in the sidebar.
- [x] Audited the core user path: school passport, educational system, events, KPVR, work program, normative center and compliance check.
- [x] `npm.cmd run test` passes.
- [x] `npm.cmd run lint` passes.
- [x] `npm.cmd run build` passes.
- [x] Smoke checks for `/launch-readiness`, `/school-passport`, `/educational-system`, `/events`, `/kpvr`, `/work-program`, `/normative-documents` and `/compliance-check` return HTTP 200 without application error.

Architectural decisions:

- Launch readiness is a domain service, not page-level logic.
- The readiness page consumes `SchoolReadinessCheck` only and links users to existing sections.
- No new large product module was introduced; the page is a pilot-control view over existing data.
- The checker is intentionally rule-based and can later consume richer compliance, normative and document-processing signals.

Next steps before school pilot:

- [ ] Add seeded demo data for a realistic school case.
- [ ] Add field-level anchors for direct fixes from readiness and compliance screens.
- [ ] Add short onboarding checklist for the deputy director workflow.

## Stage 16.6: First Launch Wizard and Demo School

Current stage: improved the first five minutes of the product without adding large new modules, AI analyzers, chat or generators.

Done:

- [x] Added `DemoSchoolFactory`.
- [x] Added a first-launch wizard to the dashboard.
- [x] Added "Create your school" flow through an empty school state.
- [x] Added "Load demo school" flow.
- [x] Added "Reset demo data" action.
- [x] Added quick templates: urban school, rural school, cadet school and volunteer-focused school.
- [x] Added realistic demo data: school passport, educational system, volunteer team, museum, partners, events, KPVR, extracurricular programs, work program and normative documents.
- [x] Added first-use hints: what to fill first, what KPVR needs and what the work program needs.
- [x] Reworked the dashboard into a 5-minute demo route.
- [x] `npm.cmd run test` passes.
- [x] `npm.cmd run lint` passes.
- [x] `npm.cmd run build` passes.
- [x] Fresh dev-server smoke checks for `/`, `/launch-readiness`, `/kpvr`, `/work-program` and `/compliance-check` return HTTP 200 without application error.

Architectural decisions:

- Demo data generation is isolated in `DemoSchoolFactory`.
- The wizard updates the existing `AppState`; no new large module or storage layer was introduced.
- Demo work program is assembled by the existing `WorkProgramAssembler`.
- Readiness and compliance screens consume the same state as real schools, so the demo exercises the real product flow.

Next steps before school demonstration:

- [ ] Add a visible "demo mode" badge when a demo template is loaded.
- [ ] Add field-level anchors for the most common first-launch fixes.
- [ ] Add browser-level test for loading a demo template and opening KPVR/work-program.

## Stage 17.1: Unified School Planning Core

Current stage: created the normalized activity-direction foundation for future school plans without adding separate prevention, DDTT, museum, volunteer or parent-work plan modules.

Done:

- [x] Added `activity-directions` domain.
- [x] Added entities: `ActivityDirection`, `ActivityDirectionGroup`, `ActivityDirectionCategory`, `EventDirectionRelation`, `DirectionStatistics`.
- [x] Added the standard expandable direction catalog with prevention, DDTT, safety, upbringing, communities, school resources and support directions.
- [x] Added user-created custom activity directions.
- [x] Added normalized many-to-many relation between events and activity directions.
- [x] Migrated existing events into direction relations from their current text direction, title and description.
- [x] Added activity-direction data to `AppState`, localStorage migration, Supabase state persistence and demo-school generation.
- [x] Updated event card with multi-select direction choice, search-like filtering through the selector, and quick custom direction creation.
- [x] Updated event registry with direction badges, direction filter and direction statistics.
- [x] Kept KPVR, work program, extracurricular activities, educational system and compliance check compatible with the existing `SchoolEvent` contract.
- [x] `npm.cmd run test` passes.
- [x] `npm.cmd run lint` passes.
- [x] `npm.cmd run build` passes.
- [x] Smoke checks for `/events`, `/kpvr`, `/work-program` and `/compliance-check` return HTTP 200 without application error on `localhost:3000`.

Architectural decisions:

- `SchoolEvent` remains the single source of the event card; direction membership is stored separately in `EventDirectionRelation`.
- One event can belong to any number of activity directions, which prevents duplicate event records in future plans.
- Direction statistics are generated from relations and events, not stored as mutable state.
- Standard directions are seed data; custom directions are user data and remain compatible with future Supabase tables.
- Future plan generators should consume `ActivityDirection` + `EventDirectionRelation` instead of filtering by free-text event fields.

Next steps for Stage 17.2:

- [x] Create read-only plan projections by activity direction.
- [x] Add a universal plan builder instead of dedicated plan entities.
- [x] Add route-level view for generated plan projections.
- [ ] Add browser-level tests for selecting multiple directions and filtering the registry.

## Stage 17.2: Universal School Activity Plan Engine

Current stage: created a universal plan engine that builds school activity plans as projections over `SchoolEvent` and `EventDirectionRelation`.

Done:

- [x] Added activity-plan entities: `ActivityPlan`, `ActivityPlanTemplate`, `ActivityPlanSection`, `ActivityPlanProjection`, `ActivityPlanExportOptions`, `ActivityPlanStatistics`, `ActivityPlanFilter`.
- [x] Added services: `ActivityPlanBuilder`, `ActivityPlanExporter`, `ActivityPlanStatisticsService`, `ActivityPlanFilterService`.
- [x] Added extensible plan templates for all-school activity plan, prevention, DDTT, ЮИД, school museum, volunteer team, Movement of the First, self-government, parent work, career guidance and healthy lifestyle.
- [x] Added grouping modes: by month, quarter, module, education level, responsible person, direction and no grouping.
- [x] Added filters by education level, class, month, responsible person, status, activity direction and education module.
- [x] Added page `/activity-plans`.
- [x] Added menu item "Планы деятельности".
- [x] Added direction list with event counts.
- [x] Added plan preview with goal, tasks, sections and event table.
- [x] Added analytics: total events, completion percent, completed events, overdue events, monthly counts and direction coverage.
- [x] Added browser-side DOCX export for generated activity plans.
- [x] Kept events as the only source of event data; no plan-specific event copies are created.
- [x] `npm.cmd run test` passes.
- [x] `npm.cmd run lint` passes.
- [x] `npm.cmd run build` passes.
- [x] Smoke checks for `/activity-plans`, `/events`, `/kpvr`, `/work-program` and `/compliance-check` return HTTP 200 without application error.

Architectural decisions:

- A plan is a projection, not persisted duplicate data.
- Direction membership is resolved through `EventDirectionRelation`.
- `ActivityPlanTemplate` configures titles, goals and tasks; it does not create separate plan classes.
- `ActivityPlanBuilder` owns plan assembly; UI renders only the returned `ActivityPlan`.
- DOCX export consumes `ActivityPlan`, so future PDF/report exports can reuse the same projection.

Next steps for Stage 17.3:

- [x] Add a management matrix over directions and activity segments.
- [x] Add risk analysis for empty directions, empty periods, overloads and missing coverage.
- [x] Add a balance index for activity planning.
- [ ] Add saved user presets for common plan templates.
- [ ] Add print/PDF export over the same `ActivityPlan` contract.
- [ ] Add browser tests for matrix cell drill-down and route-level filtering.

## Stage 17.3: School Upbringing Activity Matrix

Current stage: added a management matrix that helps the deputy director find gaps, overloads and coverage risks across the school activity system.

Done:

- [x] Added route `/activity-matrix`.
- [x] Added menu item "Матрица воспитательной деятельности".
- [x] Added entities: `ActivityMatrix`, `ActivityMatrixRow`, `ActivityMatrixColumn`, `ActivityMatrixCell`, `ActivityMatrixAnalysis`, `ActivityMatrixRisk`, `ActivityMatrixRecommendation`, `ActivityMatrixBalanceIndex`.
- [x] Added `ActivityMatrixAnalyzer`.
- [x] Built direction-by-month heat map.
- [x] Added matrix modes: months, quarters, education levels, classes, responsible people and education modules.
- [x] Added click-through cell drill-down with event list.
- [x] Added risk detection: empty directions, weak directions, empty columns, overloaded columns, uncovered education levels and uncovered classes.
- [x] Added balance index from 0 to 100 with statuses: excellent, good, needs attention and critical.
- [x] Added top-10 recommendations.
- [x] Added strong-zone summary for well-covered directions.
- [x] Kept matrix calculations as projections over events and direction relations; no duplicate event storage is introduced.
- [x] `npm.cmd run test` passes.
- [x] `npm.cmd run lint` passes.
- [x] `npm.cmd run build` passes.
- [x] Smoke checks for `/activity-matrix`, `/activity-plans`, `/events`, `/kpvr`, `/work-program` and `/compliance-check` return HTTP 200 without application error.

Architectural decisions:

- `ActivityMatrixAnalyzer` is UI-independent and can feed future reports, readiness checks and AI recommendations.
- The matrix reads `SchoolEvent`, `ActivityDirection`, `EventDirectionRelation` and education modules; it does not persist derived analytics.
- Risk rules are deterministic and transparent, so deputy directors can understand why each recommendation appears.
- Heat-map intensity is calculated from current matrix values, not from hard-coded thresholds.

Next steps:

- [ ] Add saved matrix views for deputy directors.
- [ ] Add export of matrix and risk report to DOCX/PDF.
- [ ] Connect balance risks to `/activity-plans` and `/events` with deep links.
- [ ] Add tests for matrix calculations on empty and overloaded datasets.

## Stage 17.4: Analytics Center and School Reporting Engine

Current stage: added a unified reporting engine for the deputy director without creating separate report entities for DDTT, prevention, museum, volunteer work or parent work.

Done:

- [x] Added `activity-reports` domain.
- [x] Added route `/activity-reports`.
- [x] Added menu item "Отчеты".
- [x] Added entities: `ActivityReport`, `ActivityReportTemplate`, `ActivityReportSection`, `ActivityReportProjection`, `ActivityReportStatistics`, `ActivityReportFilter`, `ActivityReportExportOptions`, `ActivityReportInsight`, `ActivityReportRisk`, `ActivityReportRecommendation`.
- [x] Added services: `ActivityReportBuilder`, `ActivityReportAnalyzer`, `ActivityReportStatisticsService`, `ActivityReportExporter`, `ActivityReportRecommendationEngine`, `ActivityReportRiskAnalyzer`.
- [x] Added AI-ready contracts: `ReportAIAnalyzer`, `ReportNarrativeGenerator`, `ReportRecommendationAI`.
- [x] Added reporting modes: month, quarter, half-year, academic year and custom period.
- [x] Added automatic report generation for all directions through one `directionId` filter.
- [x] Added KPI block: total events, completed, cancelled, overdue, class coverage, student coverage, direction coverage, plan completion, average events per class and average events per direction.
- [x] Added rule-based insights, risks and recommendations.
- [x] Added deputy-director dashboard block: done, not done, risks, recommendations and report event tables.
- [x] Added DOCX export.
- [x] Added PDF flow through browser print.
- [x] Kept reports as projections over `SchoolEvent`, `EventDirectionRelation`, `ActivityPlanBuilder` and `ActivityMatrixAnalyzer`; no event copies are stored.
- [x] `npm.cmd run test` passes.
- [x] `npm.cmd run lint` passes.
- [x] `npm.cmd run build` passes.
- [x] Smoke checks for `/activity-reports`, `/activity-plans`, `/activity-matrix`, `/events`, `/kpvr`, `/work-program` and `/compliance-check` return HTTP 200 without application error.

Architectural decisions:

- `ActivityReportBuilder` composes existing plan and matrix engines instead of reimplementing their logic.
- Report sections split completed and not-completed events without creating new event records.
- Risk and recommendation logic is deterministic and transparent, ready for later AI explanation layers.
- AI contracts are declared but not implemented, preserving the no-LLM rule for this stage.

Next steps:

- [ ] Add unit tests for `ActivityReportBuilder` and `ActivityReportRiskAnalyzer`.
- [ ] Add deep links from report risks to `/events`, `/activity-plans` and `/activity-matrix`.
- [ ] Add saved report presets for common administrative reports.
- [ ] Add comparison with previous period after historical snapshots are introduced.

## Stage 17.5: Event Execution Control System

Current stage: added a lifecycle control layer for events without copying events into reporting-specific entities.

Done:

- [x] Added `event-execution` domain.
- [x] Added route `/event-execution`.
- [x] Added menu item "Контроль исполнения".
- [x] Added entities: `EventExecution`, `EventExecutionStatus`, `EventExecutionProgress`, `EventExecutionEvidence`, `EventExecutionComment`, `EventExecutionHistory`, `EventExecutionReminder`, `EventExecutionRisk`.
- [x] Added lifecycle statuses: draft, planned, assigned, in progress, completed, confirmed, included in reporting, cancelled, overdue.
- [x] Added execution migration from existing `SchoolEvent` status and dates.
- [x] Added execution persistence in `AppState`; Supabase compatibility is preserved through the existing JSON state payload.
- [x] Added execution dashboard: total, planned, in work, completed, confirmed, overdue, cancelled.
- [x] Added filters by status, month, activity direction, responsible person, education level and class.
- [x] Added event execution card with status, progress, actual date, responsible people, comments, evidence links, risks and history.
- [x] Added evidence architecture for photos, orders, reports, links and files; current UI supports link metadata without file storage.
- [x] Added `EventExecutionRiskAnalyzer`.
- [x] Added risks: overdue event, no responsible person, no confirmation, no results, no evidence.
- [x] Added execution KPI: completion percent, confirmed percent, overdue percent and percent without responsible.
- [x] Updated activity reports to use execution data for completion, overdue and confirmation KPI.
- [x] Added tests for execution migration, status update, statistics and risk detection.
- [x] `npm.cmd run test` passes.
- [x] `npm.cmd run lint` passes.
- [x] `npm.cmd run build` passes.
- [x] Smoke checks for `/event-execution`, `/activity-reports`, `/activity-plans`, `/activity-matrix`, `/events`, `/kpvr`, `/work-program` and `/compliance-check` return HTTP 200 without application error.

Architectural decisions:

- `SchoolEvent` remains the only event card; `EventExecution` is a normalized lifecycle record keyed by `eventId`.
- Execution status synchronizes back to the existing event status for compatibility with KPVR, plans, matrix and reports.
- Evidence is metadata-only at this stage; file storage can later be connected without changing the execution card contract.
- Reminders are modeled but not sent; notification delivery can be added later through the same entity.

Next steps:

- [ ] Add Supabase table `event_executions` or explicit JSON column migration for production persistence.
- [ ] Add file storage for execution evidence.
- [ ] Add reminder delivery through email, Telegram or in-app notifications.
- [ ] Add deep links from report and matrix risks to execution cards.

## Stage 17.6: Inspection Center and Document Packages

Current stage: added a school inspection preparation center that builds readiness, gaps, risks, checklists and document packages from existing events, execution, plans, reports and analytics.

Done:

- [x] Added `inspection-center` domain.
- [x] Added routes `/inspection-center` and `/document-packages`.
- [x] Added menu items "Центр проверок" and "Пакеты документов".
- [x] Added entities: `InspectionScenario`, `InspectionRequirement`, `InspectionReadiness`, `InspectionPackage`, `InspectionPackageSection`, `InspectionPackageItem`, `InspectionChecklist`, `InspectionGap`, `InspectionRisk`, `InspectionRecommendation`, `InspectionEvidence`.
- [x] Added services: `InspectionCenter`, `InspectionPackageBuilder`, `InspectionReadinessAnalyzer`, `InspectionGapAnalyzer`, `InspectionChecklistBuilder`, `InspectionRiskAnalyzer`, `InspectionExporter`.
- [x] Added AI-ready contracts: `InspectionAIAnalyzer`, `InspectionRecommendationAI`, `InspectionReadinessAI`.
- [x] Added predefined scenarios: school self-audit, DDTT, offense prevention, school museum, Movement of the First, volunteer team, parent work, internal deputy-director control and municipal monitoring.
- [x] Added readiness score from 0 to 100.
- [x] Added quality checks for plans, reports, confirmed events, KPVR, work program, matrix balance and normative base.
- [x] Added source tracing for package items and evidence.
- [x] Added automatic checklist: ready, needs work and missing.
- [x] Added gap analysis and prioritized recommendations.
- [x] Added DOCX export for inspection packages.
- [x] Added PDF flow through browser print.
- [x] Added tests for empty school readiness, demo package generation and all predefined scenarios.
- [x] `npm.cmd run test` passes.
- [x] `npm.cmd run lint` passes.
- [x] `npm.cmd run build` passes.
- [x] Smoke checks for `/inspection-center`, `/document-packages`, `/event-execution`, `/activity-reports`, `/activity-plans`, `/activity-matrix`, `/kpvr`, `/work-program` and `/compliance-check` return HTTP 200 without application error.

Architectural decisions:

- Inspection packages are projections, not copied documents.
- `InspectionPackageBuilder` composes existing plan, report, matrix, execution and compliance services.
- Source tracing is part of `InspectionEvidence`, so every package item can show its origin.
- AI contracts are declared only; rule-based logic remains the active implementation.

Next steps:

- [ ] Add deep links from every package item to the exact source page and filter.
- [ ] Add saved inspection package snapshots after document versioning is introduced.
- [ ] Add ZIP export when file storage is available.
- [ ] Add school-specific thresholds for municipal monitoring scenarios.

## Demo Distribution

Current stage: added a public-demo entry point for social sharing and first product presentation.

Done:

- [x] Added route `/demo`.
- [x] The route loads the realistic urban demo school automatically.
- [x] The route gives fast links to the dashboard, KPVR, work program and inspection center.
- [x] Local smoke checks for `/demo`, `/`, `/kpvr`, `/work-program` and `/inspection-center` return HTTP 200 without application error.
- [x] `npm.cmd run test` passes.
- [x] `npm.cmd run lint` passes.
- [x] `npm.cmd run build` passes.

Architectural decisions:

- Demo data is generated through the existing `DemoSchoolFactory`, not duplicated in the UI.
- The public demo is stored in the visitor browser state when no Supabase environment is configured.
- The demo route is isolated from production data entry routes and can be used as a share target after deployment.

Next steps:

- [ ] Deploy `/demo` to Vercel after refreshing the Vercel account token.
- [ ] Add a branded public landing header if social traffic grows.

## Stage 17.7.2: Mobile First Product Readiness

Current stage: adapted the first-contact and core product routes for mobile use from messengers and social links.

Done:

- [x] Added mobile-first shell spacing and protected the app from body-level horizontal overflow.
- [x] Reworked `Sidebar` into responsive navigation with hamburger menu on mobile.
- [x] Added mobile menu overlay, outside-click close, Escape close, route-change close, body scroll lock and active route highlighting.
- [x] Increased default button, input, select and textarea touch targets for phone use.
- [x] Added `ResponsiveDisclosure` for mobile filter panels.
- [x] Adapted filters on `/activity-plans`, `/activity-reports` and `/event-execution` into collapsible mobile blocks.
- [x] Added mobile card views for КПВР rows on `/kpvr`.
- [x] Added mobile card views for activity plan rows on `/activity-plans`.
- [x] Added mobile card views for report event rows on `/activity-reports`.
- [x] Added mobile card view for nearest events on `/`.
- [x] Adjusted `/demo` and `/demo-showcase` full-bleed backgrounds so they do not exceed mobile viewport width.
- [x] Smoke checked first- and second-priority routes on local dev server.
- [x] `npm.cmd run lint` passes during implementation.

Architectural decisions:

- Mobile navigation is implemented inside the existing `Sidebar` component; no duplicate mobile app or alternate route tree was introduced.
- Tables remain available on desktop, while the highest-risk document tables render as semantic mobile cards below `md`.
- Filters use native `details` through `ResponsiveDisclosure`, avoiding heavy UI libraries and keeping desktop behavior expanded.
- Touch-target improvements were made in base UI primitives to improve all forms without editing every form field manually.

Known technical debt:

- Next.js dev mode still warns that parts of `mockAppState` are not plain serializable values when passed from server layout to the client provider. Production build is not blocked, but this should be normalized in a future data-initialization cleanup.
- Full visual QA at exact widths 320, 360, 375, 390, 414, 768 and 1024 still needs browser screenshots after the in-app browser runner is available.

Next steps:

- [ ] Add screenshot-based mobile regression checks for the public demo flow.
- [ ] Convert remaining low-priority dense tables in `/events`, `/import-documents` and `/extra-activities` to mobile cards.
- [ ] Normalize `mockAppState` serialization before passing it into `AppProvider`.
- [ ] Add quick-action mobile shortcuts for КПВР, reports, inspections and work program in the mobile menu header.
