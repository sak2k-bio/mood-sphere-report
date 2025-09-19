# MoodSphere - Emotional Health Tracking Application

<div align="center">
  <img src="/public/icon-512.svg" alt="MoodSphere Logo" width="120" height="120">
  
  [![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=flat-square&logo=next.js)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
  [![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
</div>

## 🌟 Overview

MoodSphere is a comprehensive mood tracking Progressive Web Application (PWA) designed to help users monitor and understand their emotional health over time. Built with Next.js 14, TypeScript, and Tailwind CSS, it offers a beautiful, responsive interface for tracking moods, identifying triggers, and gaining insights into emotional patterns.

### 🎯 Key Features

- **📊 Mood Tracking**: Log your emotional state with a detailed 5-question assessment
- **📝 Journal Integration**: Add personal notes to provide context to your mood entries
- **🎨 Beautiful Visualizations**: Interactive charts showing mood trends and patterns
- **🔍 Advanced Analytics**: Discover patterns by day of week, time of day, and mood dimensions
- **🏷️ Trigger Tracking**: Identify and monitor factors affecting your emotional state
- **📱 Mobile-First Design**: Fully responsive with PWA support for installation
- **🌓 Dark Mode**: Comfortable viewing in any lighting condition
- **💾 Data Export/Import**: Backup your data in JSON or CSV format
- **🔒 Privacy-First**: All data stored locally on your device
- **📈 Comprehensive Reports**: Generate detailed reports to share with therapists

## 🚀 Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm, yarn, or pnpm package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/moodsphere.git
cd moodsphere
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm run start
```

### Deploy to Vercel

The easiest way to deploy MoodSphere is using the [Vercel Platform](https://vercel.com):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/moodsphere)

## 📱 Progressive Web App (PWA)

MoodSphere is a PWA and can be installed on your device:

1. **Desktop**: Click the install icon in your browser's address bar
2. **Mobile**: Use the "Add to Home Screen" option in your browser menu

### PWA Features
- Offline functionality with service worker caching
- App-like experience on mobile devices
- Automatic updates when online
- Full-screen mode support

## 🏗️ Architecture

### Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with CSS Variables
- **UI Components**: [Radix UI](https://www.radix-ui.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Charts**: [Recharts](https://recharts.org/)
- **State Management**: React Hooks + Context
- **Data Persistence**: LocalStorage
- **Date Handling**: [date-fns](https://date-fns.org/)
- **Icons**: [Lucide React](https://lucide.dev/)

### Project Structure

```
moodsphere/
├── app/
│   ├── components/       # React components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Home page
│   ├── globals.css      # Global styles
│   ├── providers.tsx    # Context providers
│   └── types.ts         # TypeScript types
├── public/              # Static assets
│   ├── manifest.json    # PWA manifest
│   ├── sw.js           # Service worker
│   └── icons/          # App icons
├── components/ui/       # shadcn/ui components
└── next.config.js      # Next.js configuration
```

## 🎨 Features in Detail

### Mood Assessment
- 5-question evaluation covering:
  - Overall mood
  - Stress management
  - Social connection
  - Energy levels
  - Daily satisfaction
- Visual mood selector with emoji feedback
- Alternative gradient interface option

### Data Visualization
- **Line Charts**: Track mood trends over time
- **Bar Charts**: Analyze patterns by day and time
- **Radar Charts**: View multi-dimensional mood analysis
- **Moving Averages**: See 7-day trend smoothing

### Trigger Management
- Pre-defined common triggers
- Quick selection interface
- Trigger frequency analysis
- Correlation insights in reports

### Journal Feature
- Rich text entries for each mood log
- Searchable journal content
- Character count display
- Optional for each entry

### Data Management
- **Export Options**:
  - JSON format for full backup
  - CSV format for spreadsheet analysis
- **Import Functionality**:
  - Restore from previous backups
  - Data validation on import
- **Privacy**: All data stored locally

## 🛠️ Development

### Component Development

Components follow a consistent pattern:

```typescript
interface ComponentProps {
  // Props definition
}

const Component: React.FC<ComponentProps> = ({ props }) => {
  // Component logic
  return (
    // JSX
  );
};

export default Component;
```

### Adding New Features

1. Create component in `app/components/`
2. Add types to `app/types.ts`
3. Import and use in `app/page.tsx`
4. Update README documentation

### Code Style

- Use TypeScript for type safety
- Follow React best practices
- Use Tailwind CSS for styling
- Maintain consistent naming conventions

## 📊 Data Schema

### MoodEntry Type

```typescript
interface MoodEntry {
  date: string;              // ISO date string
  answers: Answer[];         // Question responses
  overallScore: number;      // Calculated average (0-10)
  triggers?: string[];       // Selected triggers
  journalNote?: string;      // Optional journal entry
}
```

### Storage Format

Data is stored in LocalStorage as JSON:
- Key: `moodEntries`
- Value: Array of `MoodEntry` objects

## 🔐 Privacy & Security

- **No Backend**: All data processing happens in the browser
- **Local Storage**: Data never leaves your device
- **No Analytics**: No tracking or telemetry
- **Open Source**: Full transparency of code
- **Export Control**: You own and control your data

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Write meaningful commit messages
- Add tests for new features
- Update documentation
- Follow existing code style
- Test on multiple devices/browsers

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful component library
- [Radix UI](https://www.radix-ui.com/) for accessible component primitives
- [Recharts](https://recharts.org/) for data visualization
- [Lucide](https://lucide.dev/) for the icon set
- The mental health community for inspiration

## 📧 Support

For support, feature requests, or bug reports:
- Open an issue on GitHub
- Contact: support@moodsphere.app

---

<div align="center">
  Made with ❤️ for better mental health awareness
  
  <a href="https://moodsphere.app">moodsphere.app</a>
</div>