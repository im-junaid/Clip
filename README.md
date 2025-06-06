# Clip – Bookmark Manager

**Clip** is a full-stack bookmark manager web application built with **Django** (Python). It lets users securely store and organize favorite website links, mobile apps, desktop apps, etc., in the form of bookmarks—complete with names, descriptions, URLs, tags, and import/export functionality—while also providing an intuitive admin dashboard.  

## 🌟 Key Features

### 🖥️ User Side
- 📑 Browse Saved Bookmarks.
- ✏️ Create / Edit / Delete Bookmarks.
- 🔍 Search & Filter
- 👤 **Profile Page**
  - Import / Export Bookmarks via JSON File


### ⚙️ Admin Side

- 👥 Manage All Users  
- 📂 Manage All Bookmarks  

## 🛠️ Project Stack

- 🐍 **Python**  
- 🌿 **Django**  
- 🐘 **PostgreSQL**  
- 🌐 **HTML**  
- 🌬️ **Tailwind CSS**  
- ✨ **JavaScript** 

## 🛠️ Installation

Follow these steps to set up the project locally:

1. **Clone the Repository:**
```bash
git clone https://github.com/im-junaid/Clip.git
cd clip
```

2. **Create a Virtual Environment:**
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install Dependencies:**
```bash
pip install -r requirements.txt
```
> 🔄 **Use SQLite (development only)**  
> In `clip/settings.py`, comment out the PostgreSQL `DATABASES` block and uncomment (or add) the SQLite configuration:
> ```python
> DATABASES = {
>     'default': {
>         'ENGINE': 'django.db.backends.sqlite3',
>         'NAME': BASE_DIR / 'db.sqlite3',
>     }
> }
> ```

4. **Set Up Environment Variables:**
Create a `.env-dev` file in the project root:
```
DEBUG=""
ALLOWED_HOSTS=""
EMAIL_HOST_USER=""
EMAIL_HOST_PASSWORD=""

# for postgresql DB
DB_NAME=""
DB_USER=""
DB_PASSWORD=""
DB_HOST=""
DB_PORT=5432
```

5. **Apply Migrations:**
```bash
python manage.py makemigrations
python manage.py migrate
```

6. **Create Superuser (Admin Account):**
```bash
python manage.py createsuperuser
```

7. **Run the Development Server:**
```bash
python manage.py runserver
```

Visit: [http://127.0.0.1:8000](http://127.0.0.1:8000)


## 📦 Project Structure
```
├── accounts/ # User authentication & profile management
├── bookmark/ # Core bookmark app (models, views)
├── clip/ # Django project settings & URL configuration
├── db.sqlite3 # SQLite database file (development)
├── manage.py # Django management script
└── requirements.txt # Python dependencies
```

## 📜 License
This project is licensed under the **MIT License**. Feel free to use and modify it.

## 📞 Contact
For any queries or suggestions, contact:
- 🌐 Project GitHub: [https://github.com/im-junaid/Clip](https://github.com/im-junaid/Clip)

---