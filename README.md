
# Aplikacja Notatek z Chatbotem Gemini AI

## Opis

To aplikacja webowa do zarządzania notatkami z funkcją logowania oraz chatbotem wykorzystującym model Google Gemini AI. Użytkownicy mogą się rejestrować i logować za pomocą emaila lub Google OAuth. Aplikacja pozwala na tworzenie, przeglądanie i usuwanie notatek oraz komunikację z chatbotem AI.

---

## Funkcjonalności

- Rejestracja i logowanie (email + hasło, Google OAuth)
- Autoryzacja sesyjna z Passport.js i express-session
- Bezpieczne przechowywanie haseł (bcrypt)
- Zarządzanie notatkami (tworzenie, wyświetlanie, usuwanie)
- Chatbot AI oparty o Google Gemini (model `gemini-2.5-flash`)
- Walidacja danych (email, hasło)
- Komunikacja frontend-backend z CORS i sesjami

---

## Technologie

- Backend: Node.js, Express.js
- Baza danych: PostgreSQL
- Autentykacja: Passport.js (LocalStrategy i Google OAuth2)
- Bezpieczeństwo: bcrypt, express-session
- AI: Google Generative AI (Gemini)
- Frontend: React.js (z funkcjami CRUD i chatbotem)
- Walidacja: validator.js

---

## Instalacja i uruchomienie

1. **Klonuj repozytorium**

```bash
git clone <URL_REPOZYTORIUM>
cd <nazwa-folderu>
```

2. **Zainstaluj zależności**

```bash
npm install
```

3. **Utwórz plik `.env` i uzupełnij zmienne środowiskowe:**

```
PG_USER=twoj_uzytkownik
PG_HOST=localhost
PG_DATABASE=twoja_baza
PG_PASSWORD=twoje_haslo
PG_PORT=5432

SESSION_SECRET=twoj_sekretny_klucz

GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx

GEMINI_API_KEY=twoj_klucz_api_gemini
```

4. **Uruchom backend**

```bash
npm start
```

Backend będzie dostępny pod adresem: `http://localhost:3000`

5. **Uruchom frontend (React)**

```bash
cd frontend-folder
npm install
npm run dev
```

Frontend działa domyślnie na `http://localhost:5173`

---

## Endpoints API

- `POST /register` – rejestracja użytkownika  
- `POST /login` – logowanie lokalne  
- `GET /me` – sprawdzenie statusu zalogowania  
- `POST /logout` – wylogowanie  
- `GET /notes` – pobranie notatek użytkownika (autoryzacja wymagana)  
- `POST /notes` – dodanie notatki (autoryzacja wymagana)  
- `DELETE /notes/:id` – usunięcie notatki (autoryzacja wymagana)  
- `POST /api/gemini` – wywołanie modelu Gemini AI (chatbot)  

---

## Użycie

Po rejestracji lub zalogowaniu, użytkownik może zarządzać swoimi notatkami oraz korzystać z chatbot’a Gemini, który odpowiada na wpisane pytania.

---

## Licencja

Projekt na licencji MIT.

