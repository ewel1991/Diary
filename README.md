
# Aplikacja Notatki z Autoryzacją

Prosta aplikacja webowa do tworzenia, wyświetlania i usuwania notatek powiązanych z użytkownikiem. Zawiera system rejestracji i logowania, w tym logowanie przez Google OAuth2.

---

## Funkcjonalności

- Rejestracja i logowanie użytkownika (lokalne + Google OAuth2)
- Utrzymanie sesji użytkownika (express-session + passport)
- Tworzenie, wyświetlanie i usuwanie własnych notatek
- Notatki przechowywane w bazie PostgreSQL powiązanej z kontem użytkownika
- Interfejs w React, backend w Node.js/Express

---

## Technologie

- Frontend: React
- Backend: Node.js, Express, Passport.js
- Baza danych: PostgreSQL
- Autoryzacja: Passport lokalna oraz Google OAuth2
- Haszowanie haseł: bcrypt
- Sesje: express-session
- Komunikacja: REST API, JSON, cookies (credentials: include)

---

## Instalacja i uruchomienie

### Backend

1. Skonfiguruj bazę PostgreSQL i utwórz odpowiednie tabele (`users`, `notes`).

2. Stwórz plik `.env` z takimi zmiennymi:

```
PG_USER=twoj_user
PG_HOST=localhost
PG_DATABASE=twoja_baza
PG_PASSWORD=twoje_haslo
PG_PORT=5432

SESSION_SECRET=sekretny_klucz_sesji

GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=yyy
```

3. Zainstaluj zależności i uruchom backend:

```bash
npm install
node index.js
```

Backend działa pod http://localhost:3000

---

### Frontend

W katalogu frontend zainstaluj zależności:

```bash
npm install
npm start
```

Frontend działa domyślnie pod http://localhost:5173

---

## Struktura bazy danych (przykład)

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL
);

CREATE TABLE notes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT,
  deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## API

| Metoda | Endpoint    | Opis                                      |
| ------ | ----------- | ----------------------------------------- |
| POST   | /register   | Rejestracja użytkownika (email, password) |
| POST   | /login      | Logowanie użytkownika                     |
| POST   | /logout     | Wylogowanie                               |
| GET    | /me         | Sprawdzenie sesji użytkownika             |
| GET    | /notes      | Pobranie notatek zalogowanego użytkownika |
| POST   | /notes      | Dodanie nowej notatki                     |
| DELETE | /notes/:id  | Usunięcie notatki                         |

---

## Uwagi

- Autoryzacja i sesje oparte są o cookies (credentials: include).
- Logowanie przez Google wymaga konfiguracji OAuth2 w Google Cloud Console oraz poprawnego callback URL.
- Hasła są przechowywane w formie zaszyfrowanej (bcrypt).
- Notatki są dostępne tylko dla właściciela (autoryzacja po stronie backendu).

---

## Kontakt

W razie pytań lub sugestii proszę pisać na:  
ewelina.beben.programista@gmail.com
