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
- `status text`
- `participants_count integer`
- `short_report text`
- `priority text`

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
