# ⚡ Quick Customization Guide

This guide helps you quickly customize the Enterprise Authentication Template for your specific needs.

## 🚀 5-Minute Setup

```bash
# 1. Clone and initialize
git clone <repository-url> my-app
cd my-app
./init-project.sh

# 2. Start development
docker-compose up

# 3. Access your app
open http://localhost:3000
```

---

## 🎨 Common Customizations

### 1. Branding & Theming

#### Change Logo and App Name
```typescript
// frontend/src/app/layout.tsx
export const metadata = {
  title: 'Your App Name',
  description: 'Your app description',
}

// frontend/public/logo.svg - Replace with your logo
// frontend/public/favicon.ico - Replace with your favicon
```

#### Update Color Scheme
```css
/* frontend/src/app/globals.css */
:root {
  --primary: 220 90% 56%;        /* Your primary color */
  --primary-foreground: 0 0% 100%;
  --secondary: 240 5% 96%;
  --accent: 240 5% 84%;
  --success: 142 71% 45%;
  --warning: 45 93% 47%;
  --error: 0 84% 60%;
}
```

#### Customize UI Components
```typescript
// frontend/src/components/ui/button.tsx
// Modify default variants and styles
const buttonVariants = cva(
  "your-custom-base-classes",
  {
    variants: {
      variant: {
        default: "your-custom-default-styles",
        // Add your variants
      }
    }
  }
)
```

---

### 2. Authentication Configuration

#### Enable/Disable Auth Methods
```python
# backend/app/core/config.py
AUTH_METHODS = ["email", "oauth", "magic_link"]  # Choose what you need

# backend/app/api/v1/auth.py
# Comment out unwanted endpoints
```

#### Add OAuth Providers
```env
# .env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-secret

GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-secret

# Add more providers
MICROSOFT_CLIENT_ID=your-microsoft-client-id
APPLE_CLIENT_ID=your-apple-client-id
```

#### Customize Password Rules
```python
# backend/app/core/security.py
def is_password_strong(password: str) -> tuple[bool, List[str]]:
    issues: List[str] = []
    
    # Customize your rules
    if len(password) < 12:  # Change minimum length
        issues.append("Password must be at least 12 characters")
    
    # Add custom checks
    if not has_no_common_patterns(password):
        issues.append("Password is too common")
    
    return len(issues) == 0, issues
```

---

### 3. Database Schema Extensions

#### Add Custom User Fields
```python
# backend/app/models/user.py
class User(Base):
    # ... existing fields ...
    
    # Add your custom fields
    phone_number: Mapped[Optional[str]] = mapped_column(String(20))
    date_of_birth: Mapped[Optional[date]] = mapped_column(Date)
    company_name: Mapped[Optional[str]] = mapped_column(String(100))
    subscription_tier: Mapped[str] = mapped_column(String(20), default="free")
    
    # Add JSON field for flexible data
    preferences: Mapped[dict] = mapped_column(JSONB, default=dict)
```

#### Create New Models
```python
# backend/app/models/your_model.py
from app.core.database import Base

class YourModel(Base):
    __tablename__ = "your_table"
    
    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"))
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="your_models")
```

#### Run Migrations
```bash
# Create migration
docker-compose exec backend alembic revision --autogenerate -m "Add custom fields"

# Apply migration
docker-compose exec backend alembic upgrade head
```

---

### 4. API Endpoints

#### Add New Endpoint
```python
# backend/app/api/v1/your_endpoint.py
from fastapi import APIRouter, Depends
from app.schemas.your_schema import YourSchema

router = APIRouter()

@router.post("/your-endpoint", response_model=YourSchema)
async def your_endpoint(
    data: YourSchema,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    # Your logic here
    return result

# Register in backend/app/main.py
app.include_router(your_router, prefix="/api/v1/your-endpoint", tags=["your-tag"])
```

#### Customize API Response Format
```python
# backend/app/schemas/base.py
class CustomApiResponse(BaseModel):
    success: bool
    data: Optional[Any] = None
    error: Optional[dict] = None
    metadata: Optional[dict] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    # Add your custom fields
    request_id: str
    version: str
    rate_limit_remaining: Optional[int] = None
```

---

### 5. Frontend Pages & Components

#### Add New Page
```tsx
// frontend/src/app/your-page/page.tsx
export default function YourPage() {
  return (
    <div>
      <h1>Your Page</h1>
      {/* Your content */}
    </div>
  )
}
```

#### Create Custom Component
```tsx
// frontend/src/components/your-component.tsx
interface YourComponentProps {
  title: string
  // Add your props
}

export function YourComponent({ title }: YourComponentProps) {
  return (
    <div className="your-styles">
      <h2>{title}</h2>
      {/* Your component logic */}
    </div>
  )
}
```

#### Modify Layout
```tsx
// frontend/src/app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <YourHeader />
        <YourSidebar />
        <main>{children}</main>
        <YourFooter />
      </body>
    </html>
  )
}
```

---

### 6. Business Logic

