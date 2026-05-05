# CREDTRACKER - Project Information

## Project Overview

**CREDTRACKER** is a comprehensive cloud-based web application designed to help students efficiently track and manage their academic credits throughout their degree program. The application provides an intuitive interface for monitoring progress, organizing credits by categories, and accessing academic resources, all while maintaining data persistence in the cloud.

**Live URL:** https://credtracker.netlify.app

---

## Core Features

### 1. User Authentication & Authorization
- **Secure Sign Up/Sign In**: Email and password-based authentication system
- **Password Reset**: Forgot password functionality with email-based reset
- **Session Management**: Persistent login sessions with automatic token refresh
- **User Profile Management**: Personalized user accounts with profile information

### 2. Credit Tracking System
- **Credit Entry**: Add, edit, and delete credit entries across different categories
- **Category Management**: Create and organize credits into custom categories and subcategories
- **Real-time Calculations**: Automatic calculation of total credits earned
- **Progress Visualization**: Visual indicators showing progress towards degree completion
- **Credit Validation**: System validates credit totals against user-defined requirements

### 3. Progress Monitoring
- **Real-time Updates**: Instant updates when credits are added or modified
- **Progress Indicators**: Visual representation of completion percentage
- **Total Credit Tracking**: Monitor total credits earned vs. credits required
- **Mismatch Detection**: Alerts when credit totals don't match expected values

### 4. Category Management
- **Hierarchical Organization**: Organize credits into categories and subcategories
- **Dynamic Categories**: Add, edit, and remove categories on the fly
- **Category-specific Totals**: Track credits within each category separately
- **Flexible Structure**: Support for unlimited categories and subcategories

### 5. User Profile Management
- **Profile Information**: Store and edit user name, email, and credit requirements
- **Profile Popover**: Quick access to profile information from header
- **Edit Profile**: Update profile details including total credits required
- **Password Management**: Change password functionality with secure updates

### 6. Onboarding System
- **Multi-step Onboarding**: Guided setup process for new users
- **Name Collection**: Capture user's name during initial setup
- **Credit Requirement Setup**: Configure total credits needed for degree completion
- **Confirmation Step**: Review and confirm details before starting

---

## Advanced Features

### 7. Digital Sticky Notes
- **Create Notes**: Add digital sticky notes anywhere on the screen
- **Drag & Drop**: Move notes to any position on the canvas
- **Persistent Storage**: Notes are saved to user account in database
- **Note Management**: 
  - Edit note content in real-time
  - Delete notes permanently
  - Cut/hide notes temporarily (can be restored)
  - View all notes in a modal list
- **Restore Functionality**: Restore previously hidden/cut notes
- **Color Customization**: Notes with customizable background colors
- **User-specific Notes**: Each user's notes are isolated and private

### 8. Curriculum & Roadmaps Access
- **Dropdown Navigation**: Modern dropdown menu for course selection
- **Multi-level Menu**: Two-level dropdown (Course → Roadmap/Curriculum)
- **PDF Viewer**: Integrated PDF viewer modal for documents
- **Supported Programs**:
  - B. Tech. CSE (Curriculum & Roadmap)
  - Int. M tech CSE (Curriculum & Roadmap)
- **Instant Access**: Quick access to academic documents without leaving the app
- **Responsive Design**: Dropdowns adapt to viewport boundaries

### 9. Info Sidebar
- **Help Documentation**: Comprehensive help section accessible via "?" icon
- **Usage Instructions**: Detailed guides on using all features
- **Tips & Tricks**: Best practices for effective credit tracking
- **Screenshot Examples**: Visual examples demonstrating features
- **Toggle Functionality**: Show/hide sidebar with smooth animations

### 10. Interactive 3D Visualization
- **3D Hero Section**: Engaging 3D model on landing page
- **Interactive Controls**: Rotate, zoom, and pan the 3D visualization
- **Particle Effects**: Dynamic particle system responding to user interaction
- **Smooth Animations**: Fluid transitions and animations
- **Three.js Integration**: Powered by Three.js library for 3D graphics

### 11. Responsive Design
- **Mobile Optimization**: Fully responsive layout for all device sizes
- **Desktop Experience**: Optimized for desktop and tablet viewing
- **Adaptive UI**: Interface elements adjust based on screen size
- **Touch Support**: Touch-friendly interactions for mobile devices

### 12. Landing Page
- **Marketing Section**: Professional landing page with feature highlights
- **Feature Showcase**: Visual cards displaying key features
- **How It Works**: Step-by-step guide for new users
- **Benefits Section**: Clear value propositions
- **Call-to-Action**: Prominent buttons for user engagement

---

## Technology Stack

### Frontend Technologies
- **HTML5**: Semantic markup and structure
- **CSS3**: Modern styling with custom design system
- **JavaScript (ES6+)**: Client-side logic and interactivity
- **Three.js**: 3D graphics and visualization library
- **OrbitControls**: 3D camera controls for interactive models

### Backend Technologies
- **Python**: Backend programming language
- **Flask**: Lightweight web framework for serving static files

### Cloud Services

