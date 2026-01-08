# Compario - AI Powered Price Comparison Application

## Project Overview

Compario is a price comparison application that uses AI (Google Vision API) to identify products from images and compares prices across multiple e-commerce platforms (Amazon, Flipkart, Snapdeal, Vijay Sales, Reliance Digital).

## Tech Stack

### Frontend
- **Framework**: Next.js 15 (React 18)
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI, Lucide React
- **HTTP Client**: Axios
- **AI Integration**: Google Genkit

### Backend
- **Framework**: Django 6.0 with Django REST Framework
- **Database**: PostgreSQL 15+
- **Authentication**: JWT (djangorestframework-simplejwt)
- **APIs**: Google Vision API, eBay Browse API, RapidAPI (Amazon)
- **Image Processing**: Pillow

### Deployment
- **Frontend**: Vercel
- **Backend**: Render or Railway
- **Database**: Railway PostgreSQL or Render PostgreSQL

## Project Structure

```
.
├── compario-frontend/     # Next.js frontend
│   ├── src/
│   │   ├── app/          # Next.js app router
│   │   ├── components/   # React components
│   │   ├── context/      # Auth context
│   │   ├── lib/          # Utilities and API client
│   │   └── hooks/        # Custom React hooks
│   └── public/           # Static assets
├── compario-backend/      # Django backend
│   ├── backend/          # Django project settings
│   ├── api/              # API endpoints
│   ├── users/            # User authentication app
│   └── manage.py         # Django management script
├── scripts/               # Setup scripts
└── README.md              # This file
```

## Prerequisites

- **Node.js** 18+ (for frontend)
- **Python** 3.10+ (for backend)
- **PostgreSQL** 15+ (for database)
- **Git**

## Quick Start

### 1. Backend Setup

```powershell
# Navigate to backend directory
cd compario-backend

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Install dependencies (if not already installed)
pip install -r requirements.txt

# Create .env file with your configuration
# See Environment Variables section below

# Run migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Start backend server
python manage.py runserver
# Or use the startup script:
.\start_backend.ps1
```

Backend will be available at: `http://localhost:8000`

### 2. Frontend Setup

```powershell
# Navigate to frontend directory
cd compario-frontend

# Install dependencies
npm install

# Create .env.local file
# NEXT_PUBLIC_API_URL=http://localhost:8000

# Start frontend server
npm run dev
# Or use the startup script:
.\start_frontend.ps1
```

Frontend will be available at: `http://localhost:3000`

## Environment Variables

### Backend (.env)

Create a `.env` file in `compario-backend/` directory:

```env
DATABASE_NAME=compario_db
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password
DATABASE_HOST=localhost
DATABASE_PORT=5432
DJANGO_SECRET_KEY=your_secret_key_here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# API Keys
GOOGLE_VISION_API_KEY=your_google_vision_key
EBAY_API_KEY=your_ebay_key
RAPIDAPI_KEY=your_rapidapi_key
```

### Frontend (.env.local)

Create a `.env.local` file in `compario-frontend/` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**⚠️ Important**: 
- Never commit `.env` or `.env.local` files to Git
- API keys should **NEVER** be in the frontend. All API calls go through the backend.

## Key Features

- 🔐 **User Authentication**: JWT-based authentication with PostgreSQL
- 📸 **Image Recognition**: Google Vision API for product identification from images
- 💰 **Price Comparison**: Compare prices from multiple e-commerce platforms
- 📊 **Search History**: Save and view past searches
- 🎨 **Modern UI**: Beautiful, responsive interface with Tailwind CSS
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices

## API Endpoints

### Authentication
- `POST /api/auth/signup/` - Register new user
- `POST /api/auth/login/` - Login user
- `POST /api/auth/logout/` - Logout user
- `GET /api/auth/profile/` - Get user profile
- `PUT /api/auth/profile/` - Update profile
- `POST /api/auth/change-password/` - Change password

### Product & Price Comparison
- `POST /api/upload-image/` - Upload image for product detection
- `GET /api/search-prices/` - Search prices for product
- `GET /api/history/` - Get search history
- `DELETE /api/history/{id}/` - Delete history entry

## Development

### Running Both Servers

**Terminal 1 - Backend:**
```powershell
cd compario-backend
.\start_backend.ps1
```

**Terminal 2 - Frontend:**
```powershell
cd compario-frontend
.\start_frontend.ps1
```

### Database Migrations

```powershell
# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate
```

### Testing

```powershell
# Backend tests
python manage.py test

# Frontend tests
npm run test
```

## Security Notes

- ✅ API keys stored only in backend `.env` (never in frontend)
- ✅ JWT tokens for authentication
- ✅ Password hashing with Django's built-in hasher
- ✅ CORS properly configured
- ✅ Environment variables not committed to Git
- ✅ SQL injection protection via Django ORM
- ✅ XSS protection via React's built-in escaping

## Troubleshooting

### Backend Issues

**Database connection error:**
- Verify PostgreSQL is running: `Get-Service -Name postgresql*`
- Check credentials in `.env` file
- Ensure database `compario_db` exists

**Port 8000 already in use:**
```powershell
python manage.py runserver 8001
```

### Frontend Issues

**Cannot connect to API:**
- Verify backend is running on port 8000
- Check `.env.local` has correct `NEXT_PUBLIC_API_URL`
- Verify CORS settings in Django `settings.py`

**Module not found:**
```powershell
npm install
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

[Your License Here]

## Support

For issues or questions:
- Check the troubleshooting section above
- Review the code documentation
- Open an issue on GitHub

---

**Happy Coding! 🚀**
