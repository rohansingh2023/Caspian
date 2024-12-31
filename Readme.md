# Caspian

A modern search engine implementation with full-text search, autocomplete, and machine learning recommendations (coming soon). Built with Angular, Express, and TypeScript.

### ⚡️ Key Features

- Full-Text Search: Implements inverted index algorithm for efficient text search
- Smart Autocomplete: Uses Trie data structure for fast prefix-based suggestions
- ML Recommendations: Machine learning based recommendations (Coming Soon)

### 🛠 Tech Stack

- Frontend: Angular
- Backend: Express.js + TypeScript
- Data Storage: Binary files (.bin) for optimized storage
- Algorithms: Inverted Index, Tries

### 🚀 Getting Started

Prerequisites

```bash
node >= 14.0.0
npm >= 6.0.0
```

### Installation

1. Clone the repository

```bash
git clone https://github.com/yourusername/caspian.git
cd search-engine
```

2. Install backend dependencies

```bash
cd backend
npm install
```

3. Install frontend dependencies

```bash
cd ../frontend
npm install
```

### Running the Application

1. Start the backend server

```bash
cd backend
npm run dev
```

2. Start the Angular frontend

```bash
cd frontend
ng serve
```

The application will be available at [http://localhost:4200](http://localhost:4200)

### 🏗 Architecture

##### Backend Components

- Inverted Index Engine: Indexes document terms for efficient search
- Trie-based Autocomplete: Provides real-time search suggestions
- Binary Storage: Optimized data storage using .bin files

##### Frontend Features (Coming soon)

- Search Interface: Clean, responsive search UI
- Real-time Suggestions: Instant autocomplete as you type
- Results Display: Formatted search results with highlighting

### 📈 Performance

- Handles 800MB+ of source data
- Supports 150k+ word dictionary
- Sub-second search response times

### 🗺 Roadmap

- [x] Inverted Index Implementation
- [x] Trie-based Autocomplete
- [ ] ML-based Recommendations
- [ ] Search Results Ranking
- [ ] Query Spell Checker

### 🤝 Contributing

1. Fork the repository

2. Create your feature branch
```bash
git checkout -b feature/AmazingFeature
```
3. Commit your changes 
```bash
git commit -m 'Add some AmazingFeature'
```
4. Push to the branch 
```bash
git push origin feature/AmazingFeature
```
5. Open a Pull Request