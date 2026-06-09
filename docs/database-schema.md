# Supabase Database Schema

Проект переведен с `localStorage` на Supabase через слой `lib/data-access`.
Компоненты не обращаются к Supabase напрямую: они продолжают работать через `AppProvider` и репозитории.

## Настройка

1. Создайте проект в Supabase.
2. Выполните SQL из файла `supabase/schema.sql` в Supabase SQL Editor.
3. Создайте `.env.local` по примеру `.env.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

4. Перезапустите dev-сервер Next.js.

Если переменные окружения не заданы, приложение покажет ошибку Supabase в верхней части интерфейса.

## Таблицы

### schools

Паспорт школы. Хранит общие сведения, учебный год, количество обучающихся, количество классов и JSON-поле `infrastructure`.

Ключевые поля:

- `id text primary key`
- `name text`
- `region text`
- `municipality text`
- `address text`
- `principal text`
- `deputy_director text`
- `academic_year text`
- `students_count integer`
- `classes_count integer`
- `infrastructure jsonb`

### partners

Социальные партнеры из паспорта школы.

Ключевые поля:

- `id text primary key`
- `school_id text references schools(id)`
- `name text`
- `type text`
- `activity text`

### modules

Справочник модулей воспитания.

Ключевые поля:

- `id text primary key`
- `school_id text references schools(id)`
- `title text`
- `description text`
- `active boolean`

### events

Реестр мероприятий и конкурсов.

Ключевые поля:

- `id text primary key`
- `school_id text references schools(id)`
- `title text`
- `description text`
- `module_id text`
- `direction text`
- `education_levels text[]`
- `classes text`
- `start_date date`
- `end_date date`
- `month integer`
- `venue text`
- `responsible text`
- `co_executors text`
- `partner text`
- `association_id text`
- `infrastructure_object_id text`
- `system_partner_id text`
- `source_document_id text`
- `source_document_title text`
- `source_document_type text`
- `status text`
- `participants_count integer`
- `short_report text`
- `priority text`

### educational_associations

Воспитательные объединения школы: волонтерские отряды, музей, театр, медиацентр, ЮИД, Юнармия, Орлята России, Движение Первых, спортивный клуб и пользовательские объединения.

Ключевые поля:

- `id text primary key`
- `school_id text references schools(id)`
- `type text`
- `title text`
- `description text`
- `leader text`
- `participants_count integer`
- `classes text`
- `photo_url text`
- `status text`

### school_infrastructure_objects

Инфраструктура воспитательной работы: музей, медиацентр, актовый зал, спортивный зал, библиотека, центр детских инициатив, музейная комната, профильные кабинеты.

Ключевые поля:

- `id text primary key`
- `school_id text references schools(id)`
- `type text`
- `title text`
- `description text`
- `responsible text`

### educational_system_partners

Партнеры воспитательной системы для связи с мероприятиями и будущей генерации КПВР.

Ключевые поля:

- `id text primary key`
- `school_id text references schools(id)`
- `title text`
- `type text`
- `cooperation_description text`
- `contact_person text`

### imported_documents

Метаданные документов, загруженных пользователем для будущей обработки. На текущем этапе содержимое файла не сохраняется и не анализируется.

Ключевые поля:

- `id text primary key`
- `school_id text references schools(id)`
- `title text`
- `type text`
- `uploaded_at timestamptz`
- `size_bytes integer`
- `status text`

### extracted_events

Найденные мероприятия, извлеченные из импортированных документов. На текущем этапе заполняются mock-анализатором и не импортируются в основной реестр `events`.

Ключевые поля:

- `id text primary key`
- `school_id text references schools(id)`
- `title text`
- `description text`
- `date date`
- `month integer`
- `education_level text`
- `module text`
- `responsible text`
- `source_document_id text`

### work_programs

Рабочая программа воспитания. На этапе 13.1 хранит JSON-снимок доменной модели `WorkProgram`, включая раздел «Уклад школы», абзацы, источники генерации и версии.

Ключевые поля:

- `id text primary key`
- `school_id text references schools(id)`
- `data jsonb`
- `updated_at timestamptz`
- `source_type text`
- `confidence numeric`
- `status text`

### extracurricular_programs

Программы внеурочной деятельности и дополнительного образования.

Ключевые поля:

- `id text primary key`
- `school_id text references schools(id)`
- `title text`
- `type text`
- `area text`
- `education_levels text[]`
- `classes text`
- `teacher text`
- `classroom text`
- `schedule text`
- `weekly_hours numeric`
- `total_hours numeric`
- `students_count integer`
- `status text`

### staff

Справочник сотрудников. Сейчас заполняется автоматически из директора, заместителя, ответственных за мероприятия, соисполнителей и педагогов внеурочной деятельности.

Ключевые поля:

- `id text primary key`
- `school_id text references schools(id)`
- `full_name text`
- `role text`

## Архитектурные решения

- Строковые `id` сохранены намеренно: существующие модули имеют стабильные идентификаторы, которые уже используются в мероприятиях и КПВР.
- `education_levels` хранится как `text[]`, чтобы мероприятие или программа могли относиться сразу к НОО, ООО и СОО.
- Инфраструктура школы хранится в `schools.infrastructure` как `jsonb`, потому что это компактный набор boolean-флагов.
- Экспортные документы пока остаются конфигурацией приложения, так как пользователь не редактирует их как справочник.
- RLS не включена на MVP-этапе без авторизации. При добавлении авторизации нужно включить RLS и ограничить доступ по `school_id` и владельцу.
## normative_documents

Stores regulatory documents for the Normative Center.

- `id` text primary key
- `school_id` text references `schools.id`
- `title` text
- `category` text: federal work program, federal calendar plan, regional, municipal, local school document
- `level` text: federal, regional, municipal, local
- `document_date` date
- `version` text
- `source` text
- `actuality_status` text: current, needs_review, outdated
- `uploaded_at` timestamptz
- `file_name` text
- `file_type` text
- `size_bytes` integer
- `requirements` jsonb: normalized requirements extracted by rule-based or future AI analyzer

## document_processing_state

Stores the processing index and user-visible processing log. Heavy files stay in the document storage layer.

- `id` text primary key
- `school_id` text references `schools.id`
- `processed_documents` jsonb: confirmed document-processing records
- `logs` jsonb: processing log entries
- `updated_at` timestamptz
