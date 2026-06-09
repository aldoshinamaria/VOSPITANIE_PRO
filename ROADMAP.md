# ROADMAP: Воспитание.PRO

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