#### Add Custom Permissions
```python
# backend/app/core/permissions.py
class Permissions:
    # Existing permissions
    USERS_READ = "users:read"
    USERS_WRITE = "users:write"
    
    # Add your permissions
    BILLING_MANAGE = "billing:manage"
    REPORTS_VIEW = "reports:view"
    ANALYTICS_FULL = "analytics:*"
```

#### Implement Feature Flags
```python
# backend/app/core/features.py
class FeatureFlags:
    def __init__(self):
        self.flags = {
            "new_dashboard": os.getenv("FEATURE_NEW_DASHBOARD", "false") == "true",
            "ai_features": os.getenv("FEATURE_AI", "false") == "true",
            "beta_api": os.getenv("FEATURE_BETA_API", "false") == "true",
        }
    
    def is_enabled(self, feature: str, user: Optional[User] = None) -> bool:
        # Add user-specific logic
        if user and user.subscription_tier == "pro":
            return True
        return self.flags.get(feature, False)
```

---

### 7. Integrations

#### Add Email Service
```python
# backend/app/services/email_service.py
class CustomEmailService(EmailService):
    async def send_welcome_email(self, user: User):
        await self.send(
            to=user.email,
            subject="Welcome to Our App!",
            template="welcome",
            context={"name": user.first_name}
        )
```

#### Add Payment Processing
```python
# backend/app/services/payment_service.py
import stripe

class PaymentService:
    def __init__(self):
        stripe.api_key = settings.STRIPE_SECRET_KEY
    
    async def create_subscription(self, user: User, plan: str):
        customer = stripe.Customer.create(email=user.email)
        subscription = stripe.Subscription.create(
            customer=customer.id,
            items=[{"price": plan}]
        )
        return subscription
```

#### Add Analytics
```typescript
// frontend/src/lib/analytics.ts
import mixpanel from 'mixpanel-browser'

export class Analytics {
  init() {
    mixpanel.init(process.env.NEXT_PUBLIC_MIXPANEL_TOKEN)
  }
  
  track(event: string, properties?: any) {
    mixpanel.track(event, properties)
  }
  
  identify(userId: string, traits?: any) {
    mixpanel.identify(userId)
    mixpanel.people.set(traits)
  }
}
```

---

## 📁 Important File Locations

### Backend
- **Configuration**: `backend/app/core/config.py`
- **Models**: `backend/app/models/`
- **API Routes**: `backend/app/api/v1/`
- **Services**: `backend/app/services/`
- **Schemas**: `backend/app/schemas/`
- **Middleware**: `backend/app/middleware/`

### Frontend
- **Pages**: `frontend/src/app/`
- **Components**: `frontend/src/components/`
- **API Client**: `frontend/src/lib/api-client.ts`
- **Types**: `frontend/src/types/`
- **Styles**: `frontend/src/app/globals.css`
- **Config**: `frontend/next.config.js`

### Configuration
- **Environment**: `.env`, `.env.development`, `.env.production`
- **Docker**: `docker-compose.yml`, `docker-compose.override.yml`
- **Database**: `backend/alembic/`, `database/init/`

---

## 🔧 Quick Commands

```bash
# Development
docker-compose up               # Start all services
docker-compose logs -f backend   # View backend logs
docker-compose exec backend bash # Access backend shell

# Database
docker-compose exec backend alembic revision --autogenerate -m "description"
docker-compose exec backend alembic upgrade head
docker-compose exec backend python -m app.core.seed_data

# Testing
docker-compose exec backend pytest
docker-compose exec frontend npm test

# Production Build
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

---

## 🚢 Deployment Checklist

Before deploying to production:

- [ ] Change all secret keys in `.env.production`
- [ ] Configure real email service
- [ ] Set up SSL certificates
- [ ] Configure production database
- [ ] Enable monitoring (Sentry, DataDog)
- [ ] Set up backups
- [ ] Configure CDN for static assets
- [ ] Review security headers
- [ ] Test rate limiting
- [ ] Enable audit logging
- [ ] Set up CI/CD pipeline
- [ ] Load test the application
- [ ] Review OWASP Top 10 compliance
- [ ] Document API endpoints
- [ ] Create runbook for operations

---

## 💡 Pro Tips

1. **Use Feature Flags**: Gradually roll out new features
2. **Monitor Everything**: Set up alerts for critical metrics
3. **Cache Aggressively**: Use Redis for frequently accessed data
4. **Optimize Images**: Use Next.js Image component
5. **Lazy Load**: Split code and load on demand
6. **Use TypeScript**: Maintain type safety throughout
7. **Write Tests**: Aim for >80% coverage
8. **Document APIs**: Keep OpenAPI spec updated
9. **Version Control**: Use semantic versioning
10. **Regular Updates**: Keep dependencies current

---

## 🆘 Need Help?

- Check `docs/` folder for detailed documentation
- Review `IMPROVEMENT_PLAN.md` for roadmap
- Search existing issues on GitHub
- Join our Discord community
- Contact support@yourapp.com

Happy coding! 🚀