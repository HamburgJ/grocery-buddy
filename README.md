# Grocery Buddy - Smart Grocery Deal Finder 🛒

A full-stack application that analyzes digital flyer data to help users find the best grocery deals across multiple Canadian retailers.

## 🌟 Key Features

- **Smart Price Analysis**: 
  - Normalizes prices across different units (lb/kg/g/oz)
  - Handles multi-item deals ("2 for $5")
  - Processes bilingual price formats
  - Converts all measurements to consistent units for comparison

- **Intelligent Categorization**:
  - TF-IDF based text similarity matching
  - Extensive category exclusion system
  - Handles product variants and prepared foods
  - Processes multi-item listings

- **Data Processing Pipeline**:
  - Automated deduplication system
  - Price normalization across retailers
  - Canonical category mapping
  - Async data processing

## 🏗️ Technology Stack

### Backend
- Python 3.12
- MongoDB with Beanie ODM
- scikit-learn for text processing
- Custom price parsing engine

### Frontend
- React 18
- TailwindCSS
- React Router v6

## 💾 Data Processing

### Price Normalization
- Converts all weight units to pounds for consistency
- Handles package units (each, pack, box)
- Processes bulk pricing and multi-item deals
- Supports both English and French price formats

### Category System
- Maintains canonical categories for consistent comparison
- Extensive exclusion rules for accurate categorization
- Smart handling of product variants
- Multi-item listing separation