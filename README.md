# Attendance Tracker

A modern web application for tracking client attendance with an intuitive user interface.

## 📋 Overview

Attendance Tracker is a professional web portal designed to help service providers track client attendance across weekdays. The system provides an easy way to record daily attendance, calculate attendance rates, and generate reports on attendance patterns.

## ✨ Features

- **User Authentication** - Secure login system for staff members
- **Client Management** - Add, edit, and manage client profiles
- **Attendance Tracking** - Record daily attendance with options for 2 or 3 hour sessions
- **Weekday Focus** - Calendar automatically filters to show only weekdays
- **Monthly Statistics** - Visual dashboard displaying:
  - Attendance percentage
  - Days scheduled vs days attended
  - Total hours for the month
- **Responsive Design** - Works on desktop and mobile devices

## 🛠️ Tech Stack

- **Frontend**:
  - React + TypeScript (Vite)
  - shadcn/ui components
  - Tailwind CSS for styling
  - Lucide React for icons

- **Backend** (planned):
  - Node.js with Express
  - PostgreSQL database
  - Prisma ORM

## 🚀 Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn

## 📁 Project Structure

```
attendance-tracker/
├── src/
│   ├── assets/            # Static assets (images, icons)
│   ├── components/        # shadcn/ui components
│   │   
│   ├── lib/               # Utility functions and shared code
│   ├──                    # Main page components
│   │  ├── Dashboard.tsx   # Dashboard view with attendance summary
│   │  └── Login.tsx       # User authentication page
│   ├── styles/            # CSS stylesheets
│   │   ├── dashboard.css  # Dashboard-specific styles
│   │   └── login.css      # Login page styles
│   ├── App.tsx            # Main application component
│   ├── App.css            # Global styles
│   ├── main.tsx           # Application entry point
│   └── index.css          # Base styles and Tailwind directives
├── public/                # Public static files
├── .gitignore             # Git ignore file
├── index.html             # HTML entry point
├── package.json           # Project dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── vite.config.ts         # Vite configuration
└── README.md              # Project documentation
```

## 🔄 Core Workflows

### Attendance Tracking

1. Log in to the application
2. Select a client from the client selector
3. View the monthly calendar showing weekdays
4. Record attendance for each day (present/absent)
5. Set hours attended (2 or 3 hours)
6. Save changes

### Reporting

1. Navigate to the dashboard
2. View attendance statistics for the current month
3. Generate detailed reports as needed
4. Export data (planned feature)

## 📊 Data Models

### Client
- ID
- Name
- Email
- Phone
- Scheduled days per month

### Attendance Record
- Client ID
- Date
- Attendance status
- Hours (2 or 3)
- Notes

## 🔜 Roadmap

- [ ] User role management (admin, staff)
- [ ] Email notifications for missed sessions
- [ ] Advanced reporting and analytics
- [ ] Client portal for viewing their own attendance
- [ ] Integration with calendar applications

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Contributors

- [Your Name] - *Initial work*

## 🙏 Acknowledgements

- [React](https://reactjs.org/)
- [Vite](https://vitejs.dev/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)