# Grocery Buddy - Smart Grocery Deal Finder 🛒

A full-stack application that processes digital flyer data to help users find the best grocery deals across Canadian retailers.

## 🌟 Key Features

### Price Analysis
- Unit normalization (lb/kg/g/oz)
- Multi-item deal parsing ("2 for $5", "3/$10")
- Bilingual price format support (English/French)
- Package unit handling (each/pack/box)

### Smart Categorization
- Custom text similarity matching
- Extensive exclusion rules
- Multi-item listing detection
- Product variant handling

### Data Processing
- Async MongoDB pipeline
- Real-time deduplication
- Price normalization engine
- Canonical category system

## 🏗️ Technology Stack

### Backend
- Python 3.12
- MongoDB with Beanie ODM
- NLTK & scikit-learn for text processing
- Custom regex-based price parser

### Frontend
- React 18
- TailwindCSS
- React Router v6

## 💾 Technical Details

### Price Processing
- Regex-based price extraction
- Multi-currency format support
- Unit conversion system
- Bulk pricing analysis

### Category System
- TF-IDF based similarity matching
- Hierarchical category mapping
- Automated variant detection
- Custom exclusion rules

## 🚀 Setup

[Setup instructions...]

## 🤝 Contributing

[Contributing guidelines...]

## 📝 License

MIT License - see LICENSE file for details.

---

**Note**: This project is for educational purposes only.