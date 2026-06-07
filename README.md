# Skynet

A comprehensive aviation management and flight tracking platform built with React, TypeScript, and Vite. Skynet provides real-time flight network visualization, aircraft/airline management, analytics, and advanced data structure implementations for optimal performance.

## 🚀 Features

### Core Aviation Features
- **Flight Network Visualization** - Interactive maps showing aircraft positions and flight routes using Leaflet
- **Aircraft Directory** - Browse and manage aircraft information with detailed specifications
- **Airline Directory** - Explore airline data and operations
- **Flight Search & PNR Lookup** - Search flights and passenger name record lookups
- **Logbook Management** - Track personal flight logs and trip statistics
- **Check-In System** - Boarding queue management and cargo hold tracking
- **Rerouting** - Backtrack tree visualization for flight rerouting decisions

### Analytics & Data Processing
- **Advanced Search** - AVL tree-based search with visual representation
- **Analytics Dashboard** - Flight metrics and performance data
- **KMP Search** - Knuth-Morris-Pratt string matching for efficient data lookup
- **Sort Race** - Comparative analysis of sorting algorithms
- **Trip Statistics** - Historical flight data and journey analytics

### Data Management
- **Multi-Source Data Integration** - Support for OpenSky, AIRLabs, and custom data sources
- **IndexedDB Storage** - Efficient client-side data persistence
- **Real-time Clock Synchronization** - Live updates with system time
- **Static Data Management** - Airports, airlines, routes, and more

## 🛠️ Technology Stack

- **Frontend Framework**: React 19 with TypeScript
- **Build Tool**: Vite 8
- **Styling**: Tailwind CSS + PostCSS
- **Mapping**: Leaflet & React-Leaflet with Marker Clustering
- **Charts**: Recharts for data visualization
- **UI Components**: Lucide React for icons
- **Data Processing**: Axios for API calls
- **Linting**: ESLint with TypeScript support

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager

## 🚀 Getting Started

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd skynet
```

2. Install dependencies
```bash
npm install
```

### Development

Start the development server with hot module replacement:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Building

Create an optimized production build:
```bash
npm run build
```

### Preview

Preview the production build locally:
```bash
npm run preview
```

### Linting

Check code quality and fix linting issues:
```bash
npm run lint
```

## 📁 Project Structure

```
src/
├── components/           # React components organized by feature
│   ├── Aircraft/        # Aircraft management UI
│   ├── Airlines/        # Airline information display
│   ├── Analytics/       # Analytics and algorithm visualizations
│   ├── CheckIn/         # Check-in and boarding functionality
│   ├── FlightNetwork/   # Map-based flight visualization
│   ├── Logbook/         # Personal flight logs
│   ├── Rerouting/       # Flight rerouting tools
│   ├── Search/          # Search and lookup features
│   ├── Settings/        # Configuration and data source management
│   └── ui/              # Reusable UI components
├── api/                 # External API integrations
├── context/             # React context for state management
├── data/                # Static data and datasets
├── dsa/                 # Data structure implementations (AVL Tree, KMP, etc.)
├── hooks/               # Custom React hooks
├── types/               # TypeScript type definitions
└── utils/               # Utility functions
```

## 🧠 Data Structures & Algorithms

The project includes optimized implementations of:
- **AVL Tree** - Self-balancing binary search tree
- **KMP Algorithm** - Efficient string pattern matching
- **Sorting Algorithms** - Comparative implementations
- **Graph Structures** - Flight network representation
- **Hash Table** - Key-value data management
- **Heap** - Priority queue operations
- **Queue & Stack** - Linear data structures

## 🌐 API Integrations

- **OpenSky Network** - Real-time aircraft and flight data
- **AIRLabs** - Flight and aircraft information
- **Custom Static Data** - Local airport and route databases

## 💾 Data Persistence

- **IndexedDB** - Client-side database for efficient data caching
- **Local Storage** - User preferences and settings

## 🎨 UI Components

Built-in reusable UI components include:
- Button, Input, Select components
- Status badges and notification badges
- Skeleton loaders
- Card containers

## 📱 Responsive Design

The application is fully responsive and optimized for:
- Desktop browsers
- Tablets
- Mobile devices

Uses Tailwind CSS for efficient responsive styling.

## 🔧 Configuration

- `vite.config.ts` - Vite build configuration
- `tailwind.config.js` - Tailwind CSS customization
- `tsconfig.json` - TypeScript compiler options
- `eslint.config.js` - Code quality rules

## 📝 License

[Add your license information here]

## 👤 Author

[Add author information here]

## 📧 Contact & Support

For issues, feature requests, or support, please [add contact information or issue tracker link here]
