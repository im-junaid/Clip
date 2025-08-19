<div align="center">

# ![icon](https://raw.githubusercontent.com/im-junaid/Clip/refs/heads/main/doc/screenshots/icon.svg) Clip – Bookmark Manager
[![Stable Release](https://img.shields.io/badge/Stable-1.0-black?style=for-the-badge&logo=github)](https://github.com/im-junaid/Clip)

**Clip** is a full-stack bookmark manager built with **Django** (Python) and enhanced with AI. It lets users securely store and organize favorite website links, mobile apps, desktop apps, etc., in the form of bookmarks with minimal effort.

Featuring AI-powered content analysis, infinite scroll for seamless browsing. Bookmark with names, descriptions, URLs, tags, and import/export functionality while also providing an intuitive admin dashboard.

## 🛠️ Made With
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Django](https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![HTML](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

</div>

### 📸 Screenshots

| **Home** | **Signin** |
| :---: | :---: |
| ![Home page Screenshot](https://raw.githubusercontent.com/im-junaid/Clip/refs/heads/main/doc/screenshots/home_page.png) | ![Signin page Screenshot](https://raw.githubusercontent.com/im-junaid/Clip/refs/heads/main/doc/screenshots/signin_page.png) |
|  **Dashboard**  | **Profile** |
| ![Dashboard Page Screenshot](https://raw.githubusercontent.com/im-junaid/Clip/refs/heads/main/doc/screenshots/dashboard_page.png) | ![Profile Page Screenshot](https://raw.githubusercontent.com/im-junaid/Clip/refs/heads/main/doc/screenshots/profile_page.png) |

---

## ✨ Key Features

| Feature | Description | Status |
| :--- | :--- | :---: |
| **🤖 AI Auto-fill** | Automatically generates a bookmark's title, description, and tags from a URL using the Gemini API. | ✅ |
| **📜 Infinite Scroll** | Seamlessly browse all your bookmarks on the dashboard without clicking through pages. | ✅ |
| **✏️ Full CRUD** | Create, read, update, and delete bookmarks with ease. | ✅ |
| **🔍 Search & Filter** | Instantly find any bookmark with a powerful search and filtering system. | ✅ |
| **📂 Import / Export** | Easily back up or transfer your collection with JSON file import and export. | ✅ |
| **⚙️ Admin Dashboard** | A complete admin panel to manage all users and their bookmarks. | ✅ |

---

## 🛠️ Tech Stack

| Category | Technology |
| :--- | :--- |
| **Backend** | Python, Django |
| **Database** | PostgreSQL, SQLite3 (for development) |
| **Frontend** | HTML, Tailwind CSS, JavaScript |
| **AI Integration**| Google Gemini API |

---

## 🚀 Getting Started

Follow these steps to set up the project locally:

### Prerequisites

* Python 3.10+
* Git

### Installation

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/im-junaid/Clip.git
    cd Clip
    ```

2.  **Create a Virtual Environment:**
    ```bash
    python3 -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```

3.  **Install Dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
> 🔄 **Use SQLite (development only)**  
> In `clip/settings.py`, comment out the PostgreSQL `DATABASES` block and uncomment (or add) the SQLite configuration:
> ```
> DATABASES = {
>     'default': {
>         'ENGINE': 'django.db.backends.sqlite3',
>         'NAME': BASE_DIR / 'db.sqlite3',
>     }
> }
> ```
    > **Note:** If you are not using PostgreSQL, the project will default to using PostgreSQL.
    Optimized fast searching and filtering is not supported by SQLite3

4.  **Set Up Environment Variables:**
    Create a `.env` file in the project root and add the following:
    ```env
    DEBUG="True"
    SECRET_KEY="your-secret-key"
    ALLOWED_HOSTS="127.0.0.1,localhost"
    
    # Google Gemini API Key
    GEMINI_API_KEY="your-gemini-api-key"

    # Email settings (optional)
    EMAIL_HOST_USER=""
    EMAIL_HOST_PASSWORD=""

    # PostgreSQL DB (optional)
    DB_NAME=""
    DB_USER=""
    DB_PASSWORD=""
    DB_HOST=""
    DB_PORT=5432
    ```
5.  **Apply Migrations:**
    ```bash
    python manage.py makemigrations
    python manage.py migrate
    ```

6.  **Create Superuser (Admin Account):**
    ```bash
    python manage.py createsuperuser
    ```

7.  **Run the Development Server:**
    ```bash
    python manage.py runserver
    ```

    Visit: [http://127.0.0.1:8000](http://127.0.0.1:8000)

---

## 📦 Project Structure
```
├── accounts/         # User authentication & profile management
│   ├── static/       # (e.g., profile.js)
│   └── templates/    # (e.g., signin.html)
│
├── bookmark/         # Core bookmark app
│   ├── static/       # (e.g., dashboard.js)
│   └── templates/    # (e.g., dashboard.html)
│
├── clip/             # Django project settings & URL configuration
├── manage.py         # Django management script
└── requirements.txt  # Python dependencies
```
---

## 📜 License
This project is licensed under the **MIT License**. See `LICENSE` for more information.

---

## 👤 Contact
Project Link: [https://github.com/im-junaid/Clip](https://github.com/im-junaid/Clip)