#### Database & Authentication: Supabase
- **PostgreSQL Database**: Relational database for data storage
- **Authentication Service**: Built-in auth system with email/password
- **Real-time Capabilities**: Real-time data synchronization
- **Row Level Security (RLS)**: Secure data access policies
- **Storage**: Session and data persistence
- **API Integration**: RESTful API for database operations

**Supabase Tables:**
- `users`: User profile information (name, email, total_credits)
- `categories`: Credit categories and subcategories
- `credits`: Individual credit entries
- `sticky_notes`: User's sticky notes with position and content

#### Hosting Service: Netlify
- **Static Site Hosting**: Fast CDN-based hosting
- **Continuous Deployment**: Automatic deployments from Git
- **Build Pipeline**: Automated build process
- **Custom Domain**: Custom domain support (credtracker.netlify.app)
- **HTTPS**: Automatic SSL certificate management
- **Redirect Rules**: SPA routing support with redirect configuration
- **Environment Variables**: Secure configuration management

### Development Tools
- **Node.js**: JavaScript runtime for build tools
- **npm**: Package management
- **Git**: Version control
- **Local Storage**: Client-side session management

---

## Database Schema (Supabase)

### Users Table
```sql
- id (UUID, Primary Key)
- email (Text, Unique)
- name (Text)
- total_credits (Integer)
- created_at (Timestamp)
- updated_at (Timestamp)
```

### Categories Table
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key → users.id)
- name (Text)
- parent_id (UUID, Nullable, Foreign Key → categories.id)
- created_at (Timestamp)
- updated_at (Timestamp)
```

### Credits Table
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key → users.id)
- category_id (UUID, Foreign Key → categories.id)
- credits (Numeric)
- description (Text, Nullable)
- created_at (Timestamp)
- updated_at (Timestamp)
```

### Sticky Notes Table
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key → users.id)
- content (Text)
- x (Numeric) - X position on screen
- y (Numeric) - Y position on screen
- color (Text) - Background color
- created_at (Timestamp)
- updated_at (Timestamp)
```

---

## Architecture

### Client-Side Architecture
- **Single Page Application (SPA)**: All views managed client-side
- **View Management**: Dynamic showing/hiding of different containers
- **State Management**: Local storage and Supabase session management
- **Event-Driven**: Custom events for auth state changes

### Data Flow
1. User interacts with UI
2. JavaScript handles client-side logic
3. Supabase client makes API calls
4. Supabase processes requests (auth/database)
5. Real-time updates reflected in UI

### Authentication Flow
1. User signs up/signs in via Supabase Auth
2. Session token stored in localStorage
3. Auth state listener monitors session changes
4. Protected routes check session validity
5. Auto-refresh tokens maintain session

---

## Key Functionalities

### Data Persistence
- All user data stored in Supabase PostgreSQL database
- Real-time synchronization across sessions
- Automatic data backup and recovery
- Secure data access with RLS policies

### Security Features
- Password hashing (handled by Supabase)
- Secure authentication tokens
- Row-level security for data isolation
- HTTPS encryption for all communications
- CORS configuration for secure API access

### User Experience
- Smooth page transitions
- Loading states and feedback
- Error handling and user notifications
- Keyboard shortcuts (ESC to close modals)
- Tooltips for better guidance
- Responsive design for all devices

### Performance Optimizations
- CDN delivery via Netlify
- Efficient database queries
- Client-side caching
- Optimized asset loading
- Minimal external dependencies

---

## Deployment Configuration

### Netlify Configuration (netlify.toml)
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `public`
- **Node Version**: 18
- **SPA Redirects**: All routes redirect to index.html for client-side routing

### Environment Variables
- Supabase URL and API keys configured in `public/config.js`
- Secure configuration for production deployment

---

## Project Statistics

- **Total Features**: 12 major features
- **Database Tables**: 4 tables (users, categories, credits, sticky_notes)
- **Cloud Services**: 2 (Supabase, Netlify)
- **Frontend Technologies**: 5+ (HTML, CSS, JavaScript, Three.js, etc.)
- **Responsive Breakpoints**: Multiple device sizes supported
- **Authentication Methods**: Email/Password with password reset

---

## Use Cases

1. **Student Credit Tracking**: Students can track their academic progress throughout their degree
2. **Academic Planning**: Plan future courses based on credit requirements
3. **Progress Monitoring**: Visualize completion percentage and remaining credits
4. **Note Taking**: Use sticky notes for reminders and planning
5. **Resource Access**: Quick access to curriculum and roadmap documents
6. **Multi-device Access**: Access account from any device with internet connection

---

## Future Enhancement Possibilities

- Export credit data to PDF/CSV
- Integration with university systems
- Mobile app version
- Collaborative features for advisors
- Advanced analytics and reporting
- Email notifications for milestones
- Calendar integration for course planning

---

## Conclusion

CREDTRACKER is a fully cloud-based application leveraging modern web technologies and cloud services to provide a seamless, secure, and scalable solution for academic credit tracking. The integration of Supabase for database and authentication, combined with Netlify for hosting, demonstrates a complete cloud computing implementation with high availability, scalability, and security.

